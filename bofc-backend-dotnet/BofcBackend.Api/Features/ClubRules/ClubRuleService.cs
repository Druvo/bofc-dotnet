using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.ClubRules.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.ClubRules;

/// <summary>Port of service/ClubRuleServiceImpl.java.</summary>
public class ClubRuleService(BofcDbContext db) : IClubRuleService
{
    public async Task<List<ClubRuleResponse>> GetRulesAsync() =>
        await db.ClubRules.Select(r => ToDto(r)).ToListAsync();

    public async Task SaveAsync(ClubRuleRequest request)
    {
        db.ClubRules.Add(new ClubRule { Description = request.Description });
        await db.SaveChangesAsync();
    }

    public async Task<ClubRuleResponse> UpdateAsync(long id, ClubRuleRequest request)
    {
        var rule = await GetClubRuleByIdAsync(id);
        rule.Description = request.Description;
        await db.SaveChangesAsync();
        return ToDto(rule);
    }

    public async Task<ClubRuleResponse> GetByIdAsync(long id) => ToDto(await GetClubRuleByIdAsync(id));

    private async Task<ClubRule> GetClubRuleByIdAsync(long id) =>
        await db.ClubRules.FirstOrDefaultAsync(r => r.Id == id)
        ?? throw new BadRequestException(RestErrorMessageDetail.ResourceNotFound, HttpStatusCode.NotFound);

    private static ClubRuleResponse ToDto(ClubRule rule) => new() { Id = rule.Id, Description = rule.Description };
}
