using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

/// <summary>
/// Read-only mapping (matches Java's @Immutable) — composite key (MatchDayId, PlayerId),
/// no navigation properties. Application code must never Add/Update/Remove this entity.
/// </summary>
public class MatchDayParticipantPlayerConfiguration : IEntityTypeConfiguration<MatchDayParticipantPlayer>
{
    public void Configure(EntityTypeBuilder<MatchDayParticipantPlayer> builder)
    {
        builder.ToTable("match_day_participant_players");
        builder.HasKey(p => new { p.MatchDayId, p.PlayerId });

        builder.Property(p => p.MatchDayId).HasColumnName("match_day_id");
        builder.Property(p => p.MatchDayName).HasColumnName("match_day_name");
        builder.Property(p => p.MatchDayDate).HasColumnName("match_day_date");
        builder.Property(p => p.PlayerId).HasColumnName("player_id");
        builder.Property(p => p.PlayerName).HasColumnName("player_name");
        builder.Property(p => p.PlayerEmployeeId).HasColumnName("player_employee_id");
        builder.Property(p => p.PhotoKey).HasColumnName("photo_key");
        builder.Property(p => p.Comments).HasColumnName("comments");
        builder.Property(p => p.ParticipationStatus).HasColumnName("participation_status");
        builder.Property(p => p.MatchDayParticipantId).HasColumnName("match_day_participant_id");
    }
}
