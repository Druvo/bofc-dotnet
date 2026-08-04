using BofcBackend.Api.Features.PaymentAccounts.Models;

namespace BofcBackend.Api.Features.PaymentAccounts;

public interface IPaymentAccountService
{
    Task<List<PaymentAccountResponse>> GetActivePaymentAccountsAsync();
    Task<List<PaymentAccountResponse>> GetAllPaymentAccountsAsync();
    Task<long> SavePaymentAccountAsync(PaymentAccountRequest request);
    Task<long> UpdatePaymentAccountAsync(long id, PaymentAccountRequest request);
    Task DeletePaymentAccountAsync(long id);
}
