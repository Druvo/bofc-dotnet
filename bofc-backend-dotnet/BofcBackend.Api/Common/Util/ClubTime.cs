namespace BofcBackend.Api.Common.Util;

/// <summary>The club's wall clock. Use this instead of <c>DateTime.Now</c> anywhere the answer is
/// compared against, or written as, a club-local time.
///
/// Almost every date in this system is naive-local Dhaka wall-clock: a Match Day stored as
/// <c>2026-09-24 18:00</c> means six in the evening in Dhaka, with no offset attached (see
/// MatchDay.MatchDayDate and the comments in MatchDayService). The code compared those against
/// <c>DateTime.Now</c>, which is only Dhaka time if the machine running the app is configured for
/// Dhaka - and production is <c>Etc/UTC</c>, with no <c>TZ</c> set on the service. So on the one
/// machine that matters, <c>DateTime.Now</c> was <c>DateTime.UtcNow</c>, and every comparison
/// against a Match Day ran exactly six hours behind: status transitions landed at midnight local
/// instead of kickoff, RSVPs were accepted for six hours after the match had started, and the
/// voting lock - set to close five hours before kickoff - would have engaged an hour *after* it.
///
/// The fix is not to configure the host. A deployment setting is invisible from the code, easy to
/// lose on a rebuild or a move to a container, and was already being relied on silently by two
/// dozen call sites and one <c>TimeZoneInfo.Local</c> conversion. The club's timezone is a fact
/// about the club, so it lives here, and the code now means the same thing wherever it runs -
/// a developer's laptop, CI, and the VPS included.
///
/// Values returned have <see cref="DateTimeKind.Unspecified"/>, not Local, which is the honest
/// description: they are wall-clock readings in a known zone, and that matches the naive dates
/// they get compared against.</summary>
public static class ClubTime
{
    /// <summary>IANA first; .NET 6+ accepts it on Windows too. The Windows id is kept as a
    /// fallback for a host without the ICU/tzdata database, and a fixed +06:00 behind that -
    /// Bangladesh has observed no daylight saving since the 2009 experiment was abandoned, so a
    /// constant offset is a faithful last resort rather than a rough guess.</summary>
    public static TimeZoneInfo Zone { get; } = ResolveZone();

    /// <summary>The current club-local date and time.</summary>
    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zone);

    /// <summary>Midnight at the start of the current club-local day.</summary>
    public static DateTime Today => Now.Date;

    /// <summary>Reads a stored UTC instant as a club wall-clock time, so it can be compared with
    /// the naive-local dates the rest of the domain uses. Needed where both conventions meet -
    /// Match.StartedAt is true UTC while Match.MatchDate is naive-local.</summary>
    public static DateTime FromUtc(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Zone);

    private static TimeZoneInfo ResolveZone()
    {
        foreach (var id in new[] { "Asia/Dhaka", "Bangladesh Standard Time" })
        {
            if (TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone))
            {
                return zone;
            }
        }

        return TimeZoneInfo.CreateCustomTimeZone("BOFC-Dhaka", TimeSpan.FromHours(6), "Bangladesh Standard Time", "Bangladesh Standard Time");
    }
}
