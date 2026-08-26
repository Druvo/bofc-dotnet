using System.Net;

namespace BofcBackend.Api.Common.Email;

/// <summary>Wraps any subject/body HTML fragment in the club's branded email shell (logo header,
/// accent-colored bar, footer tagline). Table-based layout with inline styles only - email clients
/// (Outlook/Gmail especially) strip &lt;style&gt; blocks and don't reliably support flexbox/grid, so
/// this deliberately avoids both.</summary>
public static class BrandedEmailRenderer
{
    public static string Render(string subject, string bodyHtml, string accentColor, string footerTagline, string logoUrl)
    {
        var safeAccent = IsValidHexColor(accentColor) ? accentColor : "#1d4ed8";
        var safeTagline = WebUtility.HtmlEncode(footerTagline);
        var safeSubject = WebUtility.HtmlEncode(subject);
        var safeLogoUrl = WebUtility.HtmlEncode(logoUrl);
        var year = DateTime.UtcNow.Year;

        return $$"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>{{safeSubject}}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="background-color:{{safeAccent}};padding:20px 24px;text-align:center;">
                          <img src="{{safeLogoUrl}}" alt="BOFC" height="40" style="height:40px;display:inline-block;" />
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:28px 24px;color:#111827;font-size:15px;line-height:1.6;">
                          {{bodyHtml}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 24px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;">
                          {{safeTagline}} &middot; &copy; {{year}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }

    private static bool IsValidHexColor(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Length == 7 && value[0] == '#' &&
        value[1..].All(Uri.IsHexDigit);
}
