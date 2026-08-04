using BofcBackend.Api.Features.ClubRules.Models;

namespace BofcBackend.Api.Features.ClubRules;

public interface IClubRuleService
{
    Task<List<ClubRuleResponse>> GetRulesAsync();
    Task SaveAsync(ClubRuleRequest request);
    Task<ClubRuleResponse> UpdateAsync(long id, ClubRuleRequest request);
    Task<ClubRuleResponse> GetByIdAsync(long id);
}
