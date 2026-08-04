using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AuctionSessionConfiguration : IEntityTypeConfiguration<AuctionSession>
{
    public void Configure(EntityTypeBuilder<AuctionSession> builder)
    {
        builder.ToTable("auction_sessions");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(s => s.TournamentId).HasColumnName("tournament_id").IsRequired();
        builder.Property(s => s.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(s => s.CurrentAuctionPlayerId).HasColumnName("current_auction_player_id");
        builder.Property(s => s.RoundNumber).HasColumnName("round_number").IsRequired();
        builder.Property(s => s.StartedAt).HasColumnName("started_at");
        builder.Property(s => s.PausedAt).HasColumnName("paused_at");
        builder.Property(s => s.CompletedAt).HasColumnName("completed_at");
        builder.Property(s => s.CurrentTimerEndsAt).HasColumnName("current_timer_ends_at");

        builder.Property(s => s.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(s => s.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(s => s.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(s => s.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(s => s.Tournament).WithMany().HasForeignKey(s => s.TournamentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.CurrentAuctionPlayer).WithMany().HasForeignKey(s => s.CurrentAuctionPlayerId).OnDelete(DeleteBehavior.Restrict);
    }
}
