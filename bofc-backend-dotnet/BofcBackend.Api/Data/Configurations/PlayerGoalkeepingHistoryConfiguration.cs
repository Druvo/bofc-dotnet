using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class PlayerGoalkeepingHistoryConfiguration : IEntityTypeConfiguration<PlayerGoalkeepingHistory>
{
    public void Configure(EntityTypeBuilder<PlayerGoalkeepingHistory> builder)
    {
        builder.ToTable("player_goalkeeping_history");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(h => h.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(h => h.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(h => h.RoundNumber).HasColumnName("round_number").IsRequired();
        builder.Property(h => h.PlayedDate).HasColumnName("played_date").IsRequired();

        builder.Property(h => h.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(h => h.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(h => h.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(h => h.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(h => h.Player).WithMany().HasForeignKey(h => h.PlayerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(h => h.MatchDay).WithMany().HasForeignKey(h => h.MatchDayId).OnDelete(DeleteBehavior.Restrict);
    }
}
