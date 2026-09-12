namespace BofcBackend.Api.Features.Teams.Models;

/// <summary>Payload for the "Declare Teams" button on Team Building. The two images are rendered
/// in the browser (html-to-image over the same components the Team Building screen uses) and
/// posted here as base64, rather than being drawn server-side: the layout only exists as React,
/// and reproducing it in a server-side rasterizer would mean maintaining the design twice.
///
/// They are never written to disk - decoded, attached to the outgoing mail, discarded.</summary>
public class DeclareTeamsRequest
{
    /// <summary>PNG of the team line-ups. Accepts either a bare base64 string or a
    /// <c>data:image/png;base64,</c> data URL (what canvas/html-to-image hands back).</summary>
    public string? TeamsImageBase64 { get; set; }

    /// <summary>PNG of the match schedule, sent as a second image so it stays readable on a phone
    /// instead of being half of one wide graphic.</summary>
    public string? ScheduleImageBase64 { get; set; }

    /// <summary>When set, the declaration goes to this one address instead of the participants,
    /// and no in-app notifications are created. Lets an admin see exactly what will land in 28
    /// inboxes before it does - the images are generated fresh per send, so there is no other way
    /// to preview the real thing.</summary>
    public string? TestEmail { get; set; }
}

/// <summary>What actually happened, so the button can say "sent to 24 players" rather than
/// claiming success on a send that reached nobody.</summary>
public record DeclareTeamsResult(int Sent, int Failed, bool IsTest, string? ErrorMessage);
