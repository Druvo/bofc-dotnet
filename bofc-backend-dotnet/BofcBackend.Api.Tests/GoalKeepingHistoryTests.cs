using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Common.Storage;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Players;
using Microsoft.Extensions.Options;

// SPEC: spec-648c30 - Goalkeeper Records (GET players/goal-keeper-history) lists only Active
// players: inactive, paused and inactive-and-paused players appear neither as history rows nor
// as the empty rows each round is padded with. GET players itself still lists everyone.
public static class GoalKeepingHistoryTests
{
    public static (string Name, Func<Task> Run)[] All =>
    [
        ("goal-keeper-history leaves out paused and inactive players", async () =>
        {
            var db = new BofcDbContext();
            var active = AddPlayer(db, 1, "Active Ann", isActive: true, isPaused: false);
            var paused = AddPlayer(db, 2, "Paused Pat", isActive: true, isPaused: true);
            var both = AddPlayer(db, 3, "Gone Gil", isActive: false, isPaused: true);
            AddHistory(db, active, round: 1, playedDate: new DateTime(2026, 10, 1));
            AddHistory(db, paused, round: 2, playedDate: new DateTime(2026, 10, 8));
            AddHistory(db, both, round: 2, playedDate: new DateTime(2026, 10, 15));

            var history = await Build(db).GoalKeepingHistoryAsync();

            foreach (var (round, rows) in history)
            {
                var names = string.Join(", ", rows.Select(r => r.PlayerName));
                if (rows.Count != 1 || rows[0].PlayerId != active.Id)
                {
                    throw new Exception($"round {round}: expected only \"Active Ann\", got [{names}]");
                }
            }
            if (!history.TryGetValue(1, out var roundOne) || roundOne[0].PlayedDate != new DateTime(2026, 10, 1))
            {
                throw new Exception("round 1: expected Active Ann's own history row");
            }
        }),
        ("GET players still returns every player, paused and inactive included", async () =>
        {
            var db = new BofcDbContext();
            AddPlayer(db, 1, "Active Ann", isActive: true, isPaused: false);
            AddPlayer(db, 2, "Paused Pat", isActive: true, isPaused: true);
            AddPlayer(db, 3, "Gone Gil", isActive: false, isPaused: true);

            var players = await Build(db).GetAllPlayersAsync();

            var listed = string.Join(", ", players.OrderBy(p => p.Id).Select(p => $"{p.Name} active={p.IsActive} paused={p.Paused}"));
            const string expected = "Active Ann active=True paused=False, Paused Pat active=True paused=True, Gone Gil active=False paused=True";
            if (listed != expected)
            {
                throw new Exception($"expected [{expected}], got [{listed}]");
            }
        }),
    ];

    private static Player AddPlayer(BofcDbContext db, long id, string name, bool isActive, bool isPaused)
    {
        var player = new Player { Id = id, Name = name, IsActive = isActive, IsPaused = isPaused };
        db.Players.Add(player);
        return player;
    }

    private static void AddHistory(BofcDbContext db, Player player, int round, DateTime playedDate) =>
        db.PlayerGoalkeepingHistories.Add(new PlayerGoalkeepingHistory
        {
            PlayerId = player.Id, Player = player, RoundNumber = round, PlayedDate = playedDate,
        });

    private static PlayerService Build(BofcDbContext db) =>
        new(db, new NoCurrentUser(), new NoOptions(), new NoStorage(), new NoStorage());

    private class NoCurrentUser : ICurrentUserService
    {
        public long GetPlayerId() => throw new NotSupportedException();
        public bool IsInRole(string role) => throw new NotSupportedException();
        public bool IsUserAuthorizedForSelf(long id) => throw new NotSupportedException();
    }

    private class NoOptions : IOptions<PlayerOptions>
    {
        public PlayerOptions Value => throw new NotSupportedException();
    }

    private class NoStorage : IStorageProvider, IMediaStorageProvider
    {
        public Task DeleteAsync(string key) => throw new NotSupportedException();
    }
}
