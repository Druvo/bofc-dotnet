using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MatchEventConfiguration : IEntityTypeConfiguration<MatchEvent>
{
    public void Configure(EntityTypeBuilder<MatchEvent> builder)
    {
        builder.ToTable("match_event");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(e => e.MatchId).HasColumnName("match_id").IsRequired();
        builder.Property(e => e.EventType).HasColumnName("event_type").HasConversion<string>().IsRequired();
        builder.Property(e => e.PlayerId).HasColumnName("player_id");
        builder.Property(e => e.TeamId).HasColumnName("team_id");
        builder.Property(e => e.EventTime).HasColumnName("event_time").IsRequired();
        builder.Property(e => e.Description).HasColumnName("description");
        builder.Property(e => e.RelatedPlayerId).HasColumnName("related_player_id");
        builder.Property(e => e.Details).HasColumnName("details").HasColumnType("NVARCHAR(MAX)");

        builder.Property(e => e.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(e => e.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(e => e.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(e => e.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(e => e.Player).WithMany().HasForeignKey(e => e.PlayerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.Team).WithMany().HasForeignKey(e => e.TeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.RelatedPlayer).WithMany()
            .HasForeignKey(e => e.RelatedPlayerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
