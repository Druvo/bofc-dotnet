namespace BofcBackend.Api.Domain.Entities;

/// <summary>
/// "Don't chase this player for this month's dues." An admin marks it from the Player Monthly
/// Payments page for someone the club has agreed should not pay a particular month - a month
/// spent away, a hardship, a newcomer's first month.
///
/// Narrower than <see cref="Player.IsPaused"/> on purpose: pausing stops everything (Match Day
/// invites included) until someone remembers to unpause, whereas a waiver covers exactly one
/// month of dues and nothing else. While it exists the player is not shown as Due for that
/// month and gets no payment reminder for it (PaymentDueReminderBackgroundService).
///
/// A waiver is not a payment and touches no ledger: it posts no voucher, and a payment can
/// still be recorded for a waived month if the player chooses to pay anyway.
/// </summary>
public class PaymentWaiver : AuditableEntity
{
    public long Id { get; set; }

    public long PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    /// <summary>Always the 1st of the month - same convention as AcCollection.MonthOfPayment.</summary>
    public DateTime MonthOfPayment { get; set; }

    public string? Reason { get; set; }
}
