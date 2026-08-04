using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

/// <summary>
/// Read-only mapping (matches Java's @Immutable) — composite key (TournamentId, PlayerId),
/// no navigation properties. Application code must never Add/Update/Remove this entity.
/// </summary>
public class TournamentParticipantPlayerConfiguration : IEntityTypeConfiguration<TournamentParticipantPlayer>
{
    public void Configure(EntityTypeBuilder<TournamentParticipantPlayer> builder)
    {
        builder.ToTable("tournament_participant_players");
        builder.HasKey(p => new { p.TournamentId, p.PlayerId });

        builder.Property(p => p.TournamentId).HasColumnName("tournament_id");
        builder.Property(p => p.TournamentName).HasColumnName("tournament_name");
        builder.Property(p => p.TournamentDate).HasColumnName("tournament_date");
        builder.Property(p => p.PlayerId).HasColumnName("player_id");
        builder.Property(p => p.PlayerName).HasColumnName("player_name");
        builder.Property(p => p.PlayerEmployeeId).HasColumnName("player_employee_id");
        builder.Property(p => p.PhotoKey).HasColumnName("photo_key");
        builder.Property(p => p.Comments).HasColumnName("comments");
        builder.Property(p => p.ParticipationStatus).HasColumnName("participation_status");
        builder.Property(p => p.TournamentParticipantId).HasColumnName("tournament_participant_id");
    }
}
