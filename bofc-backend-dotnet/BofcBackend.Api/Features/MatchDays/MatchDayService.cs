using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Common.Util;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Domain.Enums;
using BofcBackend.Api.Features.MatchDays.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.MatchDays;

/// <summary>Port of service/MatchDayServiceImpl.java.</summary>
public class MatchDayService(BofcDbContext db) : IMatchDayService
{
    public async Task<MatchDayResponse> SaveMatchDayAsync(MatchDayRequest request)
    {
        var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
            ?? throw new VenueServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);

        var defaultMatchDay = request.DefaultMatchDay == true;

        var matchDay = new MatchDay
        {
            Name = StringUtils.NormalizeString(request.MatchDayName) ?? string.Empty,
            Title = request.Title,
            Season = request.Season,
            Description = request.Description,
            Rules = request.Rules,
            RoadmapImageUrl = request.RoadmapImageUrl,
            MatchDayDate = request.MatchDayDate!.Value,
            DurationMinutes = request.DurationMinutes,
            VenueId = venue.Id,
            // MatchDayDate is always authored/displayed as local (Dhaka) wall-clock time —
            // by the admin's date picker here, and by the scheduler elsewhere — never UTC.
            // Comparing it against DateTime.UtcNow is a 6-hour-off comparison; use DateTime.Now
            // (matches ComputeNextOccurrence/GenerateForCurrentMonthAsync's own convention).
            // A MatchDay created with a date already past its own end window (start+duration)
            // should land straight at CONCLUDED, not ONGOING — e.g. back-dating a historical
            // MatchDay a year in the past would otherwise sit at ONGOING until the next
            // scheduler tick corrects it.
            MatchDayStatus = ComputeInitialStatus(request.MatchDayDate.Value, request.DurationMinutes),
            IsActive = true,
            SportType = ParseEnumOrThrow<SportType>(request.SportType, "sportType") ?? SportType.FOOTBALL,
            MatchDayType = ParseEnumOrThrow<MatchDayType>(request.MatchDayType, "matchDayType") ?? MatchDayType.ROUND_ROBIN,
            GroupCount = request.GroupCount,
            AuctionMode = request.AuctionMode,
            DefaultMatchDay = defaultMatchDay,
        };

        // Transaction: clearing every other matchDay's default flag and saving this one as the
        // new default must succeed together — ExecuteUpdateAsync commits immediately on its own,
        // so without a shared transaction, a failure in the SaveChangesAsync below would leave
        // every matchDay with the default flag cleared and none actually set.
        await using var transaction = await db.Database.BeginTransactionAsync();

        if (defaultMatchDay)
        {
            // Keep exactly one default matchDay in the system.
            await db.MatchDays.Where(t => t.DefaultMatchDay)
                .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.DefaultMatchDay, false));
        }

        db.MatchDays.Add(matchDay);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) when (defaultMatchDay)
        {
            // ux_match_day_single_default caught a concurrent "set as default" race — the other
            // request won, so this one just isn't the default (still created successfully).
            throw new MatchDayServiceException(
                "Another MatchDay was just set as default — please retry.", HttpStatusCode.Conflict);
        }
        await transaction.CommitAsync();

        return await ToDtoAsync(matchDay);
    }

    public async Task<MatchDayResponse> GetMatchDayByIdAsync(long id) => await ToDtoAsync(await GetMatchDayEntityAsync(id));

    public async Task UpdateMatchDayStatusAsync(long id, bool active)
    {
        var matchDay = await GetMatchDayEntityAsync(id);
        matchDay.IsActive = active;
        await db.SaveChangesAsync();
    }

    public async Task<PaginatedMatchDayResponse> GetAllMatchDayAsync(int offset, int pageSize, string sortedBy,
        string sortDirection, string? searchColumn, string? searchValue)
    {
        var query = db.MatchDays.Include(t => t.Venue).AsQueryable();

        // Java's MatchDaySpecification is only ever invoked with these two hardcoded
        // column names (see MatchDayServiceImpl.getAllMatchDay) — the "dynamic by
        // column name" specification pattern never actually receives arbitrary columns
        // in practice, so this is a faithful behavioral port, not a simplification that
        // drops functionality.
        if (string.Equals(searchColumn, "matchDayDate", StringComparison.OrdinalIgnoreCase) && searchValue != null)
        {
            // MatchDayDate always carries a non-midnight time-of-day, so exact equality against
            // a date-only search value could never match — filter by calendar day instead.
            // A malformed searchValue previously threw an unhandled FormatException (masked 500);
            // treat it as "no match" the same way an out-of-range page number would.
            if (DateTime.TryParse(searchValue, out var searchDate))
            {
                var nextDay = searchDate.Date.AddDays(1);
                query = query.Where(t => t.MatchDayDate >= searchDate.Date && t.MatchDayDate < nextDay);
            }
            else
            {
                query = query.Where(t => false);
            }
        }
        else if (string.Equals(searchColumn, "name", StringComparison.OrdinalIgnoreCase) && searchValue != null)
        {
            query = query.Where(t => t.Name.Contains(searchValue));
        }

        var totalCount = await query.LongCountAsync();

        var pageNo = offset >= 0 ? offset : 0;
        var perPage = pageSize > 0 ? pageSize : 10;
        var ascending = string.Equals(sortDirection, "ASC", StringComparison.OrdinalIgnoreCase);

        query = ApplySort(query, sortedBy, ascending);

        var matchDays = await query.Skip(pageNo * perPage).Take(perPage).ToListAsync();
        var responses = matchDays.Select(ToDto).ToList();

        return new PaginatedMatchDayResponse(responses, totalCount);
    }

    private static IQueryable<MatchDay> ApplySort(IQueryable<MatchDay> query, string sortedBy, bool ascending) =>
        sortedBy.ToLowerInvariant() switch
        {
            "name" => ascending ? query.OrderBy(t => t.Name) : query.OrderByDescending(t => t.Name),
            "matchdaydate" => ascending ? query.OrderBy(t => t.MatchDayDate) : query.OrderByDescending(t => t.MatchDayDate),
            "matchdaystatus" => ascending ? query.OrderBy(t => t.MatchDayStatus) : query.OrderByDescending(t => t.MatchDayStatus),
            _ => ascending ? query.OrderBy(t => t.Id) : query.OrderByDescending(t => t.Id),
        };

    public async Task<MatchDayResponse> UpdateMatchDayAsync(long id, MatchDayUpdateRequest request)
    {
        var matchDay = await GetMatchDayEntityAsync(id);
        var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == request.VenueId)
            ?? throw new VenueServiceException(RestErrorMessageDetail.VenueIsNotFound, HttpStatusCode.NotFound);

        matchDay.Name = StringUtils.NormalizeString(request.MatchDayName) ?? string.Empty;
        matchDay.Title = request.Title;
        matchDay.Season = request.Season;
        matchDay.Description = request.Description;
        matchDay.Rules = request.Rules;
        matchDay.RoadmapImageUrl = request.RoadmapImageUrl;

        // An admin manually moving an auto-generated slot's date/time means the scheduler must
        // never re-create that (week, slot) pair again — see AutoGenSlotDayOfWeek/AutoGenWeekStart
        // doc comments on MatchDay for why those fields (not this date) are what the scheduler checks.
        if (matchDay.IsWeeklyMatchDay && matchDay.MatchDayDate != request.MatchDayDate!.Value)
        {
            matchDay.IsManuallyModified = true;
        }

        matchDay.MatchDayDate = request.MatchDayDate!.Value;
        matchDay.DurationMinutes = request.DurationMinutes;
        matchDay.VenueId = venue.Id;

        if (ParseEnumOrThrow<SportType>(request.SportType, "sportType") is { } sportType)
        {
            matchDay.SportType = sportType;
        }
        if (ParseEnumOrThrow<MatchDayType>(request.MatchDayType, "matchDayType") is { } matchDayType)
        {
            matchDay.MatchDayType = matchDayType;
        }
        if (request.GroupCount != null)
        {
            matchDay.GroupCount = request.GroupCount;
        }
        matchDay.AuctionMode = request.AuctionMode;

        // Transaction — see SaveMatchDayAsync's remarks; same reasoning applies to updates.
        await using var transaction = await db.Database.BeginTransactionAsync();

        if (request.DefaultMatchDay != null)
        {
            var defaultMatchDay = request.DefaultMatchDay == true;
            if (defaultMatchDay)
            {
                // Keep exactly one default matchDay in the system.
                await db.MatchDays.Where(t => t.Id != id && t.DefaultMatchDay)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.DefaultMatchDay, false));
            }
            matchDay.DefaultMatchDay = defaultMatchDay;
        }

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) when (request.DefaultMatchDay == true)
        {
            throw new MatchDayServiceException(
                "Another MatchDay was just set as default — please retry.", HttpStatusCode.Conflict);
        }
        await transaction.CommitAsync();

        return await ToDtoAsync(matchDay);
    }

    public async Task UpdateMatchDayStatusesAsync()
    {
        // Transaction: this scheduled job may call CompleteUnfinishedMatchesAsync (which commits
        // immediately via ExecuteUpdateAsync) for several overdue MatchDays inside the loop
        // below, then persists every matchDay's new status in one SaveChangesAsync at the end.
        // Without a shared transaction, a failure in that final save would leave matches marked
        // COMPLETED for MatchDays whose own status never actually got updated.
        await using var transaction = await db.Database.BeginTransactionAsync();

        // MatchDayDate is local (Dhaka) wall-clock time everywhere it's written — comparing
        // against DateTime.UtcNow here is a 6-hour-off comparison (see SaveMatchDayAsync).
        var now = DateTime.Now;

        // MatchDays without fixtures yet — date-based conclusion only.
        var withoutMatches = await db.MatchDays
            .Where(t => t.IsActive && !db.Matches.Any(m => m.MatchDayId == t.Id))
            .ToListAsync();
        foreach (var matchDay in withoutMatches.Where(t => t.MatchDayDate < now))
        {
            matchDay.MatchDayStatus = MatchDayStatus.CONCLUDED;
            matchDay.IsActive = false;
        }

        // MatchDays with fixtures — match-based status logic.
        var withMatches = await db.MatchDays
            .Where(t => t.IsActive && db.Matches.Any(m => m.MatchDayId == t.Id))
            .ToListAsync();
        foreach (var matchDay in withMatches)
        {
            var isOverdue = matchDay.MatchDayDate.AddDays(1) < now;
            if (isOverdue)
            {
                await CompleteUnfinishedMatchesAsync(matchDay.Id);
                matchDay.MatchDayStatus = MatchDayStatus.CONCLUDED;
                matchDay.IsActive = false;
                continue;
            }

            var hasOngoing = await db.Matches.AnyAsync(m => m.MatchDayId == matchDay.Id
                && (m.MatchStatus == MatchStatus.ONGOING || m.MatchStatus == MatchStatus.PAUSED));

            if (hasOngoing)
            {
                matchDay.MatchDayStatus = MatchDayStatus.ONGOING;
            }
            else
            {
                var allFinished = !await db.Matches.AnyAsync(m => m.MatchDayId == matchDay.Id
                    && (m.MatchStatus == MatchStatus.SCHEDULED || m.MatchStatus == MatchStatus.ONGOING || m.MatchStatus == MatchStatus.PAUSED));

                matchDay.MatchDayStatus = allFinished ? MatchDayStatus.CONCLUDED : MatchDayStatus.UPCOMING;
                matchDay.IsActive = !allFinished;
            }
        }

        await db.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public async Task ConcludeMatchDayAsync(long matchDayId)
    {
        var matchDay = await GetMatchDayEntityAsync(matchDayId);

        // Transaction: bulk-completing matches (ExecuteUpdateAsync, commits immediately) and
        // marking the matchDay CONCLUDED must succeed together — otherwise a failed save
        // leaves every match COMPLETED while the matchDay still looks ONGOING.
        await using var transaction = await db.Database.BeginTransactionAsync();

        await CompleteUnfinishedMatchesAsync(matchDayId);
        matchDay.MatchDayStatus = MatchDayStatus.CONCLUDED;
        matchDay.IsActive = false;
        await db.SaveChangesAsync();

        await transaction.CommitAsync();
    }

    private async Task CompleteUnfinishedMatchesAsync(long matchDayId)
    {
        await db.Matches
            .Where(m => m.MatchDayId == matchDayId && m.MatchStatus != MatchStatus.COMPLETED)
            .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.MatchStatus, MatchStatus.COMPLETED));
    }

    public async Task HardDeleteMatchDayAsync(long matchDayId)
    {
        var exists = await db.MatchDays.AnyAsync(t => t.Id == matchDayId);
        if (!exists)
        {
            throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        }

        // Children before parents, mirroring the full FK graph rooted at MatchDay/Team/Match —
        // most of these FKs are NO_ACTION (not cascading), so a plain MatchDays.Remove() would
        // fail; delete every dependent table explicitly instead. Wrapped in one transaction so a
        // failure partway through never leaves the MatchDay half-deleted.
        await using var transaction = await db.Database.BeginTransactionAsync();

        await db.MatchEvents.Where(e => e.Match.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.MatchStatistics.Where(s => s.Match.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.AuctionBids.Where(b => b.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.AuctionPlayerRegistrations.Where(r => r.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.AuctionPlayers.Where(p => p.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.AuctionSessions.Where(s => s.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.AuctionSettingsSet.Where(s => s.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.TeamBudgets.Where(b => b.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.TeamLineupPlayers.Where(p => p.TeamLineup.Team.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.GroupStandings.Where(s => s.Group.Round.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.RoundGroupTeams.Where(t => t.Group.Round.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.RoundTeams.Where(t => t.Round.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.AdvancementRules
            .Where(r => r.SourceRound.MatchDayId == matchDayId || r.TargetRound.MatchDayId == matchDayId)
            .ExecuteDeleteAsync();
        await db.LogicNodes.Where(n => n.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.Matches.Where(m => m.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.RoundGroups.Where(g => g.Round.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.MatchDayRounds.Where(r => r.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.MatchDayPrizes.Where(p => p.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.MatchDayParticipants.Where(p => p.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.PlayerGoalkeepingHistories.Where(h => h.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.TeamLineups.Where(l => l.Team.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.TeamPlayers.Where(p => p.Team.MatchDayId == matchDayId).ExecuteDeleteAsync();
        await db.Teams.Where(t => t.MatchDayId == matchDayId).ExecuteDeleteAsync();

        await db.MatchDays.Where(t => t.Id == matchDayId).ExecuteDeleteAsync();

        await transaction.CommitAsync();
    }

    public async Task<MatchDayResponse> GetMostRecentMatchDayAsync()
    {
        var matchDay = await db.MatchDays.Include(t => t.Venue)
            .OrderByDescending(t => t.MatchDayDate).FirstOrDefaultAsync()
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);
        return ToDto(matchDay);
    }

    public async Task<MatchDayResponse?> GetMostRecentActiveMatchDayAsync()
    {
        // ONGOING is set once at creation and only ever cleared by an admin
        // manually marking the matchDay CONCLUDED — so a matchDay whose
        // date has rolled into a previous day can sit at ONGOING forever.
        // Exclude those stale rows here instead of surfacing them as "latest".
        // MatchDayDate is local (Dhaka) wall-clock — DateTime.Now.Date, not UtcNow.Date, or this
        // filter is itself off by up to 6h (the exact bug it exists to guard against).
        var today = DateTime.Now.Date;
        var matchDay = await db.MatchDays.Include(t => t.Venue)
            .Where(t => t.MatchDayStatus == MatchDayStatus.UPCOMING
                || (t.MatchDayStatus == MatchDayStatus.ONGOING && t.MatchDayDate.Date >= today))
            .OrderBy(t => t.MatchDayStatus == MatchDayStatus.ONGOING ? 0 : 1)
            .ThenBy(t => t.MatchDayDate)
            .FirstOrDefaultAsync();
        return matchDay == null ? null : ToDto(matchDay);
    }

    public async Task<MatchDayResponse?> GetCurrentMatchDayAsync()
    {
        var today = DateTime.Now.Date;
        var matchDay = await db.MatchDays.Include(t => t.Venue)
            .Where(t => t.IsWeeklyMatchDay
                && (t.MatchDayStatus == MatchDayStatus.UPCOMING
                    || (t.MatchDayStatus == MatchDayStatus.ONGOING && t.MatchDayDate.Date >= today)))
            .OrderBy(t => t.MatchDayStatus == MatchDayStatus.ONGOING ? 0 : 1)
            .ThenBy(t => t.MatchDayDate)
            .FirstOrDefaultAsync()
            ?? await db.MatchDays.Include(t => t.Venue)
                .Where(t => t.IsWeeklyMatchDay)
                .OrderByDescending(t => t.MatchDayDate)
                .FirstOrDefaultAsync();

        return matchDay == null ? null : ToDto(matchDay);
    }

    public async Task<List<MatchDayListResponse>> GetMatchDayListAsync(string? year)
    {
        List<MatchDay> matchDays;
        if (!string.IsNullOrWhiteSpace(year))
        {
            int yearValue;
            try
            {
                yearValue = DateUtil.ParseYear(year);
            }
            catch (ArgumentException ex)
            {
                throw new MatchDayServiceException(ex.Message, HttpStatusCode.BadRequest);
            }
            matchDays = await db.MatchDays.Where(t => t.MatchDayDate.Year == yearValue)
                .OrderByDescending(t => t.MatchDayDate).ToListAsync();
        }
        else
        {
            matchDays = await db.MatchDays.OrderByDescending(t => t.MatchDayDate).ToListAsync();
        }

        return matchDays.Select(t => new MatchDayListResponse
        {
            Id = t.Id,
            Name = t.Name,
            MatchDayDate = DateUtil.FormatDate(t.MatchDayDate),
        }).ToList();
    }

    public async Task<List<string>> GetMatchDaySessionsAsync()
    {
        var years = await db.MatchDays.Select(t => t.MatchDayDate.Year).Distinct()
            .OrderByDescending(y => y).ToListAsync();
        return years.Select(y => y.ToString()).ToList();
    }

    private static TEnum? ParseEnumOrThrow<TEnum>(string? value, string fieldName) where TEnum : struct, Enum
    {
        if (value == null) return null;
        if (!Enum.TryParse<TEnum>(value, out var parsed))
        {
            throw new MatchDayServiceException($"Unknown {fieldName} '{value}'", HttpStatusCode.BadRequest);
        }
        return parsed;
    }

    private static MatchDayStatus ComputeInitialStatus(DateTime matchDayDate, int? durationMinutes)
    {
        var now = DateTime.Now;
        if (matchDayDate > now) return MatchDayStatus.UPCOMING;

        var end = matchDayDate.AddMinutes(durationMinutes is > 0 ? durationMinutes.Value : 90);
        return now >= end ? MatchDayStatus.CONCLUDED : MatchDayStatus.ONGOING;
    }

    private async Task<MatchDay> GetMatchDayEntityAsync(long id) =>
        await db.MatchDays.Include(t => t.Venue).FirstOrDefaultAsync(t => t.Id == id)
        ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

    private async Task<MatchDayResponse> ToDtoAsync(MatchDay matchDay)
    {
        if (matchDay.Venue == null!)
        {
            await db.Entry(matchDay).Reference(t => t.Venue).LoadAsync();
        }
        return ToDto(matchDay);
    }

    private static MatchDayResponse ToDto(MatchDay matchDay) => new()
    {
        Id = matchDay.Id,
        Name = matchDay.Name,
        Title = matchDay.Title,
        Season = matchDay.Season,
        Description = matchDay.Description,
        Rules = matchDay.Rules,
        RoadmapImageUrl = matchDay.RoadmapImageUrl,
        MatchDayDate = matchDay.MatchDayDate,
        DurationMinutes = matchDay.DurationMinutes,
        ActiveStatus = matchDay.IsActive,
        DefaultMatchDay = matchDay.DefaultMatchDay,
        MatchDayStatus = matchDay.MatchDayStatus,
        VenueId = matchDay.Venue.Id,
        VenueName = matchDay.Venue.Name,
        VenueMapLink = matchDay.Venue.MapLink,
        SportType = matchDay.SportType.ToString(),
        MatchDayType = matchDay.MatchDayType.ToString(),
        GroupCount = matchDay.GroupCount,
        AuctionMode = matchDay.AuctionMode,
        IsWeeklyMatchDay = matchDay.IsWeeklyMatchDay,
    };
}
