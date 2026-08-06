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
            MatchDayStatus = request.MatchDayDate.Value > DateTime.UtcNow ? MatchDayStatus.UPCOMING : MatchDayStatus.ONGOING,
            IsActive = true,
            SportType = request.SportType != null ? Enum.Parse<SportType>(request.SportType) : SportType.FOOTBALL,
            MatchDayType = request.MatchDayType != null ? Enum.Parse<MatchDayType>(request.MatchDayType) : MatchDayType.ROUND_ROBIN,
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
        await db.SaveChangesAsync();
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
            var searchDate = DateTime.Parse(searchValue);
            query = query.Where(t => t.MatchDayDate == searchDate);
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
        matchDay.MatchDayDate = request.MatchDayDate!.Value;
        matchDay.DurationMinutes = request.DurationMinutes;
        matchDay.VenueId = venue.Id;

        if (request.SportType != null)
        {
            matchDay.SportType = Enum.Parse<SportType>(request.SportType);
        }
        if (request.MatchDayType != null)
        {
            matchDay.MatchDayType = Enum.Parse<MatchDayType>(request.MatchDayType);
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

        await db.SaveChangesAsync();
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

        // MatchDays without fixtures yet — date-based conclusion only.
        var withoutMatches = await db.MatchDays
            .Where(t => t.IsActive && !db.Matches.Any(m => m.MatchDayId == t.Id))
            .ToListAsync();
        foreach (var matchDay in withoutMatches.Where(t => t.MatchDayDate < DateTime.UtcNow))
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
            var isOverdue = matchDay.MatchDayDate.AddDays(1) < DateTime.UtcNow;
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
        var today = DateTime.UtcNow.Date;
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
        var today = DateTime.UtcNow.Date;
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
        VenueName = matchDay.Venue.Name,
        VenueMapLink = matchDay.Venue.MapLink,
        SportType = matchDay.SportType.ToString(),
        MatchDayType = matchDay.MatchDayType.ToString(),
        GroupCount = matchDay.GroupCount,
        AuctionMode = matchDay.AuctionMode,
        IsWeeklyMatchDay = matchDay.IsWeeklyMatchDay,
    };
}
