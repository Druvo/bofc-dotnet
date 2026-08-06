using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.MatchDayParticipants.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.MatchDayParticipants;

/// <summary>Port of service/MatchDayParticipantPlayerServiceImpl.java.</summary>
public class MatchDayParticipantPlayerService(BofcDbContext db) : IMatchDayParticipantPlayerService
{
    public async Task<MatchDayWithPlayersResponse> GetNextMatchDayForParticipationAsync(long matchDayId)
    {
        var matchDay = await db.MatchDays.FirstOrDefaultAsync(t => t.Id == matchDayId)
            ?? throw new MatchDayServiceException(RestErrorMessageDetail.MatchDayIsNotFound, HttpStatusCode.NotFound);

        // Full active roster, left-joined with whatever participation rows already
        // exist for this MatchDay — not just the players who've already responded.
        // The old MatchDayParticipantPlayers view only ever reflected existing rows,
        // so anyone who hadn't opted in yet (or an admin trying to set status on their
        // behalf) was invisible here.
        var activePlayers = await db.Players.Where(p => p.IsActive).ToListAsync();
        var existingParticipants = await db.MatchDayParticipants
            .Where(p => p.MatchDayId == matchDayId).ToListAsync();
        var participantByPlayerId = existingParticipants.ToDictionary(p => p.PlayerId);

        var players = activePlayers.Select(player =>
        {
            participantByPlayerId.TryGetValue(player.Id, out var participant);
            return new PlayerParticipationResponse
            {
                PlayerId = player.Id,
                PlayerName = player.Name,
                EmployeeId = player.EmployeeId,
                ParticipationStatus = participant?.ParticipationStatus,
                MatchDayParticipantId = participant?.Id,
                Comments = participant?.Comments,
                PhotoKey = player.PhotoKey,
                PhotoUrl = BuildPlayerPhotoUrl(player.PhotoKey),
            };
        }).ToList();

        var totalParticipants = players.Count(p => p.ParticipationStatus == true);

        return new MatchDayWithPlayersResponse
        {
            MatchDayId = matchDay.Id,
            MatchDayName = matchDay.Name,
            MatchDayDate = matchDay.MatchDayDate,
            TotalParticipants = totalParticipants,
            Players = players,
        };
    }

    private static string? BuildPlayerPhotoUrl(string? photoKey) =>
        string.IsNullOrWhiteSpace(photoKey) ? null : $"/files/player-photos/{photoKey}";
}
