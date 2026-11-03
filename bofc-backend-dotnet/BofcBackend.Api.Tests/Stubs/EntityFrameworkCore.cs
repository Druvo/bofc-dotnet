using System.Collections;
using System.Linq.Expressions;

// Stand-in for the slice of EF Core that AcCollectionService and PlayerService use: an in-memory
// DbSet and the async/Include query operators, so the services' real code runs without a database.
namespace Microsoft.EntityFrameworkCore
{
    public class DbSet<T> : IQueryable<T> where T : class
    {
        private readonly List<T> _rows = [];

        public void Add(T entity) => _rows.Add(entity);
        public void Remove(T entity) => _rows.Remove(entity);

        private IQueryable<T> Query => _rows.AsQueryable();
        public Type ElementType => Query.ElementType;
        public Expression Expression => Query.Expression;
        public IQueryProvider Provider => Query.Provider;
        public IEnumerator<T> GetEnumerator() => _rows.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }

    // Carries the included property's type so ThenInclude can infer its own, as EF's does.
    public class IncludableQueryable<T, TProperty>(IQueryable<T> source) : IQueryable<T>
    {
        public Type ElementType => source.ElementType;
        public Expression Expression => source.Expression;
        public IQueryProvider Provider => source.Provider;
        public IEnumerator<T> GetEnumerator() => source.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }

    public static class EntityFrameworkQueryableExtensions
    {
        public static IncludableQueryable<T, TProperty> Include<T, TProperty>(this IQueryable<T> source, Expression<Func<T, TProperty>> path) => new(source);
        public static IQueryable<T> AsNoTracking<T>(this IQueryable<T> source) => source;
        public static Task<List<T>> ToListAsync<T>(this IQueryable<T> source) => Task.FromResult(source.ToList());
        public static Task<bool> AnyAsync<T>(this IQueryable<T> source, Expression<Func<T, bool>> predicate) => Task.FromResult(source.Any(predicate));
        public static Task<T?> FirstOrDefaultAsync<T>(this IQueryable<T> source, Expression<Func<T, bool>> predicate) => Task.FromResult(source.FirstOrDefault(predicate));
        public static Task<T?> FirstOrDefaultAsync<T>(this IQueryable<T> source) => Task.FromResult(source.FirstOrDefault());
        public static IncludableQueryable<T, TProperty> ThenInclude<T, TPrevious, TProperty>(this IncludableQueryable<T, TPrevious> source, Expression<Func<TPrevious, TProperty>> path) => new(source);
        public static Task<int> CountAsync<T>(this IQueryable<T> source) => Task.FromResult(source.Count());
        public static Task<int> CountAsync<T>(this IQueryable<T> source, Expression<Func<T, bool>> predicate) => Task.FromResult(source.Count(predicate));
        public static Task<TResult> MaxAsync<T, TResult>(this IQueryable<T> source, Expression<Func<T, TResult>> selector) => Task.FromResult(source.Max(selector)!);
    }
}

namespace BofcBackend.Api.Data
{
    using BofcBackend.Api.Domain.Entities;
    using Microsoft.EntityFrameworkCore;

    public class FakeTransaction : IAsyncDisposable
    {
        public Task CommitAsync() => Task.CompletedTask;
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    public class FakeDatabase
    {
        public Task<FakeTransaction> BeginTransactionAsync() => Task.FromResult(new FakeTransaction());
        public IQueryable<T> SqlQuery<T>(FormattableString sql) => throw new NotSupportedException();
    }

    public class BofcDbContext
    {
        public DbSet<Player> Players { get; } = new();
        public DbSet<MonthlyCost> MonthlyCosts { get; } = new();
        public DbSet<AcCollection> AcCollections { get; } = new();
        public DbSet<PaymentAccount> PaymentAccounts { get; } = new();
        public DbSet<PaymentWaiver> PaymentWaivers { get; } = new();
        public DbSet<Role> Roles { get; } = new();
        public DbSet<MatchDay> MatchDays { get; } = new();
        public DbSet<MatchDayParticipant> MatchDayParticipants { get; } = new();
        public DbSet<PlayerGoalkeepingHistory> PlayerGoalkeepingHistories { get; } = new();
        public DbSet<TeamPlayer> TeamPlayers { get; } = new();
        public FakeDatabase Database { get; } = new();
        public Task<int> SaveChangesAsync() => Task.FromResult(0);
    }
}
