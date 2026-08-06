using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.PaymentAccounts.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.PaymentAccounts;

/// <summary>
/// Bank/bKash details players use to send MatchDay dues. Any logged-in
/// user can read the active list; only admins can manage the full list.
/// </summary>
[ApiController]
[Route("payment-accounts")]
[Authorize]
public class PaymentAccountController(IPaymentAccountService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActivePaymentAccounts()
    {
        var accounts = await service.GetActivePaymentAccountsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, accounts);
    }

    [HttpGet("all")]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> GetAllPaymentAccounts()
    {
        var accounts = await service.GetAllPaymentAccountsAsync();
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, accounts);
    }

    [HttpPost]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> SavePaymentAccount([FromBody] PaymentAccountRequest request)
    {
        var id = await service.SavePaymentAccountAsync(request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk, id);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> UpdatePaymentAccount(long id, [FromBody] PaymentAccountRequest request)
    {
        var updatedId = await service.UpdatePaymentAccountAsync(id, request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk, updatedId);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    public async Task<IActionResult> DeletePaymentAccount(long id)
    {
        await service.DeletePaymentAccountAsync(id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
