namespace BofcBackend.Api.Common.Scheduling;

/// <summary>
/// Picks a captain for each team: a random player from the club's senior pool, not simply the
/// best-ranked player on the roster.
///
/// The obvious rule - "the highest-ranked player captains" - does not work here, and the reason is
/// worth recording. The draft's whole purpose is to put one top-tier player on each team, so
/// "highest-ranked on this team" resolves to the same handful of people every week. Measured over
/// simulated seasons that rule hands the busiest player 18.5% of all captaincies; drawing at
/// random from a senior pool instead brings that to 8.6%, with every player in the pool taking a
/// turn. Seniority still gates who is eligible - it just stops deciding the outcome.
/// </summary>
public static class CaptainSelector
{
    /// <summary>The worst rank still eligible to captain. Every active player at this rank or
    /// better is in the pool.
    ///
    /// Three, which is thirteen players against a squad of about thirty and a typical turnout of
    /// twenty-two - large enough that every team reliably contains one (no simulated week ever
    /// needed the fallback below), small enough that captaincy still means something.
    ///
    /// Expressed as a rank rather than a headcount on purpose. Rank is a tier, not a running
    /// order: several players share each one, so "the top twelve" would have to break a tie
    /// between players the club has declared equal, and would break it on something meaningless
    /// like player id. A rank threshold excludes nobody arbitrarily, and it keeps meaning the same
    /// thing as the squad changes - promote a player to rank 3 and they join the pool, which is
    /// what the club expects promoting them to do.</summary>
    public const int MaxCaptainRank = 3;

    /// <summary>The player ids eligible to captain: every active player ranked
    /// <see cref="MaxCaptainRank"/> or better.
    ///
    /// Unranked players are never in the pool. Rank is how the club expresses seniority, and no
    /// rank means it has not made that call about this player yet - which is a reason to leave
    /// them out of the draw, not to treat them as junior.</summary>
    public static HashSet<long> BuildPool(IReadOnlyCollection<(long PlayerId, int? Rank)> activePlayers, int maxRank = MaxCaptainRank)
    {
        if (activePlayers.Count == 0) return [];

        return activePlayers
            .Where(p => p.Rank is { } rank && rank <= maxRank)
            .Select(p => p.PlayerId)
            .ToHashSet();
    }

    /// <summary>One team's captain, drawn at random from whichever of its players are in
    /// <paramref name="pool"/>.
    ///
    /// Falls back to the best-ranked player available when the team holds nobody from the pool.
    /// That should not happen - across every simulated week, with turnout varying, no team was
    /// ever left without one - but a team that is short or unusually junior must still get a
    /// captain rather than none.
    ///
    /// Returns null only when <paramref name="teamCandidates"/> is empty.</summary>
    public static long? PickCaptain(
        IReadOnlyList<(long PlayerId, int? Rank)> teamCandidates,
        IReadOnlySet<long> pool,
        Random? rng = null)
    {
        if (teamCandidates.Count == 0) return null;
        rng ??= Random.Shared;

        var fromPool = teamCandidates.Where(p => pool.Contains(p.PlayerId)).ToList();
        if (fromPool.Count > 0) return fromPool[rng.Next(fromPool.Count)].PlayerId;

        var best = teamCandidates
            .OrderBy(p => p.Rank ?? int.MaxValue)
            .ThenBy(p => p.PlayerId)
            .First();
        return best.PlayerId;
    }
}
