using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Omitted months of dues - see <see cref="PaymentWaiver"/>.</summary>
public class PaymentWaiverService(BofcDbContext db)
{
    /// <summary>Every waiver whose month falls in <paramref name="year"/>, or all of them.</summary>
    public async Task<List<PaymentWaiverResponse>> GetWaiversAsync(int? year)
    {
        var query = db.PaymentWaivers.AsNoTracking();
        if (year != null) query = query.Where(w => w.MonthOfPayment.Year == year);

        return await query
            .OrderByDescending(w => w.MonthOfPayment).ThenBy(w => w.Player.Name)
            .Select(w => new PaymentWaiverResponse
            {
                Id = w.Id,
                PlayerId = w.PlayerId,
                PlayerName = w.Player.Name,
                Year = w.MonthOfPayment.Year,
                Month = w.MonthOfPayment.Month,
                Reason = w.Reason,
                CreatedDate = w.CreatedDate,
            })
            .ToListAsync();
    }

    /// <summary>Idempotent: omitting a month that is already omitted just replaces the reason,
    /// so a double-click or a second admin doing the same thing is not an error.</summary>
    public async Task<PaymentWaiverResponse> WaiveAsync(PaymentWaiverRequest request)
    {
        var player = await db.Players.FirstOrDefaultAsync(p => p.Id == request.PlayerId!.Value)
            ?? throw new ResourceNotFoundException(RestErrorMessageDetail.PlayerIsNotFound, HttpStatusCode.NotFound);

        var month = new DateTime(request.Year!.Value, request.Month!.Value, 1);
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();

        var waiver = await db.PaymentWaivers.FirstOrDefaultAsync(w => w.PlayerId == player.Id && w.MonthOfPayment == month);
        if (waiver == null)
        {
            waiver = new PaymentWaiver { PlayerId = player.Id, MonthOfPayment = month };
            db.PaymentWaivers.Add(waiver);
        }
        waiver.Reason = reason;

        await db.SaveChangesAsync();

        return new PaymentWaiverResponse
        {
            Id = waiver.Id,
            PlayerId = player.Id,
            PlayerName = player.Name,
            Year = month.Year,
            Month = month.Month,
            Reason = waiver.Reason,
            CreatedDate = waiver.CreatedDate,
        };
    }

    public async Task RemoveWaiverAsync(long id)
    {
        var waiver = await db.PaymentWaivers.FirstOrDefaultAsync(w => w.Id == id)
            ?? throw new ResourceNotFoundException("Payment waiver is not found", HttpStatusCode.NotFound);
        db.PaymentWaivers.Remove(waiver);
        await db.SaveChangesAsync();
    }
}
