namespace BofcBackend.Api.Domain.Constants;

/// <summary>Fixed set of system-generated emails that have admin-editable content. Not a
/// user-extensible list - each key corresponds to one actual call site in the scheduling
/// background services, so adding a new one requires a code change (new default in
/// EmailTemplateService + a caller), not just an admin adding a template.</summary>
public static class EmailTemplateKeys
{
    public const string PaymentDueReminder = "PAYMENT_DUE_REMINDER";
    public const string MatchDayReminder = "MATCHDAY_REMINDER";
    public const string TeamsGenerated = "TEAMS_GENERATED";
    public const string PasswordReset = "PASSWORD_RESET";
}
