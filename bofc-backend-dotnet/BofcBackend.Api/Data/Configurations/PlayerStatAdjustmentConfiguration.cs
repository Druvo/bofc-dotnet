using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class PlayerStatAdjustmentConfiguration : IEntityTypeConfiguration<PlayerStatAdjustment>
{
    public void Configure(EntityTypeBuilder<PlayerStatAdjustment> builder)
    {
        builder.ToTable("player_stat_adjustment");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(a => a.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(a => a.MatchId).HasColumnName("match_id");
        builder.Property(a => a.GoalsAdjustment).HasColumnName("goals_adjustment").HasDefaultValue(0).ValueGeneratedNever().IsRequired();
        builder.Property(a => a.AssistsAdjustment).HasColumnName("assists_adjustment").HasDefaultValue(0).ValueGeneratedNever().IsRequired();
        builder.Property(a => a.YellowCardsAdjustment).HasColumnName("yellow_cards_adjustment").HasDefaultValue(0).ValueGeneratedNever().IsRequired();
        builder.Property(a => a.RedCardsAdjustment).HasColumnName("red_cards_adjustment").HasDefaultValue(0).ValueGeneratedNever().IsRequired();
        builder.Property(a => a.MatchesPlayedAdjustment).HasColumnName("matches_played_adjustment").HasDefaultValue(0).ValueGeneratedNever().IsRequired();
        builder.Property(a => a.Note).HasColumnName("note").HasMaxLength(500);

        builder.Property(a => a.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(a => a.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(a => a.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(a => a.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(a => a.Player)
            .WithMany()
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Match)
            .WithMany()
            .HasForeignKey(a => a.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        // One adjustment row per player scoped to either "lifetime" (MatchId null) or one
        // specific Match. SQL Server unique indexes treat NULLs as distinct (not duplicate), so
        // a single composite index on (PlayerId, MatchId) would only constrain match-scoped rows
        // and let a player accumulate unlimited lifetime rows - hence two filtered indexes: one
        // per (player, match) pair, one per player among lifetime-only rows.
        builder.HasIndex(a => new { a.PlayerId, a.MatchId })
            .IsUnique()
            .HasFilter("[match_id] IS NOT NULL")
            .HasDatabaseName("IX_player_stat_adjustment_player_id_match_id");

        builder.HasIndex(a => a.PlayerId)
            .IsUnique()
            .HasFilter("[match_id] IS NULL")
            .HasDatabaseName("IX_player_stat_adjustment_player_id_lifetime");
    }
}
