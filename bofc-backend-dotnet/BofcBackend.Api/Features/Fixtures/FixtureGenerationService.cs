using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.RealTime;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Fixtures.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Fixtures;

/// <summary>Port of service/FixtureGenerationServiceImpl.java.</summary>
public class FixtureGenerationService(
    BofcDbContext db,
    ILiveMatchUpdatePublisher liveMatchUpdatePublisher,
    ICurrentUserService currentUserService)
    : IFixtureGenerationService
{
    public async Task<List<Match>> GenerateFixturesAsync(long tournamentId, FixtureGenerationRequest request)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);

        if (await db.Matches.AnyAsync(m => m.TournamentId == tournamentId && m.MatchStatus == MatchStatus.SCHEDULED))
        {
            throw new TournamentServiceException(
                $"{RestErrorMessageDetail.FixturesAlreadyExist}. Use the clear fixtures endpoint first or contact administrator.",
                HttpStatusCode.Conflict);
        }

        var allTeams = await db.Teams.Include(t => t.TeamPlayers).Where(t => t.TournamentId == tournamentId).ToListAsync();

        if (allTeams.Count == 0)
        {
            throw new TournamentServiceException("No teams found in tournament", HttpStatusCode.BadRequest);
        }

        if (allTeams.Count < 2)
        {
            throw new TournamentServiceException($"{RestErrorMessageDetail.InsufficientTeams}. Minimum 2 teams required.", HttpStatusCode.BadRequest);
        }

        if (request.TeamIds == null || request.TeamIds.Count == 0)
        {
            throw new TournamentServiceException("Team IDs are required for fixture generation", HttpStatusCode.BadRequest);
        }

        if (request.MatchDates == null || request.MatchDates.Count == 0)
        {
            throw new TournamentServiceException("At least one match date is required", HttpStatusCode.BadRequest);
        }

        var venue = request.VenueId != null
            ? await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
            : await db.Venues.FirstOrDefaultAsync(v => v.Id == tournament.VenueId);

        var selectedTeams = allTeams.Where(t => request.TeamIds.Contains(t.Id)).ToList();

        if (selectedTeams.Count == 0)
        {
            throw new TournamentServiceException("None of the provided team IDs exist in tournament", HttpStatusCode.BadRequest);
        }

        if (selectedTeams.Count < 2)
        {
            throw new TournamentServiceException($"{RestErrorMessageDetail.InsufficientTeams}. At least 2 teams must be selected.", HttpStatusCode.BadRequest);
        }

        var timeGapMinutes = request.TimeGapMinutes ?? 120;
        var matchDurationMinutes = request.MatchDurationMinutes ?? 90;

        const int minutesPerDay = 12 * 60;
        var matchesPerDay = minutesPerDay / timeGapMinutes;
        if (matchesPerDay < 1)
        {
            matchesPerDay = 1;
        }

        var startDate = request.MatchDates[0];

        var matches = new List<Match>();
        var matchOrder = 1;
        var matchIndex = 0;

        for (var i = 0; i < selectedTeams.Count; i++)
        {
            for (var j = i + 1; j < selectedTeams.Count; j++)
            {
                var dayOffset = matchIndex / matchesPerDay;
                var matchIndexOnDay = matchIndex % matchesPerDay;

                var matchDate = startDate.AddDays(dayOffset).AddMinutes((double)matchIndexOnDay * timeGapMinutes);

                matches.Add(new Match
                {
                    TournamentId = tournament.Id,
                    Tournament = tournament,
                    HomeTeamId = selectedTeams[i].Id,
                    HomeTeam = selectedTeams[i],
                    AwayTeamId = selectedTeams[j].Id,
                    AwayTeam = selectedTeams[j],
                    VenueId = venue?.Id,
                    Venue = venue,
                    MatchDate = matchDate,
                    MatchStatus = MatchStatus.SCHEDULED,
                    MatchOrder = matchOrder++,
                    HomeTeamScore = 0,
                    AwayTeamScore = 0,
                    ElapsedTimeSeconds = 0,
                    MatchDurationMinutes = matchDurationMinutes,
                });

                matchIndex++;
            }
        }

        db.Matches.AddRange(matches);
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(tournamentId, null, "FIXTURES_GENERATED");
        return matches;
    }

    public async Task ClearFixturesAsync(long tournamentId)
    {
        var scheduledMatches = await db.Matches
            .Where(m => m.TournamentId == tournamentId && m.MatchStatus == MatchStatus.SCHEDULED)
            .ToListAsync();

        if (scheduledMatches.Count == 0)
        {
            throw new TournamentServiceException(RestErrorMessageDetail.NoScheduledFixtures, HttpStatusCode.NotFound);
        }

        db.Matches.RemoveRange(scheduledMatches);
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(tournamentId, null, "FIXTURES_CLEARED");
    }

    public async Task<Match> UpdateMatchFixtureAsync(long matchId, MatchFixtureUpdateRequest request)
    {
        var match = await db.Matches.Include(m => m.Tournament).Include(m => m.Venue)
            .Include(m => m.HomeTeam).Include(m => m.AwayTeam).Include(m => m.Round)
            .Include(m => m.Group).Include(m => m.MatchEvents)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.MatchIsNotFound, HttpStatusCode.NotFound);

        var isSuperAdmin = currentUserService.IsInRole(PlayerRoleNames.SuperAdmin);
        if (!isSuperAdmin && match.MatchStatus != MatchStatus.SCHEDULED)
        {
            throw new TournamentServiceException("Cannot update match fixture details once match has started", HttpStatusCode.BadRequest);
        }

        if (request.MatchDate != null)
        {
            match.MatchDate = request.MatchDate.Value;
        }

        if (request.VenueId != null)
        {
            var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
                ?? throw new TournamentServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);
            match.VenueId = venue.Id;
            match.Venue = venue;
        }

        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.TournamentId, match.Id, "FIXTURE_UPDATED");
        return match;
    }
}
