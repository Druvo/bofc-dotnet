namespace BofcBackend.Api.Common;

/// <summary>The publicly-reachable origin this API is served under - needed anywhere a link has
/// to work from OUTSIDE the app itself (an email client, not a browser tab already on this site),
/// e.g. the match-day vote links and the logo image embedded in emails. Distinct from the
/// Storage:* BaseUrls (which are about where uploaded files resolve) even though they happen to
/// share the same value per environment - kept separate so this doesn't silently drift if
/// storage is ever moved to a different host (R2/CDN) than the API itself.
/// Local dev: whatever port the dotnet backend is actually listening on (see .claude/launch.json's
/// "bofc-dotnet-backend" entry) - update this if that port changes. Production: the public
/// domain's "/api" prefix, matching nginx's proxy_pass rule for this backend.</summary>
public class AppUrlOptions
{
    public string BaseUrl { get; set; } = "http://localhost:9700";

    /// <summary>The player-facing web app's origin (distinct from BaseUrl, which is the API) -
    /// used for links inside emails that should open the app itself, e.g. the "pay your dues" button.</summary>
    public string WebsiteUrl { get; set; } = "http://localhost:3000";
}
