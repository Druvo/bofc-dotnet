using System.Net;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Common.Util;

/// <summary>
/// The club's jersey colors are a configurable list (SystemSettings.JerseyColors — any count,
/// not hardcoded to 2) — a Match's home/away jersey colors must each be one of the configured
/// colors, and the two teams in the same match can't both be assigned the same one (nothing to
/// tell them apart on the pitch). Shared by MatchManagementService.CreateMatchAsync and
/// FixtureGenerationService.UpdateMatchFixtureAsync so both entry points agree.
/// </summary>
public static class JerseyColorValidator
{
    public static async Task ValidateAsync(BofcDbContext db, string? homeJerseyColor, string? awayJerseyColor)
    {
        if (homeJerseyColor == null && awayJerseyColor == null) return;

        if (homeJerseyColor != null && awayJerseyColor != null && homeJerseyColor == awayJerseyColor)
        {
            throw new MatchDayServiceException("Home and away jersey colors can't be the same", HttpStatusCode.BadRequest);
        }

        var allowed = await db.JerseyColors.AsNoTracking()
            .Where(j => j.SystemSettingsId == 1)
            .Select(j => j.Color)
            .ToListAsync();

        if (homeJerseyColor != null && !allowed.Contains(homeJerseyColor))
        {
            throw new MatchDayServiceException($"Home jersey color must be one of the club's configured colors ({string.Join(", ", allowed)})", HttpStatusCode.BadRequest);
        }
        if (awayJerseyColor != null && !allowed.Contains(awayJerseyColor))
        {
            throw new MatchDayServiceException($"Away jersey color must be one of the club's configured colors ({string.Join(", ", allowed)})", HttpStatusCode.BadRequest);
        }
    }
}
