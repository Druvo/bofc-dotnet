using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.PaymentAccounts.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.PaymentAccounts;

public class PaymentAccountService(BofcDbContext db) : IPaymentAccountService
{
    public async Task<List<PaymentAccountResponse>> GetActivePaymentAccountsAsync()
    {
        var accounts = await db.PaymentAccounts
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Id)
            .ToListAsync();
        return accounts.Select(ConvertToResponse).ToList();
    }

    public async Task<List<PaymentAccountResponse>> GetAllPaymentAccountsAsync()
    {
        var accounts = await db.PaymentAccounts
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Id)
            .ToListAsync();
        return accounts.Select(ConvertToResponse).ToList();
    }

    public async Task<long> SavePaymentAccountAsync(PaymentAccountRequest request)
    {
        var account = new PaymentAccount();
        MapRequestToEntity(request, account);
        db.PaymentAccounts.Add(account);
        await db.SaveChangesAsync();
        return account.Id;
    }

    public async Task<long> UpdatePaymentAccountAsync(long id, PaymentAccountRequest request)
    {
        var account = await GetByIdAsync(id);
        MapRequestToEntity(request, account);
        await db.SaveChangesAsync();
        return account.Id;
    }

    public async Task DeletePaymentAccountAsync(long id)
    {
        var account = await GetByIdAsync(id);
        db.PaymentAccounts.Remove(account);
        await db.SaveChangesAsync();
    }

    private async Task<PaymentAccount> GetByIdAsync(long id) =>
        await db.PaymentAccounts.FirstOrDefaultAsync(a => a.Id == id)
        ?? throw new ResourceNotFoundException(RestErrorMessageDetail.PaymentAccountNotFound, HttpStatusCode.NotFound);

    private static void MapRequestToEntity(PaymentAccountRequest request, PaymentAccount account)
    {
        account.AccountType = request.AccountType!.Value;
        account.AccountName = request.AccountName!;
        account.AccountNumber = request.AccountNumber!;
        account.BankName = request.BankName;
        account.Branch = request.Branch;
        account.Note = request.Note;
        account.DisplayOrder = request.DisplayOrder;
        account.IsActive = request.IsActive;
    }

    private static PaymentAccountResponse ConvertToResponse(PaymentAccount entity) => new()
    {
        Id = entity.Id,
        AccountType = entity.AccountType,
        AccountName = entity.AccountName,
        AccountNumber = entity.AccountNumber,
        BankName = entity.BankName,
        Branch = entity.Branch,
        Note = entity.Note,
        DisplayOrder = entity.DisplayOrder,
        IsActive = entity.IsActive,
    };
}
