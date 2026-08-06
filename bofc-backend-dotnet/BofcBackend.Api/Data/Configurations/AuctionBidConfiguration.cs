using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AuctionBidConfiguration : IEntityTypeConfiguration<AuctionBid>
{
    public void Configure(EntityTypeBuilder<AuctionBid> builder)
    {
        builder.ToTable("auction_bids");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(b => b.AuctionSessionId).HasColumnName("auction_session_id").IsRequired();
        builder.Property(b => b.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(b => b.AuctionPlayerId).HasColumnName("auction_player_id").IsRequired();
        builder.Property(b => b.TeamId).HasColumnName("team_id").IsRequired();
        builder.Property(b => b.BidderUserId).HasColumnName("bidder_user_id").IsRequired();
        builder.Property(b => b.BidAmount).HasColumnName("bid_amount").IsRequired();
        builder.Property(b => b.BidTime).HasColumnName("bid_time").IsRequired();
        builder.Property(b => b.IsWinning).HasColumnName("is_winning").IsRequired();

        builder.Property(b => b.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(b => b.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(b => b.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(b => b.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(b => b.AuctionSession).WithMany().HasForeignKey(b => b.AuctionSessionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.MatchDay).WithMany().HasForeignKey(b => b.MatchDayId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.AuctionPlayer).WithMany().HasForeignKey(b => b.AuctionPlayerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.Team).WithMany().HasForeignKey(b => b.TeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.BidderUser).WithMany().HasForeignKey(b => b.BidderUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
