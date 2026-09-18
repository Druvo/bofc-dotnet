namespace BofcBackend.Api.Common.Scheduling;

/// <summary>One player as the draft sees them. Deliberately not the <c>Player</c> entity: the
/// draft is pure arithmetic over rank and goalkeeping availability, and keeping it free of EF
/// means it can be reasoned about (and simulated) without a database.</summary>
/// <param name="Rank">Admin-set skill tier, 1 = strongest. Null = unranked, treated as the
/// weakest tier - same convention as everywhere else Rank is read.</param>
/// <param name="IsDefaultGoalkeeper">"Only ever wants to play goalkeeper" (Player.DefaultGoalkeeper).</param>
/// <param name="CanRotateInGoal">Eligible for the fairness rotation this match day: not
/// admin-excluded, and not resting off a recent turn in goal. Note this is deliberately
/// independent of <paramref name="IsDefaultGoalkeeper"/> - see <see cref="CanKeepGoal"/>.</param>
public sealed record DraftCandidate(long PlayerId, int? Rank, bool IsDefaultGoalkeeper, bool CanRotateInGoal)
{
    /// <summary>Whether this player could take a goalkeeper slot at all.
    ///
    /// A default goalkeeper always can, regardless of the rotation's resting rule. That rule
    /// exists so nobody is stuck in goal two weeks running - which is exactly what a default
    /// goalkeeper has asked for, so applying it to them would make the flag self-defeating:
    /// they would keep goal once, be marked resting, and never be picked again.</summary>
    public bool CanKeepGoal => IsDefaultGoalkeeper || CanRotateInGoal;

    /// <summary>Strength for balancing purposes. Only the spread between teams matters, not the
    /// absolute scale - this just inverts Rank so "bigger is stronger" and puts unranked players
    /// at the bottom.</summary>
    public int Strength => Rank is { } r ? Math.Max(0, 11 - r) : 0;
}

/// <summary>
/// Turns a flat list of confirmed participants into balanced teams that can actually field the
/// goalkeepers they need.
///
/// The draft alone - snake-dealing by rank - produces well-balanced teams but is blind to who
/// can keep goal, and goalkeeper selection later only ever picks from a team's OWN roster. On
/// this club's real turnout that combination left at least one team unable to fill its keeper
/// slots in roughly four weeks out of five, not because the club lacked eligible keepers but
/// because the deal scattered them. So the deal is followed by two repair passes that swap
/// players between teams until the goalkeeping constraints hold.
///
/// Repairs swap rather than move, so team sizes are fixed by the deal and never disturbed, and
/// they always swap the closest-ranked pair available, so the balance the deal achieved survives
/// almost untouched.
/// </summary>
public static class SquadBalancer
{
    /// <summary>Drafts <paramref name="players"/> into <paramref name="teamCount"/> teams, then
    /// repairs the result so that - as far as the roster allows - every team has at most one
    /// default goalkeeper and enough players who can keep goal to fill
    /// <paramref name="minGoalkeepersPerTeam"/> slots.
    ///
    /// Returns teams in index order; the caller maps index to team name. Repairs are best-effort:
    /// when the squad genuinely does not contain enough eligible keepers, this gets as close as it
    /// can rather than failing, and the caller reports the shortfall (goalkeeper assignment
    /// already surfaces "not enough eligible players" per team).</summary>
    /// <param name="rng">Injectable for deterministic testing; defaults to <see cref="Random.Shared"/>.</param>
    public static List<List<DraftCandidate>> Draft(
        IReadOnlyList<DraftCandidate> players,
        int teamCount,
        int minGoalkeepersPerTeam,
        Random? rng = null)
    {
        ArgumentNullException.ThrowIfNull(players);
        if (teamCount < 1) throw new ArgumentOutOfRangeException(nameof(teamCount), teamCount, "At least one team is required.");

        rng ??= Random.Shared;

        var teams = SnakeDeal(players, teamCount, rng);
        SpreadDefaultGoalkeepers(teams, rng);
        RepairGoalkeeperCover(teams, minGoalkeepersPerTeam);
        return teams;
    }

    /// <summary>Sorts by rank (nulls last, shuffled within a tier so results aren't stuck in
    /// player-ID order), then deals 1→2→3...→3→2→1 so the strongest and weakest players spread
    /// evenly instead of clustering.
    ///
    /// The serpentine is what makes this work, and it is worth stating why the obvious
    /// alternative is not used: letting the currently-weakest team pick next measures more than
    /// twice the strength spread of this snake on real turnout, because greedy correction on
    /// running totals overshoots early and cannot recover.</summary>
    private static List<List<DraftCandidate>> SnakeDeal(IReadOnlyList<DraftCandidate> players, int teamCount, Random rng)
    {
        var ordered = players
            .GroupBy(p => p.Rank ?? int.MaxValue)
            .OrderBy(g => g.Key)
            .SelectMany(g => g.OrderBy(_ => rng.Next()))
            .ToList();

        var teams = new List<List<DraftCandidate>>(teamCount);
        for (var i = 0; i < teamCount; i++) teams.Add([]);

        for (var i = 0; i < ordered.Count; i++)
        {
            var round = i / teamCount;
            var indexInRound = i % teamCount;
            var teamIndex = round % 2 == 0 ? indexInRound : teamCount - 1 - indexInRound;
            teams[teamIndex].Add(ordered[i]);
        }

        return teams;
    }

    /// <summary>Levels default goalkeepers across teams, so two never pile onto one roster while
    /// another has none.
    ///
    /// A default goalkeeper occupies one of their team's keeper slots and the rotation fills the
    /// rest, so a second one on the same team is close to wasted: they would play outfield while
    /// some other team went without. The club has only one such player today, which is precisely
    /// why this is worth doing now - the failure is invisible until a second is added, and then
    /// it is silent.</summary>
    private static void SpreadDefaultGoalkeepers(List<List<DraftCandidate>> teams, Random rng)
    {
        // Only ever moves the surplus. A team already holding exactly one is left alone.
        for (var guard = 0; guard < teams.Count * 4; guard++)
        {
            var donor = -1;
            var receiver = -1;
            var donorCount = 1;

            for (var i = 0; i < teams.Count; i++)
            {
                var count = teams[i].Count(p => p.IsDefaultGoalkeeper);
                if (count > donorCount) { donorCount = count; donor = i; }
                if (count == 0) receiver = i;
            }

            if (donor < 0 || receiver < 0) return;

            // Hand over the surplus keeper and take back the closest-ranked non-keeper, so the
            // swap costs the balance as little as possible.
            var moving = teams[donor].Where(p => p.IsDefaultGoalkeeper).OrderBy(_ => rng.Next()).First();
            var returning = teams[receiver]
                .Where(p => !p.IsDefaultGoalkeeper)
                .OrderBy(p => Math.Abs(p.Strength - moving.Strength))
                .ThenBy(_ => rng.Next())
                .FirstOrDefault();

            // Nothing to trade back with (a one-player team, or all default keepers): moving the
            // player anyway would unbalance the roster sizes the deal fixed, so leave it.
            if (returning is null) return;

            teams[donor].Remove(moving);
            teams[receiver].Remove(returning);
            teams[donor].Add(returning);
            teams[receiver].Add(moving);
        }
    }

    /// <summary>Swaps players between teams until every team holds at least
    /// <paramref name="minGoalkeepersPerTeam"/> players who can keep goal, or no useful swap
    /// remains.
    ///
    /// Each pass moves one able keeper from the team with the largest surplus to the team with
    /// the largest shortfall, taking back the closest-ranked player who cannot keep goal. Teams
    /// are only ever drained to their own requirement, never below it, so fixing one team cannot
    /// break another.</summary>
    private static void RepairGoalkeeperCover(List<List<DraftCandidate>> teams, int minGoalkeepersPerTeam)
    {
        if (minGoalkeepersPerTeam <= 0) return;

        // Bounded rather than while(true): every successful pass strictly reduces total shortfall,
        // so this cannot need more iterations than there are slots, and the bound means a future
        // change to the swap rules degrades into "not fully repaired" instead of hanging.
        var maxPasses = teams.Count * minGoalkeepersPerTeam + teams.Count;

        for (var pass = 0; pass < maxPasses; pass++)
        {
            var cover = teams.Select(t => t.Count(p => p.CanKeepGoal)).ToList();

            var receiver = -1;
            var shortfall = 0;
            var donor = -1;
            var surplus = 0;

            for (var i = 0; i < teams.Count; i++)
            {
                var missing = minGoalkeepersPerTeam - cover[i];
                if (missing > shortfall) { shortfall = missing; receiver = i; }

                var spare = cover[i] - minGoalkeepersPerTeam;
                if (spare > surplus) { surplus = spare; donor = i; }
            }

            if (receiver < 0 || donor < 0) return;

            // Choose the PAIR, not each end independently. Picking the outgoing keeper first and
            // then the closest match to them still lets a strong-for-weak trade through whenever
            // the receiving team happens to hold nobody of similar strength; scoring whole pairs
            // finds the trade that moves the least strength between the two teams. Doing it the
            // naive way measurably costs balance, which is the whole thing the deal just bought.
            //
            // Default goalkeepers are given up last: one is already spoken for by their own team's
            // first slot, and moving them would just undo what SpreadDefaultGoalkeepers settled.
            var swap = teams[donor]
                .Where(p => p.CanKeepGoal)
                .SelectMany(_ => teams[receiver].Where(p => !p.CanKeepGoal), (moving, returning) => (Moving: moving, Returning: returning))
                .OrderBy(x => x.Moving.IsDefaultGoalkeeper ? 1 : 0)
                .ThenBy(x => Math.Abs(x.Moving.Strength - x.Returning.Strength))
                .ThenBy(x => x.Moving.PlayerId)
                .ThenBy(x => x.Returning.PlayerId)
                .Select(x => (x.Moving, x.Returning, Found: true))
                .FirstOrDefault();

            // The receiving team is all keepers already, or the donor has nothing spare to give:
            // no swap exists that improves things without breaking roster sizes.
            if (!swap.Found) return;

            teams[donor].Remove(swap.Moving);
            teams[receiver].Remove(swap.Returning);
            teams[donor].Add(swap.Returning);
            teams[receiver].Add(swap.Moving);
        }
    }
}
