using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of service/CostTypeServiceImpl.java.</summary>
public class CostTypeService(BofcDbContext db)
{
    public async Task SaveCostTypeAsync(CostTypeRequest request)
    {
        if (await db.CostTypes.AnyAsync(c => c.Name == request.Name))
        {
            throw new CostTypeServiceException(RestErrorMessageDetail.CostTypeAlreadyExists, HttpStatusCode.Conflict);
        }

        var costType = new CostType
        {
            Name = request.Name!,
            Description = request.Description,
            // Admin-only endpoint, always created active - matches Java's hardcoded isActive(true).
            IsActive = true,
        };

        db.CostTypes.Add(costType);
        await db.SaveChangesAsync();
    }

    public async Task<List<CostTypeResponse>> GetAllCostTypeAsync()
    {
        var costTypes = await db.CostTypes.ToListAsync();
        return costTypes.Select(ConvertToResponse).ToList();
    }

    public async Task<CostTypeResponse> GetByCostIdAsync(long id) => ConvertToResponse(await GetCostTypeEntityAsync(id));

    public async Task<CostType> GetCostTypeEntityAsync(long id) =>
        await db.CostTypes.FirstOrDefaultAsync(c => c.Id == id)
        ?? throw new CostTypeServiceException(RestErrorMessageDetail.CostTypeIsNotFound, HttpStatusCode.NotFound);

    public CostTypeResponse GetByCostType(CostType costType) => ConvertToResponse(costType);

    public async Task UpdateStatusAsync(long id, bool isActive)
    {
        var costType = await GetCostTypeEntityAsync(id);
        costType.IsActive = isActive;
        await db.SaveChangesAsync();
    }

    public async Task<CostTypeResponse> UpdateAsync(long id, CostTypeRequest request)
    {
        var costType = await GetCostTypeEntityAsync(id);
        costType.Name = request.Name!;
        costType.Description = request.Description;
        await db.SaveChangesAsync();
        return ConvertToResponse(costType);
    }

    private static CostTypeResponse ConvertToResponse(CostType costType) => new()
    {
        Id = costType.Id,
        Name = costType.Name,
        Description = costType.Description,
        IsActive = costType.IsActive,
    };
}
