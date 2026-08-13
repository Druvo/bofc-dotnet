using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of service/account/AcVoucherTypeServiceImpl.java.</summary>
public class AcVoucherTypeService(BofcDbContext db)
{
    public async Task<List<AcVoucherTypeResponse>> GetAcVoucherTypesAsync()
    {
        var types = await db.AcVoucherTypes.ToListAsync();
        return types.Select(ConvertToResponse).ToList();
    }

    public async Task<AcVoucherType> GetAcVoucherTypeByIdAsync(long id) =>
        await db.AcVoucherTypes.FirstOrDefaultAsync(t => t.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcVoucherTypeNotFound, HttpStatusCode.NotFound);

    public async Task<AcVoucherTypeResponse> GetAcVoucherTypeResponseAsync(long id)
    {
        var type = await GetAcVoucherTypeByIdAsync(id);
        return ConvertToResponse(type);
    }

    public async Task<long> SaveAcVoucherTypeAsync(AcVoucherTypeRequest request)
    {
        await EnsureNameUniqueAsync(request.Name!, excludeId: null);
        var type = new AcVoucherType();
        MapRequestToEntity(request, type);
        db.AcVoucherTypes.Add(type);
        await db.SaveChangesAsync();
        return type.Id;
    }

    public async Task<long> UpdateAcVoucherTypeAsync(long id, AcVoucherTypeRequest request)
    {
        await EnsureNameUniqueAsync(request.Name!, excludeId: id);
        var type = await GetAcVoucherTypeByIdAsync(id);
        MapRequestToEntity(request, type);
        await db.SaveChangesAsync();
        return type.Id;
    }

    /// <summary>Name carries a unique DB index (AcVoucherTypeConfiguration.cs) but nothing
    /// pre-checked it before SaveChangesAsync - a duplicate hit the raw SQL constraint uncaught,
    /// surfacing as a generic 500 instead of a real error message.</summary>
    private async Task EnsureNameUniqueAsync(string name, long? excludeId)
    {
        var existing = await db.AcVoucherTypes.FirstOrDefaultAsync(t => t.Name == name);
        if (existing != null && existing.Id != excludeId)
        {
            throw new BadRequestException(RestErrorMessageDetail.AcVoucherTypeNameAlreadyExists, HttpStatusCode.Conflict);
        }
    }

    public async Task DeleteAcVoucherTypeAsync(long id)
    {
        var type = await GetAcVoucherTypeByIdAsync(id);
        db.AcVoucherTypes.Remove(type);
        await db.SaveChangesAsync();
    }

    private static void MapRequestToEntity(AcVoucherTypeRequest request, AcVoucherType type)
    {
        type.Name = request.Name!;
        type.Alias = request.Alias!;
        type.Description = request.Description;
        type.AcTransactionType = request.AcTransactionType!.Value;
        type.IsDefault = request.IsDefault;
    }

    public static AcVoucherTypeResponse ConvertToResponse(AcVoucherType entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Alias = entity.Alias,
        Description = entity.Description,
        IsDefault = entity.IsDefault,
    };
}
