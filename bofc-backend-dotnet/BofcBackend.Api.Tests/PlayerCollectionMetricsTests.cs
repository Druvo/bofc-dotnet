using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting;
using BofcBackend.Api.Features.Accounting.Models;
using BofcBackend.Api.Features.Players;

// SPEC: spec-0fd3da - GET ac/reports/player-collection-metrics?year=Y files each payment under its
// month of payment, so the year filter and the Years list go by that month too, not by the
// payment's Date: dues paid in another year than the month they pay for still show as paid.
public static class PlayerCollectionMetricsTests
{
    public static (string Name, Func<Task> Run)[] All =>
    [
        ("December dues paid in January show under the paid month's year", async () =>
        {
            var (db, player) = Seed();
            Pay(db, player, 1, monthOfPayment: new DateTime(2026, 12, 1), date: new DateTime(2027, 1, 5));

            var metrics = await Build(db).GetPlayerCollectionMetricsAsync(2026);

            AssertAmount(metrics.Metrics.Single(), 2026, 12, 500m);
        }),
        ("January dues paid in advance in December show under the paid month's year", async () =>
        {
            var (db, player) = Seed();
            Pay(db, player, 1, monthOfPayment: new DateTime(2027, 1, 1), date: new DateTime(2026, 12, 20));

            var metrics = await Build(db).GetPlayerCollectionMetricsAsync(2027);

            AssertAmount(metrics.Metrics.Single(), 2027, 1, 500m);
        }),
        ("a payment made in another year does not leak into the year it was made in", async () =>
        {
            var (db, player) = Seed();
            Pay(db, player, 1, monthOfPayment: new DateTime(2027, 1, 1), date: new DateTime(2026, 12, 20));

            var metrics = await Build(db).GetPlayerCollectionMetricsAsync(2026);

            var report = metrics.Metrics.Single();
            if (report.YearMonthAmount.Count != 0)
            {
                throw new Exception($"expected no amounts for 2026, got years [{string.Join(", ", report.YearMonthAmount.Keys)}]");
            }
        }),
        ("Years lists the months-of-payment years, newest first", async () =>
        {
            var (db, player) = Seed();
            Pay(db, player, 1, monthOfPayment: new DateTime(2025, 6, 1), date: new DateTime(2025, 6, 3));
            Pay(db, player, 2, monthOfPayment: new DateTime(2027, 1, 1), date: new DateTime(2026, 12, 20));

            var metrics = await Build(db).GetPlayerCollectionMetricsAsync(null);

            var years = string.Join(", ", metrics.Years);
            if (years != "2027, 2025")
            {
                throw new Exception($"expected years [2027, 2025], got [{years}]");
            }
        }),
        ("without a year every collection is filed under its month of payment", async () =>
        {
            var (db, player) = Seed();
            Pay(db, player, 1, monthOfPayment: new DateTime(2026, 12, 1), date: new DateTime(2027, 1, 5));
            Pay(db, player, 2, monthOfPayment: new DateTime(2027, 1, 1), date: new DateTime(2027, 1, 5));

            var report = (await Build(db).GetPlayerCollectionMetricsAsync(null)).Metrics.Single();

            AssertAmount(report, 2026, 12, 500m);
            AssertAmount(report, 2027, 1, 500m);
        }),
    ];

    private static (BofcDbContext, Player) Seed()
    {
        var db = new BofcDbContext();
        var player = new Player { Id = 1, Name = "Active Ann", IsActive = true, IsPaused = false };
        db.Players.Add(player);
        return (db, player);
    }

    private static void Pay(BofcDbContext db, Player player, long id, DateTime monthOfPayment, DateTime date) =>
        db.AcCollections.Add(new AcCollection
        {
            Id = id, TransactionId = $"COL{id}", Players = [player], Amount = 500m, TotalAmount = 500m,
            MonthOfPayment = monthOfPayment, Date = date,
        });

    private static void AssertAmount(PlayerCollectionReport report, int year, int month, decimal expected)
    {
        var actual = report.YearMonthAmount.TryGetValue(year, out var months) ? months.GetValueOrDefault(month) : 0m;
        if (actual != expected)
        {
            throw new Exception($"expected {expected} for {year}-{month:00}, got {actual}");
        }
    }

    private static AcCollectionService Build(BofcDbContext db) =>
        new(db, new FakePlayerService(), new CostTypeService(), new AcVoucherService(), new AcChartService());
}
