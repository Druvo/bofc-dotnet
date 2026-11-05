// The Web SDK imports this namespace implicitly; the test project uses the plain SDK.
global using Microsoft.Extensions.DependencyInjection;
global using Microsoft.Extensions.Logging;

// Stand-ins for what PlayerService is constructed with and calls outside the database, so its
// real queries run in-memory. Only the members PlayerService uses.
namespace BofcBackend.Api.Common.Security
{
    public interface ICurrentUserService
    {
        long GetPlayerId();
        bool IsInRole(string role);
        bool IsUserAuthorizedForSelf(long id);
    }
}

namespace BofcBackend.Api.Common.Storage
{
    public interface IStorageProvider
    {
        Task DeleteAsync(string key);
    }

    public interface IMediaStorageProvider
    {
        Task DeleteAsync(string key);
    }
}

namespace Microsoft.Extensions.Options
{
    public interface IOptions<out T> where T : class
    {
        T Value { get; }
    }
}

namespace Microsoft.Extensions.DependencyInjection
{
    [AttributeUsage(AttributeTargets.Parameter)]
    public class FromKeyedServicesAttribute(object key) : Attribute
    {
        public object Key { get; } = key;
    }
}

namespace BCrypt.Net
{
    public static class BCrypt
    {
        public static string HashPassword(string password) => throw new NotSupportedException();
    }
}

// Stand-in for the logger FixtureGenerationService is constructed with.
namespace Microsoft.Extensions.Logging
{
    public interface ILogger<out T>
    {
        void LogWarning(string message, params object?[] args);
    }

    public class NullLogger<T> : ILogger<T>
    {
        public void LogWarning(string message, params object?[] args) { }
    }
}
