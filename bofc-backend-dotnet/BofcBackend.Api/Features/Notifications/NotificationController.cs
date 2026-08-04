using System.Net;
using BofcBackend.Api.Common;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Security;
using BofcBackend.Api.Domain.Constants;
using BofcBackend.Api.Features.Notifications.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BofcBackend.Api.Features.Notifications;

[ApiController]
[Route("notifications")]
[Authorize]
public class NotificationController(INotificationService notificationService, ICurrentUserService currentUserService) : ControllerBase
{
    [Authorize(Roles = PlayerRoleNames.AdminOrSuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
    {
        await notificationService.SendAsync(request, currentUserService.GetPlayerId());
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.Created, RestResponseMessage.CreateOk);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int offSet = 0, [FromQuery] int pageSize = 10)
    {
        var result = await notificationService.GetMyNotificationsAsync(currentUserService.GetPlayerId(), offSet, pageSize);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk, result);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(long id)
    {
        await notificationService.MarkReadAsync(currentUserService.GetPlayerId(), id);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await notificationService.MarkAllReadAsync(currentUserService.GetPlayerId());
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.UpdateOk);
    }

    [HttpGet("vapid-public-key")]
    public IActionResult GetVapidPublicKey()
    {
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.FetchOk,
            new VapidPublicKeyResponse(notificationService.GetVapidPublicKey()));
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionRequest request)
    {
        await notificationService.SaveSubscriptionAsync(currentUserService.GetPlayerId(), request);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.CreateOk);
    }

    [HttpDelete("subscribe")]
    public async Task<IActionResult> Unsubscribe([FromQuery] string endpoint)
    {
        await notificationService.RemoveSubscriptionAsync(currentUserService.GetPlayerId(), endpoint);
        return ResponseBuilder.BuildSuccessResponse(HttpStatusCode.OK, RestResponseMessage.DeleteOk);
    }
}
