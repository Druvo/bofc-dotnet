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
    ICurrentUserService currentUserService,
    ILogger<FixtureGenerationService> logger)
    : IFixtureGenerationService
{
    /// <summary>The club's own running order for the two team counts it actually plays with,
    /// given rather than derived. Each slot is (home index, away index, does the home team wear
    /// red) - indices point into the selected-team list in selection order, so index 0 is the
    /// "Team A" of the club's printed schedule.
    ///
    /// Worth stating why these aren't generated: the plain sequential round-robin below pairs
    /// 1v2, 1v3, 1v4, ... which puts team 1 in the first three matches back to back with no rest.
    /// These orders space each team out instead. The 3-team schedule plays every pairing twice,
    /// which is what fills a 90-minute window six 15-minute matches wide; the 4-team one is a
    /// single round-robin of all six pairings.
    ///
    /// Both are exactly six slots, so they only make sense for a single-day generation, and a
    /// window too short for six matches will overrun (the existing overrun warning covers it).</summary>
    private static readonly Dictionary<int, (int Home, int Away, bool HomeWearsRed)[]> FixedSchedules = new()
    {
        // Three teams is the same three pairings played twice, with the jerseys swapped the
        // second time round - so every team plays four matches, two in red and two in white,
        // and no pairing ever meets twice in the same colours.
        [3] =
        [
            (0, 1, true),   // A (red)   v B (white)
            (0, 2, true),   // A (red)   v C (white)
            (1, 2, true),   // B (red)   v C (white)
            (0, 1, false),  // A (white) v B (red)
            (0, 2, false),  // A (white) v C (red)
            (1, 2, false),  // B (white) v C (red)
        ],
        [4] =
        [
            (0, 1, true),   // A (red)   v B (white)
            (2, 3, false),  // C (white) v D (red)   - the one slot where home isn't in red
            (0, 2, true),   // A (red)   v C (white)
            (1, 3, true),   // B (red)   v D (white)
            (0, 3, true),   // A (red)   v D (white)
            (1, 2, true),   // B (red)   v C (white)
        ],
    };

    public async Task<List<Match>> GenerateFixturesAsync(long matchDayId, FixtureGenerationRequest request)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        if (await db.Matches.AnyAsync(m => m.MatchDayId == matchDayId && m.MatchStatus == MatchStatus.SCHEDULED))
        {
            throw new MatchDayServiceException(
                $"{RestErrorMessageDetail.FixturesAlreadyExist}. Use the clear fixtures endpoint first or contact administrator.",
                HttpStatusCode.Conflict);
        }

        var allTeams = await db.Teams.Include(t => t.TeamPlayers).Where(t => t.MatchDayId == matchDayId).ToListAsync();

        if (allTeams.Count == 0)
        {
            throw new MatchDayServiceException("No teams found in MatchDay", HttpStatusCode.BadRequest);
        }

        if (allTeams.Count < 2)
        {
            throw new MatchDayServiceException($"{RestErrorMessageDetail.InsufficientTeams}. Minimum 2 teams required.", HttpStatusCode.BadRequest);
        }

        if (request.TeamIds == null || request.TeamIds.Count == 0)
        {
            throw new MatchDayServiceException("Team IDs are required for fixture generation", HttpStatusCode.BadRequest);
        }

        if (request.MatchDates == null || request.MatchDates.Count == 0)
        {
            throw new MatchDayServiceException("At least one match date is required", HttpStatusCode.BadRequest);
        }

        var venue = request.VenueId != null
            ? await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
            : await db.Venues.FirstOrDefaultAsync(v => v.Id == matchDay.VenueId);

        var selectedTeams = allTeams.Where(t => request.TeamIds.Contains(t.Id)).ToList();

        if (selectedTeams.Count == 0)
        {
            throw new MatchDayServiceException("None of the provided team IDs exist in MatchDay", HttpStatusCode.BadRequest);
        }

        if (selectedTeams.Count < 2)
        {
            throw new MatchDayServiceException($"{RestErrorMessageDetail.InsufficientTeams}. At least 2 teams must be selected.", HttpStatusCode.BadRequest);
        }

        var timeGapMinutes = request.TimeGapMinutes ?? 120;
        var matchDurationMinutes = request.MatchDurationMinutes ?? 90;

        // The gap is time AFTER one match ends and BEFORE the next starts - the full
        // slot each match occupies on the schedule is duration + gap, not gap alone
        // (previously this ignored duration entirely, silently overlapping matches
        // whenever gap < duration).
        var slotMinutes = matchDurationMinutes + timeGapMinutes;

        const int minutesPerDay = 12 * 60;
        var matchesPerDay = minutesPerDay / slotMinutes;
        if (matchesPerDay < 1)
        {
            matchesPerDay = 1;
        }

        // Optional one-time break: every match after BreakAfterMatchNumber (1-based) is
        // pushed later by BreakDurationMinutes, on top of its normal slot spacing.
        var breakAfterMatchNumber = request.BreakAfterMatchNumber is > 0 ? request.BreakAfterMatchNumber.Value : (int?)null;
        var breakDurationMinutes = request.BreakDurationMinutes ?? 0;

        var startDate = request.MatchDates[0];

        // One full round-robin cycle - each selected team plays every other once.
        // HomeColor/AwayColor stay null here: the generic path works its jerseys out per match in
        // the loop below. Only the club's fixed schedules (see FixedSchedules) fill them in.
        var basePairings = new List<(Team Home, Team Away, string? HomeColor, string? AwayColor)>();
        for (var i = 0; i < selectedTeams.Count; i++)
        {
            for (var j = i + 1; j < selectedTeams.Count; j++)
            {
                basePairings.Add((selectedTeams[i], selectedTeams[j], null, null));
            }
        }

        // A single round-robin cycle usually only fills a fraction of the MatchDay's own
        // duration (e.g. 3 teams -> 1 cycle -> 3 matches -> 45 min of a 90-min window). For a
        // single-day request, repeat the cycle to use up the remaining time instead of leaving
        // it empty - spreading a REPEATED cycle across multiple days would instead just be
        // padding an intentionally multi-day request with duplicate fixtures, so this only
        // applies when generating for exactly one day.
        var pairings = basePairings;
        if (request.MatchDates.Count == 1 && matchDay.DurationMinutes is int totalDurationMinutes and > 0 && slotMinutes > 0)
        {
            var capacity = Math.Max(basePairings.Count, totalDurationMinutes / slotMinutes);
            if (capacity > basePairings.Count)
            {
                pairings = new List<(Team Home, Team Away, string? HomeColor, string? AwayColor)>(capacity);
                while (pairings.Count < capacity)
                {
                    pairings.AddRange(basePairings);
                }
                pairings = pairings.Take(capacity).ToList();
            }
        }

        // The club's jersey colors are a configurable list (any count, not hardcoded to 2).
        // Two assignment modes:
        //  - Colors == teams: enough jerseys for one each - assign every team a FIXED color for
        //    the whole MatchDay (never changes match to match), so a team is always recognizable
        //    by the same shirt across its whole slate.
        //  - Otherwise (fewer physical jerseys than teams, the original "club owns 2 jerseys, 3+
        //    teams share them" case): rotate through the list match-to-match instead, since teams
        //    must take turns wearing the limited physical jerseys.
        // Left unset if fewer than 2 colors are configured (need 2 distinct colors to tell the
        // teams in a match apart).
        var jerseyColors = await db.JerseyColors.AsNoTracking()
            .Where(j => j.SystemSettingsId == 1)
            .OrderBy(j => j.SortOrder)
            .Select(j => j.Color)
            .ToListAsync();
        var assignJerseys = jerseyColors.Count >= 2;

        Dictionary<long, string>? fixedTeamJerseyColors = null;
        if (assignJerseys && jerseyColors.Count == selectedTeams.Count)
        {
            fixedTeamJerseyColors = new Dictionary<long, string>();
            for (var i = 0; i < selectedTeams.Count; i++)
            {
                fixedTeamJerseyColors[selectedTeams[i].Id] = jerseyColors[i];
            }
        }

        // The club's own running order wins over the generated round-robin for the team counts it
        // actually plays with. Only for a single-day generation: a multi-day request is asking for
        // something these six-slot orders don't describe.
        if (request.MatchDates.Count == 1 && FixedSchedules.TryGetValue(selectedTeams.Count, out var fixedSchedule))
        {
            // Resolved by name, not by position in the configured list: the club's schedule names
            // the red and white shirts specifically, and JerseyColors is sorted white-first, so
            // taking colors[0]/colors[1] would hand every "red" row a white shirt. Falls back to
            // the first two configured colors when a club isn't using red/white at all.
            var redJersey = jerseyColors.FirstOrDefault(c => string.Equals(c, "red", StringComparison.OrdinalIgnoreCase));
            var whiteJersey = jerseyColors.FirstOrDefault(c => string.Equals(c, "white", StringComparison.OrdinalIgnoreCase));
            if (assignJerseys && (redJersey == null || whiteJersey == null))
            {
                redJersey = jerseyColors[0];
                whiteJersey = jerseyColors[1];
            }

            pairings = fixedSchedule
                .Select(slot => (
                    Home: selectedTeams[slot.Home],
                    Away: selectedTeams[slot.Away],
                    HomeColor: assignJerseys ? (slot.HomeWearsRed ? redJersey : whiteJersey) : null,
                    AwayColor: assignJerseys ? (slot.HomeWearsRed ? whiteJersey : redJersey) : null))
                .ToList();

            // Both halves of a fixed slot are set together, so a team's shirt for its next match
            // is already decided - nothing downstream should carry a rotation forward from here.
            fixedTeamJerseyColors = null;
        }

        // Rotation-mode continuity: a team that just played keeps the same jersey into its next
        // match instead of swapping every single match regardless of whether it's even still
        // playing. Only a genuinely new team to this MatchDay (or an unlucky same-color collision
        // between two teams that both arrive already wearing it) gets handed a different color.
        // Keyed by team, not match slot - see PickDifferentJerseyColor for the "no color on
        // record yet" / "collision" fallback.
        var lastJerseyColorByTeamId = new Dictionary<long, string>();

        var matches = new List<Match>();
        var matchOrder = 1;
        var matchIndex = 0;

        foreach (var (home, away, fixedHomeColor, fixedAwayColor) in pairings)
        {
            var dayOffset = matchIndex / matchesPerDay;
            var matchIndexOnDay = matchIndex % matchesPerDay;
            var matchNumber = matchIndex + 1;
            var breakOffset = breakAfterMatchNumber != null && matchNumber > breakAfterMatchNumber ? breakDurationMinutes : 0;

            var matchDate = startDate.AddDays(dayOffset).AddMinutes((double)matchIndexOnDay * slotMinutes + breakOffset);

            string? homeJerseyColor = null;
            string? awayJerseyColor = null;
            if (fixedHomeColor != null && fixedAwayColor != null)
            {
                // Club's fixed schedule already named both shirts for this slot.
                homeJerseyColor = fixedHomeColor;
                awayJerseyColor = fixedAwayColor;
            }
            else if (fixedTeamJerseyColors != null)
            {
                homeJerseyColor = fixedTeamJerseyColors[home.Id];
                awayJerseyColor = fixedTeamJerseyColors[away.Id];
            }
            else if (assignJerseys)
            {
                lastJerseyColorByTeamId.TryGetValue(home.Id, out var homeLastColor);
                lastJerseyColorByTeamId.TryGetValue(away.Id, out var awayLastColor);

                if (homeLastColor != null && awayLastColor != null && homeLastColor != awayLastColor)
                {
                    // Both teams already have a color on record and they don't clash - the ideal
                    // case, e.g. two teams meeting for the first time against each other after
                    // each already played someone else. Neither has to change.
                    homeJerseyColor = homeLastColor;
                    awayJerseyColor = awayLastColor;
                }
                else if (homeLastColor != null && (awayLastColor == null || awayLastColor == homeLastColor))
                {
                    // Home keeps its color (it's the one with an established color, or - in a
                    // same-color collision - the one that gets priority); away is either new to
                    // the MatchDay or the unlucky collision side, either way it takes whatever's
                    // left over.
                    homeJerseyColor = homeLastColor;
                    awayJerseyColor = PickDifferentJerseyColor(jerseyColors, homeLastColor, matchIndex);
                }
                else if (awayLastColor != null)
                {
                    awayJerseyColor = awayLastColor;
                    homeJerseyColor = PickDifferentJerseyColor(jerseyColors, awayLastColor, matchIndex);
                }
                else
                {
                    // Neither team has played yet this MatchDay - same deterministic rotation as
                    // before, just seeded from the match slot so a fresh MatchDay's opening
                    // fixtures still vary instead of always starting on the same two colors.
                    var n = jerseyColors.Count;
                    homeJerseyColor = jerseyColors[matchIndex % n];
                    awayJerseyColor = jerseyColors[(matchIndex + 1) % n];
                }

                lastJerseyColorByTeamId[home.Id] = homeJerseyColor;
                lastJerseyColorByTeamId[away.Id] = awayJerseyColor;
            }

            matches.Add(new Match
            {
                MatchDayId = matchDay.Id,
                MatchDay = matchDay,
                HomeTeamId = home.Id,
                HomeTeam = home,
                AwayTeamId = away.Id,
                AwayTeam = away,
                VenueId = venue?.Id,
                Venue = venue,
                MatchDate = matchDate,
                MatchStatus = MatchStatus.SCHEDULED,
                MatchOrder = matchOrder++,
                HomeTeamScore = 0,
                AwayTeamScore = 0,
                ElapsedTimeSeconds = 0,
                MatchDurationMinutes = matchDurationMinutes,
                HomeJerseyColor = homeJerseyColor,
                AwayJerseyColor = awayJerseyColor,
            });

            matchIndex++;
        }

        // Nothing here checks the generated slate against the MatchDay's own advertised
        // DurationMinutes window - a full round-robin easily overruns it (e.g. 6 matches at
        // 90+120min slots vs. a 90-minute MatchDay) with no signal to the admin who requested
        // it. Not a hard validation error (multi-day generation is a legitimate, expected use of
        // this same method - see matchesPerDay/dayOffset above), just a log line for same-day
        // overruns so it's at least visible in the logs instead of silently wrong.
        if (matches.Count > 0)
        {
            var lastMatch = matches[^1];
            var scheduleEnd = lastMatch.MatchDate.AddMinutes(lastMatch.MatchDurationMinutes ?? matchDurationMinutes);
            var sameDayAsMatchDay = matches.All(m => m.MatchDate.Date == matchDay.MatchDayDate.Date);
            if (sameDayAsMatchDay && matchDay.DurationMinutes is > 0
                && scheduleEnd > matchDay.MatchDayDate.AddMinutes(matchDay.DurationMinutes.Value))
            {
                logger.LogWarning(
                    "Generated fixtures for MatchDay {MatchDayId} run until {ScheduleEnd}, past its own {DurationMinutes}-minute window (ends {MatchDayEnd})",
                    matchDayId, scheduleEnd, matchDay.DurationMinutes,
                    matchDay.MatchDayDate.AddMinutes(matchDay.DurationMinutes.Value));
            }
        }

        db.Matches.AddRange(matches);
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(matchDayId, null, "FIXTURES_GENERATED");
        return matches;
    }

    /// <summary>First configured color that isn't <paramref name="avoid"/>, starting the search at
    /// <paramref name="seed"/> and wrapping - jerseyColors always has >= 2 entries wherever this is
    /// called (assignJerseys gate above), so a non-avoid candidate always exists. Seeding from the
    /// match index rather than always starting at index 0 means a club with 3+ colors doesn't hand
    /// every incoming team the exact same "second" color.</summary>
    private static string PickDifferentJerseyColor(List<string> jerseyColors, string avoid, int seed)
    {
        for (var i = 0; i < jerseyColors.Count; i++)
        {
            var candidate = jerseyColors[(seed + i) % jerseyColors.Count];
            if (candidate != avoid) return candidate;
        }
        return jerseyColors[0];
    }

    public async Task ClearFixturesAsync(long matchDayId)
    {
        var scheduledMatches = await db.Matches
            .Where(m => m.MatchDayId == matchDayId && m.MatchStatus == MatchStatus.SCHEDULED)
            .ToListAsync();

        if (scheduledMatches.Count == 0)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.NoScheduledFixtures, HttpStatusCode.NotFound);
        }

        db.Matches.RemoveRange(scheduledMatches);
        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(matchDayId, null, "FIXTURES_CLEARED");
    }

    public async Task<Match> UpdateMatchFixtureAsync(long matchId, MatchFixtureUpdateRequest request)
    {
        var match = await db.Matches.Include(m => m.MatchDay).Include(m => m.Venue)
            .Include(m => m.HomeTeam).Include(m => m.AwayTeam).Include(m => m.Round)
            .Include(m => m.Group).Include(m => m.MatchEvents)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchIsNotFound, HttpStatusCode.NotFound);

        var isSuperAdmin = currentUserService.IsInRole(PlayerRoleNames.SuperAdmin);
        if (!isSuperAdmin && match.MatchStatus != MatchStatus.SCHEDULED)
        {
            throw new MatchDayServiceException("Cannot update match fixture details once match has started", HttpStatusCode.BadRequest);
        }

        if (request.MatchDate != null)
        {
            match.MatchDate = request.MatchDate.Value;
        }

        if (request.VenueId != null)
        {
            var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
                ?? throw new MatchDayServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);
            match.VenueId = venue.Id;
            match.Venue = venue;
        }

        if (request.HomeJerseyColor != null || request.AwayJerseyColor != null)
        {
            var newHomeColor = request.HomeJerseyColor ?? match.HomeJerseyColor;
            var newAwayColor = request.AwayJerseyColor ?? match.AwayJerseyColor;
            await Common.Util.JerseyColorValidator.ValidateAsync(db, newHomeColor, newAwayColor);
            match.HomeJerseyColor = newHomeColor;
            match.AwayJerseyColor = newAwayColor;
        }

        await db.SaveChangesAsync();
        liveMatchUpdatePublisher.PublishMatchUpdate(match.MatchDayId, match.Id, "FIXTURE_UPDATED");
        return match;
    }
}
