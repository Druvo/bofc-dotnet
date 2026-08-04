using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.RealTime;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Auction.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Auction;

/// <summary>
/// Port of service/auction/AuctionSessionServiceImpl.java — the auction state machine.
/// Java's pessimistic row locking (findByIdForUpdate / findByTournamentIdAndTeamIdForUpdate via
/// @Lock(PESSIMISTIC_WRITE)) has no declarative EF Core equivalent, so PlaceBidAsync and
/// ExecuteSaleAsync run inside an explicit transaction wrapping a raw "SELECT ... FOR UPDATE"
/// (MySQL row lock held until commit), matching Java's behavior instead of EF's default
/// optimistic concurrency.
/// </summary>
public class AuctionSessionService(BofcDbContext db, IAuctionBroadcaster broadcaster)
{
    public async Task<AuctionSessionResponse> GetSessionAsync(long tournamentId)
    {
        var session = await LoadSessionQuery().FirstOrDefaultAsync(s => s.TournamentId == tournamentId);
        return session != null
            ? MapSessionToResponse(session)
            : new AuctionSessionResponse { TournamentId = tournamentId, Status = AuctionSessionStatus.NOT_STARTED };
    }

    public async Task<AuctionSessionResponse> StartAuctionAsync(long tournamentId)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException($"Tournament not found: {tournamentId}");

        if (!tournament.AuctionMode)
        {
            throw new InvalidOperationException("Tournament is not in auction mode");
        }

        var existing = await db.AuctionSessions.FirstOrDefaultAsync(s => s.TournamentId == tournamentId);
        if (existing?.Status == AuctionSessionStatus.RUNNING)
        {
            throw new InvalidOperationException("Auction is already running");
        }

        AuctionSession session;
        if (existing != null)
        {
            session = existing;
            session.Status = AuctionSessionStatus.RUNNING;
            session.StartedAt = DateTime.Now;
        }
        else
        {
            session = new AuctionSession
            {
                TournamentId = tournament.Id,
                Status = AuctionSessionStatus.RUNNING,
                RoundNumber = 1,
                StartedAt = DateTime.Now,
            };
            db.AuctionSessions.Add(session);
        }

        await db.SaveChangesAsync();
        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "AUCTION_STARTED", response);
        return response;
    }

    public async Task<AuctionSessionResponse> PauseAuctionAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);
        session.Status = AuctionSessionStatus.PAUSED;
        session.PausedAt = DateTime.Now;
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "AUCTION_PAUSED", response);
        return response;
    }

    public async Task<AuctionSessionResponse> ResumeAuctionAsync(long tournamentId)
    {
        var session = await db.AuctionSessions.FirstOrDefaultAsync(s => s.TournamentId == tournamentId)
            ?? throw new ResourceNotFoundException("Session not found");

        if (session.Status != AuctionSessionStatus.PAUSED)
        {
            throw new InvalidOperationException("Auction is not paused");
        }

        session.Status = AuctionSessionStatus.RUNNING;

        if (session.CurrentTimerEndsAt != null && session.CurrentAuctionPlayerId != null && session.PausedAt != null)
        {
            var secondsRemaining = (session.CurrentTimerEndsAt.Value - session.PausedAt.Value).TotalSeconds;
            session.CurrentTimerEndsAt = secondsRemaining > 0 ? DateTime.Now.AddSeconds(secondsRemaining) : null;
        }

        session.PausedAt = null;
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "AUCTION_RESUMED", response);
        return response;
    }

    public async Task<AuctionSessionResponse> EndAuctionAsync(long tournamentId)
    {
        var session = await db.AuctionSessions.Include(s => s.CurrentAuctionPlayer)
            .FirstOrDefaultAsync(s => s.TournamentId == tournamentId)
            ?? throw new ResourceNotFoundException("Session not found");

        if (session.CurrentAuctionPlayer is { Status: AuctionPlayerStatus.ON_AUCTION } current)
        {
            current.Status = AuctionPlayerStatus.UNSOLD;
            current.CurrentBid = null;
            current.CurrentHighestTeamId = null;
        }

        var stillAvailable = await db.AuctionPlayers
            .Where(p => p.TournamentId == tournamentId && p.Status == AuctionPlayerStatus.AVAILABLE)
            .ToListAsync();
        foreach (var player in stillAvailable)
        {
            player.Status = AuctionPlayerStatus.UNSOLD;
            player.CurrentBid = null;
            player.CurrentHighestTeamId = null;
        }

        session.Status = AuctionSessionStatus.COMPLETED;
        session.CompletedAt = DateTime.Now;
        session.CurrentAuctionPlayerId = null;
        session.CurrentTimerEndsAt = null;
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "AUCTION_ENDED", response);
        return response;
    }

    public async Task<AuctionSessionResponse> NextPlayerAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);
        var settings = await GetOrCreateDefaultSettingsAsync(tournamentId);
        await ResetOrphanedOnAuctionPlayersAsync(session, tournamentId);

        var nextPlayer = await db.AuctionPlayers
            .Where(p => p.TournamentId == tournamentId && p.Status == AuctionPlayerStatus.AVAILABLE)
            .OrderBy(p => p.SequenceOrder)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No more available players in the pool");

        return await PutPlayerOnAuctionAsync(session, nextPlayer, settings);
    }

    public async Task<AuctionSessionResponse> NextPlayerRandomAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);
        var settings = await GetOrCreateDefaultSettingsAsync(tournamentId);
        await ResetOrphanedOnAuctionPlayersAsync(session, tournamentId);

        var available = await db.AuctionPlayers
            .Where(p => p.TournamentId == tournamentId && p.Status == AuctionPlayerStatus.AVAILABLE)
            .ToListAsync();

        if (available.Count == 0)
        {
            throw new InvalidOperationException("No more available players in the pool");
        }

        var randomPlayer = available[Random.Shared.Next(available.Count)];
        return await PutPlayerOnAuctionAsync(session, randomPlayer, settings);
    }

    public async Task<AuctionSessionResponse> SkipPlayerAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);

        if (session.CurrentAuctionPlayerId == null)
        {
            throw new InvalidOperationException("No player currently on auction");
        }

        var current = await db.AuctionPlayers.FirstAsync(p => p.Id == session.CurrentAuctionPlayerId);
        current.Status = AuctionPlayerStatus.AVAILABLE;
        current.CurrentBid = null;
        current.CurrentHighestTeamId = null;

        session.CurrentAuctionPlayerId = null;
        session.CurrentTimerEndsAt = null;
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "PLAYER_SKIPPED", response);
        return response;
    }

    public async Task<AuctionSessionResponse> MarkSoldAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);

        if (session.CurrentAuctionPlayerId == null)
        {
            throw new InvalidOperationException("No player currently on auction");
        }

        var auctionPlayer = await db.AuctionPlayers.FirstAsync(p => p.Id == session.CurrentAuctionPlayerId);

        if (auctionPlayer.CurrentBid == null || auctionPlayer.CurrentHighestTeamId == null)
        {
            throw new InvalidOperationException("No bids placed for this player");
        }

        return await ExecuteSaleAsync(session, auctionPlayer, tournamentId);
    }

    public async Task<AuctionSessionResponse> MarkUnsoldAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);

        if (session.CurrentAuctionPlayerId == null)
        {
            throw new InvalidOperationException("No player currently on auction");
        }

        var auctionPlayer = await db.AuctionPlayers.FirstAsync(p => p.Id == session.CurrentAuctionPlayerId);
        auctionPlayer.Status = AuctionPlayerStatus.UNSOLD;
        auctionPlayer.CurrentBid = null;
        auctionPlayer.CurrentHighestTeamId = null;

        session.CurrentAuctionPlayerId = null;
        session.CurrentTimerEndsAt = null;
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "PLAYER_UNSOLD", await BuildPlayerResponseByIdAsync(auctionPlayer.Id));
        return response;
    }

    public async Task<AuctionSessionResponse> UndoLastSaleAsync(long tournamentId)
    {
        var winningBid = await db.AuctionBids
            .Where(b => b.TournamentId == tournamentId && b.IsWinning)
            .OrderByDescending(b => b.BidTime)
            .Include(b => b.AuctionPlayer)
            .Include(b => b.Team)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No previous sale to undo");

        var auctionPlayer = winningBid.AuctionPlayer;
        var team = winningBid.Team;

        var budget = await db.TeamBudgets.FirstOrDefaultAsync(b => b.TournamentId == tournamentId && b.TeamId == team.Id)
            ?? throw new ResourceNotFoundException("Budget not found");
        budget.RemainingBudget += winningBid.BidAmount;
        budget.TotalSpent -= winningBid.BidAmount;
        budget.PlayersBought -= 1;

        auctionPlayer.Status = AuctionPlayerStatus.AVAILABLE;
        auctionPlayer.SoldToTeamId = null;
        auctionPlayer.FinalPrice = null;
        auctionPlayer.CurrentBid = null;
        auctionPlayer.CurrentHighestTeamId = null;

        winningBid.IsWinning = false;

        var teamPlayer = await db.TeamPlayers.FirstOrDefaultAsync(tp => tp.TeamId == team.Id && tp.PlayerId == auctionPlayer.PlayerId);
        if (teamPlayer != null)
        {
            db.TeamPlayers.Remove(teamPlayer);
        }

        await db.SaveChangesAsync();

        var session = await db.AuctionSessions.FirstOrDefaultAsync(s => s.TournamentId == tournamentId)
            ?? throw new ResourceNotFoundException("Session not found");

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "SALE_UNDONE", await BuildPlayerResponseByIdAsync(auctionPlayer.Id));
        return response;
    }

    public async Task<AuctionSessionResponse> RestartBiddingAsync(long tournamentId)
    {
        var session = await GetRunningSessionAsync(tournamentId);

        if (session.CurrentAuctionPlayerId == null)
        {
            throw new InvalidOperationException("No player currently on auction");
        }

        var auctionPlayer = await db.AuctionPlayers.FirstAsync(p => p.Id == session.CurrentAuctionPlayerId);
        auctionPlayer.CurrentBid = null;
        auctionPlayer.CurrentHighestTeamId = null;

        var settings = await GetOrCreateDefaultSettingsAsync(tournamentId);
        session.CurrentTimerEndsAt = DateTime.Now.AddSeconds(settings.AuctionTimerSeconds);
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "BIDDING_RESTARTED", response);
        return response;
    }

    public async Task<AuctionSessionResponse> StartUnsoldRoundAsync(long tournamentId)
    {
        var session = await db.AuctionSessions.Include(s => s.CurrentAuctionPlayer)
            .FirstOrDefaultAsync(s => s.TournamentId == tournamentId)
            ?? throw new ResourceNotFoundException("Session not found");

        if (session.CurrentAuctionPlayer is { Status: AuctionPlayerStatus.ON_AUCTION } current)
        {
            current.Status = AuctionPlayerStatus.UNSOLD;
            current.CurrentBid = null;
            current.CurrentHighestTeamId = null;
        }

        var unsoldPlayers = await db.AuctionPlayers
            .Where(p => p.TournamentId == tournamentId && p.Status == AuctionPlayerStatus.UNSOLD)
            .ToListAsync();

        if (unsoldPlayers.Count == 0)
        {
            throw new InvalidOperationException("No unsold players to re-auction");
        }

        var nextRound = session.RoundNumber + 1;
        foreach (var player in unsoldPlayers)
        {
            player.Status = AuctionPlayerStatus.AVAILABLE;
            player.AuctionRound = nextRound;
        }

        session.RoundNumber = nextRound;
        session.Status = AuctionSessionStatus.RUNNING;
        session.CurrentAuctionPlayerId = null;
        session.CurrentTimerEndsAt = null;
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(tournamentId, "UNSOLD_ROUND_STARTED", response);
        return response;
    }

    public async Task<BidResponse> PlaceBidAsync(long tournamentId, BidRequest request, long bidderUserId)
    {
        var session = await GetRunningSessionAsync(tournamentId);
        var settings = await GetOrCreateDefaultSettingsAsync(tournamentId);

        if (session.CurrentAuctionPlayerId == null)
        {
            throw new InvalidOperationException("No player currently on auction");
        }

        if (session.CurrentTimerEndsAt != null && DateTime.Now > session.CurrentTimerEndsAt)
        {
            throw new InvalidOperationException("Auction timer has expired for this player");
        }

        await using var tx = await db.Database.BeginTransactionAsync();

        var auctionPlayer = await LockAuctionPlayerAsync(session.CurrentAuctionPlayerId.Value);

        if (auctionPlayer.Status != AuctionPlayerStatus.ON_AUCTION)
        {
            throw new InvalidOperationException("Player is not currently on auction");
        }

        var budget = await LockTeamBudgetAsync(tournamentId, request.TeamId!.Value);

        var bidder = await db.Players.Include(p => p.Roles).FirstOrDefaultAsync(p => p.Id == bidderUserId)
            ?? throw new ResourceNotFoundException("Bidder not found");
        var isAdminBidder = bidder.Roles.Any(r => r.Name == PlayerRoleNames.Admin || r.Name == PlayerRoleNames.SuperAdmin);

        if (!isAdminBidder && budget.OwnerId != bidderUserId)
        {
            throw new InvalidOperationException("You are not the owner of this team");
        }

        var requiredMinBid = auctionPlayer.CurrentBid == null ? auctionPlayer.BasePrice : auctionPlayer.CurrentBid.Value + settings.BidIncrement;

        if (request.BidAmount!.Value < requiredMinBid)
        {
            throw new InvalidOperationException($"Bid must be at least {requiredMinBid}");
        }

        if (request.BidAmount.Value > budget.RemainingBudget)
        {
            throw new InvalidOperationException($"Insufficient budget. Remaining: {budget.RemainingBudget}");
        }

        if (budget.PlayersBought >= settings.MaxSquadSize)
        {
            throw new InvalidOperationException("Team has reached maximum squad size");
        }

        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId)
            ?? throw new ResourceNotFoundException("Team not found");

        var bid = new AuctionBid
        {
            AuctionSessionId = session.Id,
            TournamentId = session.TournamentId,
            AuctionPlayerId = auctionPlayer.Id,
            TeamId = team.Id,
            BidderUserId = bidder.Id,
            BidAmount = request.BidAmount.Value,
            BidTime = DateTime.Now,
            IsWinning = false,
        };
        db.AuctionBids.Add(bid);

        auctionPlayer.CurrentBid = request.BidAmount.Value;
        auctionPlayer.CurrentHighestTeamId = team.Id;

        if (session.CurrentTimerEndsAt != null)
        {
            var secondsRemaining = (session.CurrentTimerEndsAt.Value - DateTime.Now).TotalSeconds;
            if (secondsRemaining <= settings.ExtendIfBidWithinLastSeconds)
            {
                session.CurrentTimerEndsAt = session.CurrentTimerEndsAt.Value.AddSeconds(settings.TimerExtensionSeconds);
            }
        }

        await db.SaveChangesAsync();
        await tx.CommitAsync();

        var bidResponse = MapBidToResponse(bid, team.TeamName, bidder.Name);

        await broadcaster.BroadcastAsync(tournamentId, "NEW_BID", new Dictionary<string, object?>
        {
            ["bid"] = bidResponse,
            ["remainingSeconds"] = CalculateRemainingSeconds(session),
        });

        return bidResponse;
    }

    public async Task<List<BidResponse>> GetBidsForPlayerAsync(long tournamentId, long auctionPlayerId)
    {
        var bids = await LoadBidsQuery().Where(b => b.AuctionPlayerId == auctionPlayerId)
            .OrderBy(b => b.BidTime).ToListAsync();
        return bids.Select(b => MapBidToResponse(b, b.Team.TeamName, b.BidderUser.Name)).ToList();
    }

    public async Task<List<BidResponse>> GetAllBidsAsync(long tournamentId)
    {
        var bids = await LoadBidsQuery().Where(b => b.TournamentId == tournamentId)
            .OrderByDescending(b => b.BidTime).ToListAsync();
        return bids.Select(b => MapBidToResponse(b, b.Team.TeamName, b.BidderUser.Name)).ToList();
    }

    public async Task<AuctionDashboardResponse> GetDashboardAsync(long tournamentId)
    {
        var session = await LoadSessionQuery().FirstOrDefaultAsync(s => s.TournamentId == tournamentId);

        var allPlayers = await AuctionPlayerPoolServiceQuery()
            .Where(p => p.TournamentId == tournamentId).OrderBy(p => p.SequenceOrder).ToListAsync();
        var soldPlayers = allPlayers.Where(p => p.Status == AuctionPlayerStatus.SOLD).ToList();
        var unsoldPlayers = allPlayers.Where(p => p.Status == AuctionPlayerStatus.UNSOLD).ToList();
        var availablePlayers = allPlayers.Where(p => p.Status == AuctionPlayerStatus.AVAILABLE).ToList();

        AuctionPlayerResponse? currentPlayer = null;
        var currentPlayerBids = new List<BidResponse>();
        if (session?.CurrentAuctionPlayerId != null)
        {
            currentPlayer = AuctionPlayerPoolService.MapToResponse(session.CurrentAuctionPlayer!);
            var bids = await LoadBidsQuery().Where(b => b.AuctionPlayerId == session.CurrentAuctionPlayerId)
                .OrderBy(b => b.BidTime).ToListAsync();
            currentPlayerBids = bids.Select(b => MapBidToResponse(b, b.Team.TeamName, b.BidderUser.Name)).ToList();
        }

        var teamBudgets = await db.TeamBudgets.Include(b => b.Team).Include(b => b.Owner)
            .Where(b => b.TournamentId == tournamentId).ToListAsync();

        return new AuctionDashboardResponse
        {
            Session = session != null ? MapSessionToResponse(session) : null,
            CurrentPlayer = currentPlayer,
            CurrentPlayerBids = currentPlayerBids,
            TeamBudgets = teamBudgets.Select(TeamBudgetService.MapToResponse).ToList(),
            SoldPlayers = soldPlayers.Select(AuctionPlayerPoolService.MapToResponse).ToList(),
            UnsoldPlayers = unsoldPlayers.Select(AuctionPlayerPoolService.MapToResponse).ToList(),
            Statistics = CalculateStats(soldPlayers),
            TotalPlayers = allPlayers.Count,
            SoldCount = soldPlayers.Count,
            UnsoldCount = unsoldPlayers.Count,
            RemainingCount = availablePlayers.Count,
        };
    }

    public async Task<AuctionResultResponse> GetResultsAsync(long tournamentId)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException("Tournament not found");

        var budgets = await db.TeamBudgets.Include(b => b.Team).Include(b => b.Owner)
            .Where(b => b.TournamentId == tournamentId).ToListAsync();
        var allPlayers = await AuctionPlayerPoolServiceQuery()
            .Where(p => p.TournamentId == tournamentId).OrderBy(p => p.SequenceOrder).ToListAsync();

        var teamSquads = budgets.Select(budget =>
        {
            var teamPlayers = allPlayers.Where(p => p.SoldToTeamId == budget.TeamId).ToList();
            return new TeamSquadResponse
            {
                TeamId = budget.Team.Id,
                TeamName = budget.Team.TeamName,
                OwnerName = budget.Owner.Name,
                TotalBudget = budget.TotalBudget,
                TotalSpent = budget.TotalSpent,
                RemainingBudget = budget.RemainingBudget,
                PlayerCount = teamPlayers.Count,
                Players = teamPlayers.Select(AuctionPlayerPoolService.MapToResponse).ToList(),
            };
        }).ToList();

        var unsold = allPlayers.Where(p => p.Status == AuctionPlayerStatus.UNSOLD).ToList();
        var sold = allPlayers.Where(p => p.Status == AuctionPlayerStatus.SOLD).ToList();

        return new AuctionResultResponse
        {
            TournamentId = tournamentId,
            TournamentName = tournament.Name,
            TeamSquads = teamSquads,
            UnsoldPlayers = unsold.Select(AuctionPlayerPoolService.MapToResponse).ToList(),
            Statistics = CalculateStats(sold),
        };
    }

    public async Task NotifyTimerExpiredAsync(long tournamentId)
    {
        var session = await db.AuctionSessions.Include(s => s.CurrentAuctionPlayer)
            .FirstOrDefaultAsync(s => s.TournamentId == tournamentId && s.Status == AuctionSessionStatus.RUNNING);
        if (session == null || session.CurrentTimerEndsAt == null || session.CurrentAuctionPlayerId == null)
        {
            return;
        }

        if (DateTime.Now < session.CurrentTimerEndsAt)
        {
            return;
        }

        session.CurrentTimerEndsAt = null;
        await db.SaveChangesAsync();

        await broadcaster.BroadcastAsync(tournamentId, "TIMER_EXPIRED", await BuildPlayerResponseByIdAsync(session.CurrentAuctionPlayerId.Value));
    }

    public async Task<AuctionSessionResponse> SelectPlayerForAuctionAsync(long tournamentId, long playerId)
    {
        var session = await GetRunningSessionAsync(tournamentId);
        var settings = await GetOrCreateDefaultSettingsAsync(tournamentId);

        var player = await db.AuctionPlayers.FirstOrDefaultAsync(p => p.Id == playerId)
            ?? throw new ResourceNotFoundException("Player not found");

        if (player.Status != AuctionPlayerStatus.AVAILABLE && player.Status != AuctionPlayerStatus.UNSOLD)
        {
            throw new InvalidOperationException("Player is not available for auction");
        }

        await ResetOrphanedOnAuctionPlayersAsync(session, tournamentId);
        return await PutPlayerOnAuctionAsync(session, player, settings);
    }

    // === Private helpers ===

    private async Task<AuctionSettings> GetOrCreateDefaultSettingsAsync(long tournamentId)
    {
        var settings = await db.AuctionSettingsSet.FirstOrDefaultAsync(s => s.TournamentId == tournamentId);
        if (settings != null)
        {
            return settings;
        }

        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new ResourceNotFoundException($"Tournament not found: {tournamentId}");

        settings = new AuctionSettings
        {
            TournamentId = tournament.Id,
            TeamBudget = 100000,
            MinSquadSize = 7,
            MaxSquadSize = 11,
            AuctionTimerSeconds = 60,
            BidIncrement = 1000,
            UnsoldReauctionEnabled = true,
            TimerExtensionSeconds = 15,
            ExtendIfBidWithinLastSeconds = 15,
            AuctionStatus = AuctionStatus.NOT_STARTED,
        };
        db.AuctionSettingsSet.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private async Task<AuctionSession> GetRunningSessionAsync(long tournamentId)
    {
        var session = await db.AuctionSessions.FirstOrDefaultAsync(s => s.TournamentId == tournamentId)
            ?? throw new ResourceNotFoundException("Session not found");
        if (session.Status != AuctionSessionStatus.RUNNING)
        {
            throw new InvalidOperationException($"Auction is not running. Current status: {session.Status}");
        }

        return session;
    }

    private async Task ResetOrphanedOnAuctionPlayersAsync(AuctionSession session, long tournamentId)
    {
        var onAuction = await db.AuctionPlayers
            .Where(p => p.TournamentId == tournamentId && p.Status == AuctionPlayerStatus.ON_AUCTION)
            .ToListAsync();

        foreach (var orphan in onAuction.Where(o => o.Id != session.CurrentAuctionPlayerId))
        {
            orphan.Status = AuctionPlayerStatus.AVAILABLE;
            orphan.CurrentBid = null;
            orphan.CurrentHighestTeamId = null;
        }

        if (onAuction.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }

    private async Task<AuctionSessionResponse> PutPlayerOnAuctionAsync(AuctionSession session, AuctionPlayer player, AuctionSettings settings)
    {
        if (session.CurrentAuctionPlayerId != null)
        {
            var previous = await db.AuctionPlayers.FirstOrDefaultAsync(p => p.Id == session.CurrentAuctionPlayerId);
            if (previous is { Status: AuctionPlayerStatus.ON_AUCTION })
            {
                previous.Status = AuctionPlayerStatus.AVAILABLE;
                previous.CurrentBid = null;
                previous.CurrentHighestTeamId = null;
            }
        }

        player.Status = AuctionPlayerStatus.ON_AUCTION;
        player.CurrentBid = null;
        player.CurrentHighestTeamId = null;

        session.CurrentAuctionPlayerId = player.Id;
        session.CurrentTimerEndsAt = DateTime.Now.AddSeconds(settings.AuctionTimerSeconds);
        await db.SaveChangesAsync();

        var response = await MapSessionToResponseByIdAsync(session.Id);
        await broadcaster.BroadcastAsync(session.TournamentId, "NEXT_PLAYER", await BuildPlayerResponseByIdAsync(player.Id));
        return response;
    }

    private async Task<AuctionSessionResponse> ExecuteSaleAsync(AuctionSession session, AuctionPlayer auctionPlayer, long tournamentId)
    {
        var winningTeamId = auctionPlayer.CurrentHighestTeamId!.Value;
        var finalPrice = auctionPlayer.CurrentBid!.Value;

        auctionPlayer.Status = AuctionPlayerStatus.SOLD;
        auctionPlayer.SoldToTeamId = winningTeamId;
        auctionPlayer.FinalPrice = finalPrice;

        await using var tx = await db.Database.BeginTransactionAsync();

        var budget = await LockTeamBudgetAsync(tournamentId, winningTeamId);
        budget.RemainingBudget -= finalPrice;
        budget.TotalSpent += finalPrice;
        budget.PlayersBought += 1;

        var highestBid = await db.AuctionBids.Where(b => b.AuctionPlayerId == auctionPlayer.Id)
            .OrderByDescending(b => b.BidAmount).FirstOrDefaultAsync();
        if (highestBid != null)
        {
            highestBid.IsWinning = true;
        }

        var player = await db.Players.FirstAsync(p => p.Id == auctionPlayer.PlayerId);
        db.TeamPlayers.Add(new TeamPlayer
        {
            TeamId = winningTeamId,
            PlayerId = player.Id,
            PlayingPosition = player.Position,
            TeamPlayerRole = Domain.Enums.TeamPlayerRole.PLAYER,
            IsCaptain = false,
        });

        session.CurrentAuctionPlayerId = null;
        session.CurrentTimerEndsAt = null;

        await db.SaveChangesAsync();
        await tx.CommitAsync();

        var team = await db.Teams.FirstAsync(t => t.Id == winningTeamId);
        await broadcaster.BroadcastAsync(tournamentId, "PLAYER_SOLD", new Dictionary<string, object?>
        {
            ["player"] = await BuildPlayerResponseByIdAsync(auctionPlayer.Id),
            ["teamName"] = team.TeamName,
            ["finalPrice"] = finalPrice,
            ["teamRemainingBudget"] = budget.RemainingBudget,
        });

        return await MapSessionToResponseByIdAsync(session.Id);
    }

    /// <summary>Acquires a MySQL row lock (SELECT ... FOR UPDATE) that is held until the ambient transaction commits.</summary>
    private async Task<AuctionPlayer> LockAuctionPlayerAsync(long id)
    {
        var locked = await db.AuctionPlayers
            .FromSqlInterpolated($"SELECT * FROM auction_players WHERE id = {id} FOR UPDATE")
            .ToListAsync();
        if (locked.Count == 0)
        {
            throw new ResourceNotFoundException("Auction player not found");
        }

        return locked[0];
    }

    /// <summary>Acquires a MySQL row lock (SELECT ... FOR UPDATE) that is held until the ambient transaction commits.</summary>
    private async Task<TeamBudget> LockTeamBudgetAsync(long tournamentId, long teamId)
    {
        var locked = await db.TeamBudgets
            .FromSqlInterpolated($"SELECT * FROM team_budgets WHERE tournament_id = {tournamentId} AND team_id = {teamId} FOR UPDATE")
            .ToListAsync();
        if (locked.Count == 0)
        {
            throw new ResourceNotFoundException("Budget not found");
        }

        return locked[0];
    }

    private long? CalculateRemainingSeconds(AuctionSession session)
    {
        if (session.CurrentTimerEndsAt == null)
        {
            return null;
        }

        var remaining = (long)(session.CurrentTimerEndsAt.Value - DateTime.Now).TotalSeconds;
        return Math.Max(0, remaining);
    }

    private static AuctionStatsResponse CalculateStats(List<AuctionPlayer> soldPlayers)
    {
        if (soldPlayers.Count == 0)
        {
            return new AuctionStatsResponse();
        }

        var mostExpensive = soldPlayers.MaxBy(p => p.FinalPrice!.Value);
        var cheapest = soldPlayers.MinBy(p => p.FinalPrice!.Value);
        var totalSpent = soldPlayers.Sum(p => p.FinalPrice!.Value);
        var avgPrice = totalSpent / soldPlayers.Count;

        return new AuctionStatsResponse
        {
            MostExpensivePlayerName = mostExpensive?.Player.Name,
            MostExpensivePrice = mostExpensive?.FinalPrice,
            CheapestSoldPlayerName = cheapest?.Player.Name,
            CheapestSoldPrice = cheapest?.FinalPrice,
            AverageSalePrice = avgPrice,
            TotalMoneySpent = totalSpent,
        };
    }

    private IQueryable<AuctionSession> LoadSessionQuery() => db.AuctionSessions
        .Include(s => s.Tournament)
        .Include(s => s.CurrentAuctionPlayer).ThenInclude(p => p!.Player)
        .Include(s => s.CurrentAuctionPlayer).ThenInclude(p => p!.CurrentHighestTeam)
        .Include(s => s.CurrentAuctionPlayer).ThenInclude(p => p!.SoldToTeam);

    private IQueryable<AuctionPlayer> AuctionPlayerPoolServiceQuery() => db.AuctionPlayers
        .Include(p => p.Player).Include(p => p.CurrentHighestTeam).Include(p => p.SoldToTeam);

    private IQueryable<AuctionBid> LoadBidsQuery() => db.AuctionBids.Include(b => b.Team).Include(b => b.BidderUser);

    private async Task<AuctionSessionResponse> MapSessionToResponseByIdAsync(long id) =>
        MapSessionToResponse(await LoadSessionQuery().FirstAsync(s => s.Id == id));

    private async Task<AuctionPlayerResponse> BuildPlayerResponseByIdAsync(long id) =>
        AuctionPlayerPoolService.MapToResponse(await AuctionPlayerPoolServiceQuery().FirstAsync(p => p.Id == id));

    private AuctionSessionResponse MapSessionToResponse(AuctionSession session) => new()
    {
        Id = session.Id,
        TournamentId = session.TournamentId,
        Status = session.Status,
        CurrentPlayer = session.CurrentAuctionPlayer != null ? AuctionPlayerPoolService.MapToResponse(session.CurrentAuctionPlayer) : null,
        RoundNumber = session.RoundNumber,
        StartedAt = session.StartedAt,
        CurrentTimerEndsAt = session.CurrentTimerEndsAt,
        RemainingSeconds = CalculateRemainingSeconds(session),
    };

    private static BidResponse MapBidToResponse(AuctionBid bid, string teamName, string bidderName) => new()
    {
        Id = bid.Id,
        AuctionPlayerId = bid.AuctionPlayerId,
        TeamId = bid.TeamId,
        TeamName = teamName,
        BidderUserId = bid.BidderUserId,
        BidderName = bidderName,
        BidAmount = bid.BidAmount,
        BidTime = bid.BidTime,
        IsWinning = bid.IsWinning,
    };
}
