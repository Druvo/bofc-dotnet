using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.Accounting.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.Accounting;

/// <summary>Port of service/account/AcNatureServiceImpl.java.</summary>
public class AcNatureService(BofcDbContext db)
{
    public async Task<List<AcNatureResponse>> GetAcNaturesAsync()
    {
        var natures = await db.AcNatures.ToListAsync();
        return natures.Select(ConvertToResponse).ToList();
    }

    public async Task<AcNatureResponse> GetAcNatureResponseAsync(long id)
    {
        var nature = await GetAcNatureByIdAsync(id);
        return ConvertToResponse(nature);
    }

    public async Task<AcNature> GetAcNatureByIdAsync(long id) =>
        await db.AcNatures.FirstOrDefaultAsync(n => n.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.AcNatureNotFound, HttpStatusCode.NotFound);

    public async Task<long> SaveAcNatureAsync(AcNatureRequest request)
    {
        var nature = new AcNature();
        MapRequestToEntity(request, nature);
        db.AcNatures.Add(nature);
        await db.SaveChangesAsync();
        return nature.Id;
    }

    public async Task<long> UpdateAcNatureAsync(long id, AcNatureRequest request)
    {
        var nature = await GetAcNatureByIdAsync(id);
        MapRequestToEntity(request, nature);
        await db.SaveChangesAsync();
        return nature.Id;
    }

    public async Task DeleteAcNatureAsync(long id)
    {
        var nature = await GetAcNatureByIdAsync(id);
        db.AcNatures.Remove(nature);
        await db.SaveChangesAsync();
    }

    private static void MapRequestToEntity(AcNatureRequest request, AcNature nature)
    {
        nature.Name = request.Name!;
        nature.Code = request.Code!.Value;
        nature.Type = request.Type!.Value;
        nature.Description = request.Description;
        nature.SlNo = request.SlNo;
    }

    public static AcNatureResponse ConvertToResponse(AcNature entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Code = entity.Code,
        Type = entity.Type,
        Description = entity.Description,
        SlNo = entity.SlNo ?? 0,
    };
}
