using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Tournaments.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Tournaments;

/// <summary>Port of service/TournamentServiceImpl.java.</summary>
public class TournamentService(BofcDbContext db) : ITournamentService
{
    public async Task<TournamentResponse> SaveTournamentAsync(TournamentRequest request)
    {
        var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
            ?? throw new VenueServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);

        var defaultTournament = request.DefaultTournament == true;

        var tournament = new Tournament
        {
            Name = StringUtils.NormalizeString(request.TournamentName) ?? string.Empty,
            Title = request.Title,
            Season = request.Season,
            Description = request.Description,
            Rules = request.Rules,
            RoadmapImageUrl = request.RoadmapImageUrl,
            TournamentDate = request.TournamentDate!.Value,
            VenueId = venue.Id,
            TournamentStatus = request.TournamentDate.Value > DateTime.UtcNow ? TournamentStatus.UPCOMING : TournamentStatus.ONGOING,
            IsActive = true,
            SportType = request.SportType != null ? Enum.Parse<SportType>(request.SportType) : SportType.FOOTBALL,
            TournamentType = request.TournamentType != null ? Enum.Parse<TournamentType>(request.TournamentType) : TournamentType.ROUND_ROBIN,
            GroupCount = request.GroupCount,
            AuctionMode = request.AuctionMode,
            DefaultTournament = defaultTournament,
        };

        // Transaction: clearing every other tournament's default flag and saving this one as the
        // new default must succeed together — ExecuteUpdateAsync commits immediately on its own,
        // so without a shared transaction, a failure in the SaveChangesAsync below would leave
        // every tournament with the default flag cleared and none actually set.
        await using var transaction = await db.Database.BeginTransactionAsync();

        if (defaultTournament)
        {
            // Keep exactly one default tournament in the system.
            await db.Tournaments.Where(t => t.DefaultTournament)
                .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.DefaultTournament, false));
        }

        db.Tournaments.Add(tournament);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return await ToDtoAsync(tournament);
    }

    public async Task<TournamentResponse> GetTournamentByIdAsync(long id) => await ToDtoAsync(await GetTournamentEntityAsync(id));

    public async Task UpdateTournamentStatusAsync(long id, bool active)
    {
        var tournament = await GetTournamentEntityAsync(id);
        tournament.IsActive = active;
        await db.SaveChangesAsync();
    }

    public async Task<PaginatedTournamentResponse> GetAllTournamentAsync(int offset, int pageSize, string sortedBy,
        string sortDirection, string? searchColumn, string? searchValue)
    {
        var query = db.Tournaments.Include(t => t.Venue).AsQueryable();

        // Java's TournamentSpecification is only ever invoked with these two hardcoded
        // column names (see TournamentServiceImpl.getAllTournament) — the "dynamic by
        // column name" specification pattern never actually receives arbitrary columns
        // in practice, so this is a faithful behavioral port, not a simplification that
        // drops functionality.
        if (string.Equals(searchColumn, "tournamentDate", StringComparison.OrdinalIgnoreCase) && searchValue != null)
        {
            var searchDate = DateTime.Parse(searchValue);
            query = query.Where(t => t.TournamentDate == searchDate);
        }
        else if (string.Equals(searchColumn, "name", StringComparison.OrdinalIgnoreCase) && searchValue != null)
        {
            query = query.Where(t => t.Name.Contains(searchValue));
        }

        var totalCount = await query.LongCountAsync();

        var pageNo = offset >= 0 ? offset : 0;
        var perPage = pageSize > 0 ? pageSize : 10;
        var ascending = string.Equals(sortDirection, "ASC", StringComparison.OrdinalIgnoreCase);

        query = ApplySort(query, sortedBy, ascending);

        var tournaments = await query.Skip(pageNo * perPage).Take(perPage).ToListAsync();
        var responses = tournaments.Select(ToDto).ToList();

        return new PaginatedTournamentResponse(responses, totalCount);
    }

    private static IQueryable<Tournament> ApplySort(IQueryable<Tournament> query, string sortedBy, bool ascending) =>
        sortedBy.ToLowerInvariant() switch
        {
            "name" => ascending ? query.OrderBy(t => t.Name) : query.OrderByDescending(t => t.Name),
            "tournamentdate" => ascending ? query.OrderBy(t => t.TournamentDate) : query.OrderByDescending(t => t.TournamentDate),
            "tournamentstatus" => ascending ? query.OrderBy(t => t.TournamentStatus) : query.OrderByDescending(t => t.TournamentStatus),
            _ => ascending ? query.OrderBy(t => t.Id) : query.OrderByDescending(t => t.Id),
        };

    public async Task<TournamentResponse> UpdateTournamentAsync(long id, TournamentUpdateRequest request)
    {
        var tournament = await GetTournamentEntityAsync(id);
        var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
            ?? throw new VenueServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);

        tournament.Name = StringUtils.NormalizeString(request.TournamentName) ?? string.Empty;
        tournament.Title = request.Title;
        tournament.Season = request.Season;
        tournament.Description = request.Description;
        tournament.Rules = request.Rules;
        tournament.RoadmapImageUrl = request.RoadmapImageUrl;
        tournament.TournamentDate = request.TournamentDate!.Value;
        tournament.VenueId = venue.Id;

        if (request.SportType != null)
        {
            tournament.SportType = Enum.Parse<SportType>(request.SportType);
        }
        if (request.TournamentType != null)
        {
            tournament.TournamentType = Enum.Parse<TournamentType>(request.TournamentType);
        }
        if (request.GroupCount != null)
        {
            tournament.GroupCount = request.GroupCount;
        }
        tournament.AuctionMode = request.AuctionMode;

        // Transaction — see SaveTournamentAsync's remarks; same reasoning applies to updates.
        await using var transaction = await db.Database.BeginTransactionAsync();

        if (request.DefaultTournament != null)
        {
            var defaultTournament = request.DefaultTournament == true;
            if (defaultTournament)
            {
                // Keep exactly one default tournament in the system.
                await db.Tournaments.Where(t => t.Id != id && t.DefaultTournament)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.DefaultTournament, false));
            }
            tournament.DefaultTournament = defaultTournament;
        }

        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return await ToDtoAsync(tournament);
    }

    public async Task UpdateTournamentStatusesAsync()
    {
        // Transaction: this scheduled job may call CompleteUnfinishedMatchesAsync (which commits
        // immediately via ExecuteUpdateAsync) for several overdue tournaments inside the loop
        // below, then persists every tournament's new status in one SaveChangesAsync at the end.
        // Without a shared transaction, a failure in that final save would leave matches marked
        // COMPLETED for tournaments whose own status never actually got updated.
        await using var transaction = await db.Database.BeginTransactionAsync();

        // Tournaments without fixtures yet — date-based conclusion only.
        var withoutMatches = await db.Tournaments
            .Where(t => t.IsActive && !db.Matches.Any(m => m.TournamentId == t.Id))
            .ToListAsync();
        foreach (var tournament in withoutMatches.Where(t => t.TournamentDate < DateTime.UtcNow))
        {
            tournament.TournamentStatus = TournamentStatus.CONCLUDED;
            tournament.IsActive = false;
        }

        // Tournaments with fixtures — match-based status logic.
        var withMatches = await db.Tournaments
            .Where(t => t.IsActive && db.Matches.Any(m => m.TournamentId == t.Id))
            .ToListAsync();
        foreach (var tournament in withMatches)
        {
            var isOverdue = tournament.TournamentDate.AddDays(1) < DateTime.UtcNow;
            if (isOverdue)
            {
                await CompleteUnfinishedMatchesAsync(tournament.Id);
                tournament.TournamentStatus = TournamentStatus.CONCLUDED;
                tournament.IsActive = false;
                continue;
            }

            var hasOngoing = await db.Matches.AnyAsync(m => m.TournamentId == tournament.Id
                && (m.MatchStatus == MatchStatus.ONGOING || m.MatchStatus == MatchStatus.PAUSED));

            if (hasOngoing)
            {
                tournament.TournamentStatus = TournamentStatus.ONGOING;
            }
            else
            {
                var allFinished = !await db.Matches.AnyAsync(m => m.TournamentId == tournament.Id
                    && (m.MatchStatus == MatchStatus.SCHEDULED || m.MatchStatus == MatchStatus.ONGOING || m.MatchStatus == MatchStatus.PAUSED));

                tournament.TournamentStatus = allFinished ? TournamentStatus.CONCLUDED : TournamentStatus.UPCOMING;
                tournament.IsActive = !allFinished;
            }
        }

        await db.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public async Task ConcludeTournamentAsync(long tournamentId)
    {
        var tournament = await GetTournamentEntityAsync(tournamentId);

        // Transaction: bulk-completing matches (ExecuteUpdateAsync, commits immediately) and
        // marking the tournament CONCLUDED must succeed together — otherwise a failed save
        // leaves every match COMPLETED while the tournament still looks ONGOING.
        await using var transaction = await db.Database.BeginTransactionAsync();

        await CompleteUnfinishedMatchesAsync(tournamentId);
        tournament.TournamentStatus = TournamentStatus.CONCLUDED;
        tournament.IsActive = false;
        await db.SaveChangesAsync();

        await transaction.CommitAsync();
    }

    private async Task CompleteUnfinishedMatchesAsync(long tournamentId)
    {
        await db.Matches
            .Where(m => m.TournamentId == tournamentId && m.MatchStatus != MatchStatus.COMPLETED)
            .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.MatchStatus, MatchStatus.COMPLETED));
    }

    public async Task<TournamentResponse> GetMostRecentTournamentAsync()
    {
        var tournament = await db.Tournaments.Include(t => t.Venue)
            .OrderByDescending(t => t.TournamentDate).FirstOrDefaultAsync()
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);
        return ToDto(tournament);
    }

    public async Task<TournamentResponse?> GetMostRecentActiveTournamentAsync()
    {
        // ONGOING is set once at creation and only ever cleared by an admin
        // manually marking the tournament CONCLUDED — so a tournament whose
        // date has rolled into a previous day can sit at ONGOING forever.
        // Exclude those stale rows here instead of surfacing them as "latest".
        var today = DateTime.UtcNow.Date;
        var tournament = await db.Tournaments.Include(t => t.Venue)
            .Where(t => t.TournamentStatus == TournamentStatus.UPCOMING
                || (t.TournamentStatus == TournamentStatus.ONGOING && t.TournamentDate.Date >= today))
            .OrderBy(t => t.TournamentStatus == TournamentStatus.ONGOING ? 0 : 1)
            .ThenBy(t => t.TournamentDate)
            .FirstOrDefaultAsync();
        return tournament == null ? null : ToDto(tournament);
    }

    public async Task<List<TournamentListResponse>> GetTournamentListAsync(string? year)
    {
        List<Tournament> tournaments;
        if (!string.IsNullOrWhiteSpace(year))
        {
            int yearValue;
            try
            {
                yearValue = DateUtil.ParseYear(year);
            }
            catch (ArgumentException ex)
            {
                throw new TournamentServiceException(ex.Message, HttpStatusCode.BadRequest);
            }
            tournaments = await db.Tournaments.Where(t => t.TournamentDate.Year == yearValue)
                .OrderByDescending(t => t.TournamentDate).ToListAsync();
        }
        else
        {
            tournaments = await db.Tournaments.OrderByDescending(t => t.TournamentDate).ToListAsync();
        }

        return tournaments.Select(t => new TournamentListResponse
        {
            Id = t.Id,
            Name = t.Name,
            TournamentDate = DateUtil.FormatDate(t.TournamentDate),
        }).ToList();
    }

    public async Task<List<string>> GetTournamentSessionsAsync()
    {
        var years = await db.Tournaments.Select(t => t.TournamentDate.Year).Distinct()
            .OrderByDescending(y => y).ToListAsync();
        return years.Select(y => y.ToString()).ToList();
    }

    private async Task<Tournament> GetTournamentEntityAsync(long id) =>
        await db.Tournaments.Include(t => t.Venue).FirstOrDefaultAsync(t => t.Id == id)
        ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);

    private async Task<TournamentResponse> ToDtoAsync(Tournament tournament)
    {
        if (tournament.Venue == null!)
        {
            await db.Entry(tournament).Reference(t => t.Venue).LoadAsync();
        }
        return ToDto(tournament);
    }

    private static TournamentResponse ToDto(Tournament tournament) => new()
    {
        Id = tournament.Id,
        Name = tournament.Name,
        Title = tournament.Title,
        Season = tournament.Season,
        Description = tournament.Description,
        Rules = tournament.Rules,
        RoadmapImageUrl = tournament.RoadmapImageUrl,
        TournamentDate = tournament.TournamentDate,
        ActiveStatus = tournament.IsActive,
        DefaultTournament = tournament.DefaultTournament,
        TournamentStatus = tournament.TournamentStatus,
        VenueName = tournament.Venue.Name,
        VenueMapLink = tournament.Venue.MapLink,
        SportType = tournament.SportType.ToString(),
        TournamentType = tournament.TournamentType.ToString(),
        GroupCount = tournament.GroupCount,
        AuctionMode = tournament.AuctionMode,
    };
}
