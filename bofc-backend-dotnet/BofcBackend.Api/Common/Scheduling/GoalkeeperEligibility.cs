using BofcBackend.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Answers one narrow question: on a given match day, which players are allowed to take a
/// goalkeeper slot at all?
///
/// This is deliberately separate from the fairness balance in TeamService, which answers the
/// different and larger question of who <em>should</em> go in goal next. The draft needs only the
/// boolean - it is arranging rosters, not picking keepers - and pulling the whole balance
/// calculation into team generation just to get it would drag the scheduler into the ranking
/// rules it has no business knowing.
///
/// The two rules encoded here (admin exclusion, and resting after a recent turn) are the same two
/// the balance calculation applies. <see cref="RestingWindowMatchDays"/> is the single definition
/// of the resting window, referenced from both, so the rule cannot drift between the code that
/// arranges the teams and the code that fills the slots.
/// </summary>
public class GoalkeeperEligibility(BofcDbContext db)
{
    /// <summary>How many recent match days keep a player out of goal after they have kept it.
    ///
    /// Two, so nobody goes in goal on consecutive weeks - the club's own rule. It bites harder
    /// than it looks: at two keepers per team across four teams, eight players a week are put
    /// into a two-week rest, which on a squad of this size leaves the eligible pool only just
    /// larger than the number of slots. That is by design and worth keeping, but it is also why
    /// the draft has to distribute eligible keepers deliberately rather than by luck.</summary>
    public const int RestingWindowMatchDays = 2;

    /// <summary>Player ids from <paramref name="candidatePlayerIds"/> who may take a goalkeeper
    /// slot on <paramref name="matchDayId"/>: not admin-excluded from the rotation, and not
    /// resting off a turn in goal within the last <see cref="RestingWindowMatchDays"/> match days.
    ///
    /// Default goalkeepers are NOT special-cased here - callers layer that on, because "can take a
    /// slot" and "has asked to always take a slot" are different facts and the second one belongs
    /// to the player record, not to this match day's history.</summary>
    public async Task<HashSet<long>> GetRotationEligibleAsync(long matchDayId, IReadOnlyCollection<long> candidatePlayerIds)
    {
        if (candidatePlayerIds.Count == 0) return [];

        var matchDay = await db.MatchDays.AsNoTracking().FirstOrDefaultAsync(m => m.Id == matchDayId);
        if (matchDay is null) return [];

        var recentMatchDayIds = await db.MatchDays.AsNoTracking()
            .Where(m => m.MatchDayDate < matchDay.MatchDayDate)
            .OrderByDescending(m => m.MatchDayDate)
            .Take(RestingWindowMatchDays)
            .Select(m => m.Id)
            .ToListAsync();

        var restingPlayerIds = recentMatchDayIds.Count == 0
            ? []
            : await db.PlayerGoalkeepingHistories.AsNoTracking()
                .Where(h => recentMatchDayIds.Contains(h.MatchDayId) && candidatePlayerIds.Contains(h.PlayerId))
                .Select(h => h.PlayerId)
                .Distinct()
                .ToListAsync();

        var excludedPlayerIds = await db.Players.AsNoTracking()
            .Where(p => candidatePlayerIds.Contains(p.Id) && p.ExcludeFromGoalkeeperRotation)
            .Select(p => p.Id)
            .ToListAsync();

        var ineligible = restingPlayerIds.Concat(excludedPlayerIds).ToHashSet();
        return candidatePlayerIds.Where(id => !ineligible.Contains(id)).ToHashSet();
    }
}
