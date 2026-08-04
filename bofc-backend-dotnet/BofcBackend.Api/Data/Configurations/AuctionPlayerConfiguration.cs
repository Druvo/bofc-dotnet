using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AuctionPlayerConfiguration : IEntityTypeConfiguration<AuctionPlayer>
{
    public void Configure(EntityTypeBuilder<AuctionPlayer> builder)
    {
        builder.ToTable("auction_players");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(p => p.TournamentId).HasColumnName("tournament_id").IsRequired();
        builder.Property(p => p.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(p => p.PlayerType).HasColumnName("player_type").HasConversion<string>().IsRequired();
        builder.Property(p => p.Category).HasColumnName("category").HasConversion<string>();
        builder.Property(p => p.BasePrice).HasColumnName("base_price").IsRequired();
        builder.Property(p => p.CurrentBid).HasColumnName("current_bid");
        builder.Property(p => p.CurrentHighestTeamId).HasColumnName("current_highest_team_id");
        builder.Property(p => p.SoldToTeamId).HasColumnName("sold_to_team_id");
        builder.Property(p => p.FinalPrice).HasColumnName("final_price");
        builder.Property(p => p.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(p => p.AuctionRound).HasColumnName("auction_round").IsRequired();
        builder.Property(p => p.PlayerRating).HasColumnName("player_rating").HasColumnType("decimal(4,2)");
        builder.Property(p => p.SequenceOrder).HasColumnName("sequence_order");
        builder.Property(p => p.Version).HasColumnName("version");

        builder.HasIndex(p => new { p.TournamentId, p.PlayerId }).IsUnique();

        builder.Property(p => p.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(p => p.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(p => p.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(p => p.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(p => p.Tournament).WithMany().HasForeignKey(p => p.TournamentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.Player).WithMany().HasForeignKey(p => p.PlayerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.CurrentHighestTeam).WithMany().HasForeignKey(p => p.CurrentHighestTeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.SoldToTeam).WithMany().HasForeignKey(p => p.SoldToTeamId).OnDelete(DeleteBehavior.Restrict);
    }
}
