using BofcBackend.Api.Common.RealTime;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Fixtures;
using BofcBackend.Api.Features.Fixtures.Models;
using Microsoft.Extensions.Logging;

// SPEC: spec-dc1746 - a single-day, 4-team generation with red and white bibs follows the
// club's color table: Team C always wears white, Team D always wears red, and only Team A and
// Team B change shirt. The BOFC weekly match card's "Today's Matches" shows these colors.
public static class FixtureGenerationTests
{
    private static readonly string[] ExpectedFourTeamCard =
    [
        "Team A red v Team B white",
        "Team C white v Team D red",
        "Team A red v Team C white",
        "Team B white v Team D red",
        "Team A white v Team D red",
        "Team B red v Team C white",
    ];

    public static (string Name, Func<Task> Run)[] All =>
    [
        ("4-team fixtures follow the club's red/white table", async () =>
        {
            var lines = await GenerateFourTeamCard();
            for (var i = 0; i < ExpectedFourTeamCard.Length; i++)
            {
                if (i >= lines.Count || lines[i] != ExpectedFourTeamCard[i])
                {
                    throw new Exception($"match #{i + 1}: expected \"{ExpectedFourTeamCard[i]}\", got \"{(i < lines.Count ? lines[i] : "<none>")}\"");
                }
            }
            if (lines.Count != ExpectedFourTeamCard.Length)
            {
                throw new Exception($"expected {ExpectedFourTeamCard.Length} matches, got {lines.Count}");
            }
        }),
        ("4-team fixtures keep Team C in white and Team D in red in every match", async () =>
        {
            var db = Seed(out var request);
            var matches = await Build(db).GenerateFixturesAsync(1, request);
            foreach (var m in matches)
            {
                foreach (var (team, color) in new[] { (m.HomeTeam, m.HomeJerseyColor), (m.AwayTeam, m.AwayJerseyColor) })
                {
                    var expected = team.TeamName switch { "Team C" => "white", "Team D" => "red", _ => null };
                    if (expected != null && color != expected)
                    {
                        throw new Exception($"match #{m.MatchOrder}: {team.TeamName} wears {color}, expected {expected}");
                    }
                }
                if (m.HomeJerseyColor == m.AwayJerseyColor)
                {
                    throw new Exception($"match #{m.MatchOrder}: both teams wear {m.HomeJerseyColor}");
                }
            }
        }),
    ];

    private static async Task<List<string>> GenerateFourTeamCard()
    {
        var db = Seed(out var request);
        var matches = await Build(db).GenerateFixturesAsync(1, request);
        return matches.OrderBy(m => m.MatchOrder)
            .Select(m => $"{m.HomeTeam.TeamName} {m.HomeJerseyColor} v {m.AwayTeam.TeamName} {m.AwayJerseyColor}")
            .ToList();
    }

    private static BofcDbContext Seed(out FixtureGenerationRequest request)
    {
        var db = new BofcDbContext();
        var venue = new Venue { Id = 1 };
        db.Venues.Add(venue);
        var matchDay = new MatchDay { Id = 1, MatchDayDate = new DateTime(2026, 11, 6, 7, 0, 0), VenueId = 1, Venue = venue, DurationMinutes = 90 };
        db.MatchDays.Add(matchDay);
        string[] names = ["Team A", "Team B", "Team C", "Team D"];
        for (var i = 0; i < names.Length; i++)
        {
            db.Teams.Add(new Team { Id = i + 1, TeamName = names[i], MatchDayId = 1, MatchDay = matchDay });
        }
        // Configured white-first, as the club's settings list them.
        db.JerseyColors.Add(new JerseyColor { Id = 1, SystemSettingsId = 1, Color = "white", SortOrder = 0 });
        db.JerseyColors.Add(new JerseyColor { Id = 2, SystemSettingsId = 1, Color = "red", SortOrder = 1 });

        request = new FixtureGenerationRequest
        {
            MatchDayId = 1,
            TeamIds = [1, 2, 3, 4],
            MatchDates = [matchDay.MatchDayDate],
            MatchDurationMinutes = 15,
            TimeGapMinutes = 0,
        };
        return db;
    }

    private static FixtureGenerationService Build(BofcDbContext db) =>
        new(db, new FakeLiveMatchUpdatePublisher(), new FakeCurrentUserService(), new NullLogger<FixtureGenerationService>());

    private class FakeLiveMatchUpdatePublisher : ILiveMatchUpdatePublisher
    {
        public (Guid SubscriptionId, System.Threading.Channels.ChannelReader<string> Frames) Subscribe(long matchDayId) => throw new NotSupportedException();
        public void Unsubscribe(long matchDayId, Guid subscriptionId) { }
        public void PublishMatchUpdate(long? matchDayId, long? matchId, string eventType) { }
        public void SendHeartbeat() { }
    }

    private class FakeCurrentUserService : ICurrentUserService
    {
        public long GetPlayerId() => 1;
        public bool IsInRole(string role) => false;
        public bool IsUserAuthorizedForSelf(long id) => false;
    }
}
