using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MatchDayParticipantConfiguration : IEntityTypeConfiguration<MatchDayParticipant>
{
    public void Configure(EntityTypeBuilder<MatchDayParticipant> builder)
    {
        builder.ToTable("match_day_participant");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(p => p.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(p => p.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(p => p.ParticipationStatus).HasColumnName("participation_status").IsRequired();
        builder.Property(p => p.Comments).HasColumnName("comments");

        builder.Property(p => p.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(p => p.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(p => p.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(p => p.UpdatedDate).HasColumnName("updated_date");

        builder.HasIndex(p => new { p.MatchDayId, p.PlayerId }).IsUnique();

        builder.HasOne(p => p.MatchDay).WithMany().HasForeignKey(p => p.MatchDayId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Player).WithMany().HasForeignKey(p => p.PlayerId).OnDelete(DeleteBehavior.Restrict);
    }
}
