using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.Fixtures;
using BofcBackend.Api.Features.Fixtures.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Auto-drafts confirmed participants of an auto-generated MatchDay into balanced teams - the
/// number of teams is derived from turnout and a max-players-per-team cap, not fixed - and
/// auto-schedules their round-robin fixtures. Called by MatchDaySchedulerBackgroundService once a
/// MatchDay is within its configured lead time, and by the admin "Generate now" action for
/// on-demand testing.
/// </summary>
public class WeeklyMatchDayTeamGenerator(BofcDbContext db, IFixtureGenerationService fixtureGenerationService)
{
    /// <summary>No-op (Success=false, Reason explains why) if there aren't enough confirmed
    /// participants to fill every team, or if teams/fixtures already exist for this MatchDay -
    /// safe to call repeatedly. Does not itself check how close the MatchDay is to kickoff - the
    /// scheduler applies that lead-time filter before calling this; the admin "test" action calls
    /// it directly to bypass that wait.</summary>
    public async Task<TeamGenerationResult> GenerateAsync(long matchDayId, int maxPlayersPerTeam)
    {
        if (maxPlayersPerTeam < 2) return TeamGenerationResult.Fail("Players per team must be at least 2.");

        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId);
        if (matchDay is null) return TeamGenerationResult.Fail("MatchDay not found.");

        // DurationMinutes/TimeGapMinutes/MatchDurationMinutes are denormalized onto MatchDay from
        // its originating WeeklyMatchDaySlot. Re-sync them from the CURRENT slot config every time
        // generation is attempted (not just once, and not only when null) - this only ever runs
        // BEFORE teams exist (see the guard below), so there's no "already-scheduled fixtures"
        // to contradict, and it means an admin tweaking the slot's duration/gap on the Settings
        // page and then clicking Generate always gets what they just configured, rather than
        // whatever happened to be snapshotted the first time this ran (which, before this fix,
        // stuck permanently even across a delete-teams-and-regenerate cycle).
        if (matchDay.IsWeeklyMatchDay)
        {
            var slot = await db.WeeklyMatchDaySlots.AsNoTracking()
                .FirstOrDefaultAsync(s => s.DayOfWeek == matchDay.AutoGenSlotDayOfWeek);
            if (slot != null)
            {
                matchDay.DurationMinutes = slot.DurationMinutes;
                matchDay.TimeGapMinutes = slot.TimeGapMinutes;
                matchDay.MatchDurationMinutes = slot.MatchDurationMinutes;
            }
        }

        // Team existence, not the AutoTeamsGenerated flag, is the real source of truth - an admin
        // manually deleting every auto-generated team should make this regeneratable, but the
        // flag alone can't tell "already generated and still has teams" apart from "was generated,
        // then teams got deleted" (DeleteTeamAsync clears the flag when the last team goes, but
        // checking actual team rows here too means this self-heals even if something else ever
        // leaves the flag stale).
        if (await db.Teams.AnyAsync(t => t.MatchDayId == matchDayId))
        {
            return TeamGenerationResult.Fail(matchDay.AutoTeamsGenerated
                ? "Teams were already auto-generated for this MatchDay."
                : "Teams already exist for this MatchDay (added manually).");
        }

        var participants = await db.MatchDayParticipants
            .Include(p => p.Player)
            .Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)
            .Select(p => p.Player)
            .ToListAsync();

        // Team COUNT is derived from turnout, not fixed - maxPlayersPerTeam is a cap (e.g. 6
        // including goalkeeper for casual 5/6/7-a-side), so a big week gets more teams instead
        // of overstuffing a fixed number of them, and a small week still gets at least 2 (you
        // can't schedule a match with only one team). Floor division would let the last team
        // overflow past the cap when participants doesn't divide evenly, so this rounds up.
        var teamCount = Math.Max(2, (int)Math.Ceiling(participants.Count / (double)maxPlayersPerTeam));

        // Teams and their rosters are independent - more players can always be assigned to a
        // team later by hand from Team Building, so this only needs enough confirmed
        // participants to seed every team with at least one player, not a full/even roster
        // upfront (previously required 2 per team, blocking generation whenever RSVPs were
        // still trickling in).
        if (participants.Count < teamCount)
        {
            return TeamGenerationResult.Fail(
                $"Not enough confirmed participants ({participants.Count}) to form at least {teamCount} teams.");
        }

        // Everything from here on is one all-or-nothing unit: two overlapping callers for the
        // same MatchDay (the hourly scheduler tick racing an admin's manual "Generate now", or
        // two scaled-out app instances each running their own hourly timer) must not both pass
        // the checks above and both draft a full set of teams. ExecuteUpdateAsync's WHERE clause
        // is the real guard - it's an atomic compare-and-set at the DB row level, not a
        // check-then-act read+write, so only one concurrent caller can ever flip the flag.
        // Wrapping the rest in the same transaction also means a failure anywhere below (e.g.
        // fixture generation conflicting with matches added manually in the meantime) rolls the
        // claim back too, instead of leaving the MatchDay stuck forever with real teams
        // committed, zero fixtures, and no way to retry because the flag says "already done."
        await using var transaction = await db.Database.BeginTransactionAsync();

        // Claim on "no teams exist right now" (a NOT EXISTS subquery, evaluated atomically as
        // part of this single UPDATE) rather than on the AutoTeamsGenerated flag - this is what
        // makes the claim self-healing even if the flag itself is stuck true from before
        // DeleteTeamAsync started clearing it (or from any other path that ever leaves it stale):
        // there's nothing to "un-stick", the next generation attempt just re-derives the true
        // state from the Teams table every time.
        var claimed = await db.MatchDays
            .Where(t => t.Id == matchDayId && !db.Teams.Any(tm => tm.MatchDayId == matchDayId))
            .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.AutoTeamsGenerated, true));
        if (claimed == 0)
        {
            return TeamGenerationResult.Fail("Teams already exist for this MatchDay.");
        }

        var teams = Enumerable.Range(0, teamCount)
            .Select(i => new Team { TeamName = TeamNaming.DefaultName(i), MatchDayId = matchDayId, MatchDay = matchDay })
            .ToList();
        db.Teams.AddRange(teams);

        foreach (var (player, team) in SnakeDraft(participants, teams))
        {
            db.TeamPlayers.Add(new TeamPlayer
            {
                TeamId = team.Id,
                Team = team,
                PlayerId = player.Id,
                Player = player,
                PlayingPosition = FootballPosition.UNASSIGNED,
                TeamPlayerRole = TeamPlayerRole.PLAYER,
                IsCaptain = false,
            });
        }

        await db.SaveChangesAsync();

        await GenerateFixturesForTeamsAsync(matchDay, teams.Select(t => t.Id).ToList());

        await transaction.CommitAsync();
        return TeamGenerationResult.Ok();
    }

    /// <summary>Last-resort fallbacks - only used if a matching WeeklyMatchDaySlot couldn't be
    /// found to backfill from above (e.g. it was since deleted). Same defaults as the admin's own
    /// manual "Generate Fixtures" button on the Team Building page (see FixtureGenerationModal.tsx),
    /// so an unbackfillable MatchDay still behaves the same as a fresh manual generation.</summary>
    private const int DefaultMatchDurationMinutes = 13;
    private const int DefaultTimeGapMinutes = 2;

    /// <summary>Fits as many round-robin cycles as the MatchDay's own duration allows - same
    /// repeat-to-fill-capacity logic as the manual "Generate Fixtures" flow (see
    /// FixtureGenerationService.GenerateFixturesAsync). Deliberately NOT stretching a single cycle
    /// to exactly fill the whole window (the original approach here): that meant a 2-team MatchDay
    /// only ever got ONE 90-minute match instead of several short ones, since the repeat-to-fill
    /// logic only kicks in when the per-match slot is short enough to fit more than one cycle.</summary>
    private async Task GenerateFixturesForTeamsAsync(MatchDay matchDay, List<long> teamIds)
    {
        var timeGapMinutes = matchDay.TimeGapMinutes ?? DefaultTimeGapMinutes;
        var matchDurationMinutes = matchDay.MatchDurationMinutes ?? DefaultMatchDurationMinutes;

        // Match.MatchDate is a genuinely UTC-shifted value everywhere else it's written - every
        // manual/round/group match-creation path on the frontend (AddMatchModal, EditFixtureModal,
        // RoundMatchGenerationModal, GroupMatchGenerationModal) converts the admin's entered
        // wall-clock time via dayjs(...).utc() before submitting, and every reader (FixturesTable,
        // FixtureCardView, ElectricTeamBanner, etc.) reads it back via moment.utc(...).local() on
        // that same assumption. matchDay.MatchDayDate, by contrast, is naive-local Dhaka wall-clock
        // (see MatchDay.cs) with NO conversion - passing it straight through here previously seeded
        // every auto-generated weekly MatchDay's matches with Dhaka-local numbers mislabeled as
        // UTC, silently shifting their displayed time by Dhaka's fixed 6-hour offset everywhere
        // that reads it with the (correct, for every other match-creation path) .utc().local() convention.
        var matchStartUtc = matchDay.MatchDayDate.AddHours(-6);

        await fixtureGenerationService.GenerateFixturesAsync(matchDay.Id, new FixtureGenerationRequest
        {
            MatchDayId = matchDay.Id,
            TeamIds = teamIds,
            MatchDates = [matchStartUtc],
            MatchDurationMinutes = matchDurationMinutes,
            TimeGapMinutes = timeGapMinutes,
        });
    }

    /// <summary>
    /// Sorts by rank (nulls = lowest tier, shuffled within tied ranks so results aren't stuck in
    /// player-ID order), then deals players to teams in a 1→2→3...→3→2→1 snake pattern so the
    /// strongest and weakest players spread evenly instead of clustering on one team - robust even
    /// when the player count doesn't divide evenly by team count, unlike a strict
    /// "no same rank on one team" rule.
    /// </summary>
    private static IEnumerable<(Player Player, Team Team)> SnakeDraft(List<Player> players, List<Team> teams)
    {
        var rng = Random.Shared;
        var ordered = players
            .GroupBy(p => p.Rank ?? int.MaxValue)
            .OrderBy(g => g.Key)
            .SelectMany(g => g.OrderBy(_ => rng.Next()))
            .ToList();

        var teamCount = teams.Count;
        for (var i = 0; i < ordered.Count; i++)
        {
            var round = i / teamCount;
            var indexInRound = i % teamCount;
            var teamIndex = round % 2 == 0 ? indexInRound : teamCount - 1 - indexInRound;
            yield return (ordered[i], teams[teamIndex]);
        }
    }
}

public class TeamGenerationResult
{
    public bool Success { get; init; }
    public string? Reason { get; init; }

    public static TeamGenerationResult Ok() => new() { Success = true };
    public static TeamGenerationResult Fail(string reason) => new() { Success = false, Reason = reason };
}
