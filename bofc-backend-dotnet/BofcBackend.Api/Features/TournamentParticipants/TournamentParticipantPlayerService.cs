using System.Net;
using BofcBackend.Api.Common.Constants;
using BofcBackend.Api.Common.Exceptions;
using BofcBackend.Api.Data;
using BofcBackend.Api.Domain.Entities;
using BofcBackend.Api.Features.TournamentParticipants.Models;
using Microsoft.EntityFrameworkCore;

namespace BofcBackend.Api.Features.TournamentParticipants;

/// <summary>Port of service/TournamentParticipantPlayerServiceImpl.java.</summary>
public class TournamentParticipantPlayerService(BofcDbContext db) : ITournamentParticipantPlayerService
{
    public async Task<TournamentWithPlayersResponse> GetNextTournamentForParticipationAsync(long tournamentId)
    {
        var tournament = await db.Tournaments.FirstOrDefaultAsync(t => t.Id == tournamentId)
            ?? throw new TournamentServiceException(RestErrorMessageDetail.TournamentIsNotFound, HttpStatusCode.NotFound);

        // Full active roster, left-joined with whatever participation rows already
        // exist for this tournament — not just the players who've already responded.
        // The old TournamentParticipantPlayers view only ever reflected existing rows,
        // so anyone who hadn't opted in yet (or an admin trying to set status on their
        // behalf) was invisible here.
        var activePlayers = await db.Players.Where(p => p.IsActive).ToListAsync();
        var existingParticipants = await db.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId).ToListAsync();
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
                TournamentParticipantId = participant?.Id,
                Comments = participant?.Comments,
                PhotoKey = player.PhotoKey,
                PhotoUrl = BuildPlayerPhotoUrl(player.PhotoKey),
            };
        }).ToList();

        var totalParticipants = players.Count(p => p.ParticipationStatus == true);

        return new TournamentWithPlayersResponse
        {
            TournamentId = tournament.Id,
            TournamentName = tournament.Name,
            TournamentDate = tournament.TournamentDate,
            TotalParticipants = totalParticipants,
            Players = players,
        };
    }

    private static string? BuildPlayerPhotoUrl(string? photoKey) =>
        string.IsNullOrWhiteSpace(photoKey) ? null : $"/files/player-photos/{photoKey}";
}
