using System.ComponentModel.DataAnnotations;

namespace BofcBackend.Api.Features.Players.Models;

public class ThemePreferenceRequest
{
    /// <summary>"light" or "dark". Null/omitted clears the preference (client falls back to OS/browser default).</summary>
    [RegularExpression("^(light|dark)$", ErrorMessage = "themePreference must be 'light' or 'dark'")]
    public string? ThemePreference { get; set; }
}
