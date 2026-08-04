namespace BofcBackend.Api.Common.Util;

/// <summary>Port of util/RandomUtil.java.</summary>
public static class RandomUtil
{
    private const string Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public static string GenerateRandomString(int length)
    {
        var random = Random.Shared;
        var buffer = new char[length];
        for (var i = 0; i < length; i++)
        {
            buffer[i] = Chars[random.Next(Chars.Length)];
        }

        return new string(buffer);
    }
}
