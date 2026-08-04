namespace BofcBackend.Api.Features.Auth.Models;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public bool ResetPassword { get; set; }
}
