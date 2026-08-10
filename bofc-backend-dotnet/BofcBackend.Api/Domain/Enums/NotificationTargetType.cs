namespace BofcBackend.Api.Domain.Enums;

/// <summary>
/// Persisted as a string (see NotificationConfiguration). ALL targets every
/// account; CUSTOM targets the recipient ids captured by the notification's
/// NotificationRecipient rows - the same mechanism covers both "one specific
/// user" and "several selected users", the frontend just picks single- vs
/// multi-select for the picker.
/// </summary>
public enum NotificationTargetType
{
    ALL,
    CUSTOM,
}
