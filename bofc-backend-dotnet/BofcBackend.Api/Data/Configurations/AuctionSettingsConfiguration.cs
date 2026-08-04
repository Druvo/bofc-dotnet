using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AuctionSettingsConfiguration : IEntityTypeConfiguration<AuctionSettings>
{
    public void Configure(EntityTypeBuilder<AuctionSettings> builder)
    {
        builder.ToTable("auction_settings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(s => s.TournamentId).HasColumnName("tournament_id").IsRequired();
        builder.HasIndex(s => s.TournamentId).IsUnique();
        builder.Property(s => s.TeamBudget).HasColumnName("team_budget").IsRequired();
        builder.Property(s => s.MinSquadSize).HasColumnName("min_squad_size").IsRequired();
        builder.Property(s => s.MaxSquadSize).HasColumnName("max_squad_size").IsRequired();
        builder.Property(s => s.AuctionTimerSeconds).HasColumnName("auction_timer_seconds").IsRequired();
        builder.Property(s => s.BidIncrement).HasColumnName("bid_increment").IsRequired();
        builder.Property(s => s.UnsoldReauctionEnabled).HasColumnName("unsold_reauction_enabled").IsRequired();
        builder.Property(s => s.TimerExtensionSeconds).HasColumnName("timer_extension_seconds").IsRequired();
        builder.Property(s => s.ExtendIfBidWithinLastSeconds).HasColumnName("extend_if_bid_within_last_seconds").IsRequired();
        builder.Property(s => s.MinRoleRequirements).HasColumnName("min_role_requirements").HasColumnType("NVARCHAR(MAX)");
        builder.Property(s => s.AuctionStatus).HasColumnName("auction_status").HasConversion<string>().IsRequired();
        builder.Property(s => s.ScheduledStartTime).HasColumnName("scheduled_start_time");

        builder.Property(s => s.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(s => s.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(s => s.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(s => s.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(s => s.Tournament).WithOne().HasForeignKey<AuctionSettings>(s => s.TournamentId).OnDelete(DeleteBehavior.Restrict);
    }
}
