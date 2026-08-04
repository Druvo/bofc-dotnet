namespace BofcBackend.Api.Common.RealTime.Stomp;

/// <summary>A parsed STOMP 1.2 frame (https://stomp.github.io/stomp-specification-1.2.html).</summary>
public class StompFrame
{
    public string Command { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new();
    public string Body { get; set; } = string.Empty;

    public static StompFrame Parse(string raw)
    {
        // A lone newline (or empty string) is a heartbeat — not a real frame.
        var lines = raw.Split('\n');
        var frame = new StompFrame { Command = lines[0].Trim() };

        var i = 1;
        for (; i < lines.Length; i++)
        {
            if (lines[i].Length == 0)
            {
                i++;
                break;
            }

            var colonIndex = lines[i].IndexOf(':');
            if (colonIndex > 0)
            {
                var key = lines[i][..colonIndex];
                var value = lines[i][(colonIndex + 1)..];
                frame.Headers[key] = value;
            }
        }

        frame.Body = string.Join('\n', lines[i..]).TrimEnd('\0');
        return frame;
    }

    public string Serialize()
    {
        var sb = new System.Text.StringBuilder();
        sb.Append(Command).Append('\n');
        foreach (var (key, value) in Headers)
        {
            sb.Append(key).Append(':').Append(value).Append('\n');
        }

        sb.Append('\n').Append(Body).Append('\0');
        return sb.ToString();
    }
}
