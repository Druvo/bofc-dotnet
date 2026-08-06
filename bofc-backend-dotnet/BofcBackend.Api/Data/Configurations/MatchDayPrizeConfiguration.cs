using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MatchDayPrizeConfiguration : IEntityTypeConfiguration<MatchDayPrize>
{
    public void Configure(EntityTypeBuilder<MatchDayPrize> builder)
    {
        builder.ToTable("match_day_prize");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(p => p.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(p => p.PrizeType).HasColumnName("prize_type").HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(p => p.TeamId).HasColumnName("team_id");
        builder.Property(p => p.PlayerId).HasColumnName("player_id");
        builder.Property(p => p.PositionRank).HasColumnName("position_rank").IsRequired();
        builder.Property(p => p.PrizeAmount).HasColumnName("prize_amount").HasPrecision(10, 2);
        builder.Property(p => p.PrizeCategory).HasColumnName("prize_category").HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(p => p.Description).HasColumnName("description").HasColumnType("NVARCHAR(MAX)");
        builder.Property(p => p.ImageLinks).HasColumnName("image_links").HasColumnType("NVARCHAR(MAX)");

        builder.Property(p => p.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(p => p.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(p => p.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(p => p.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(p => p.MatchDay).WithMany().HasForeignKey(p => p.MatchDayId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Team).WithMany().HasForeignKey(p => p.TeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Player).WithMany().HasForeignKey(p => p.PlayerId).OnDelete(DeleteBehavior.Restrict);
    }
}
