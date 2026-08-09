using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class TeamLineupPlayerConfiguration : IEntityTypeConfiguration<TeamLineupPlayer>
{
    public void Configure(EntityTypeBuilder<TeamLineupPlayer> builder)
    {
        builder.ToTable("team_lineup_player");
        builder.HasKey(lp => lp.Id);
        builder.Property(lp => lp.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(lp => lp.TeamLineupId).HasColumnName("team_lineup_id").IsRequired();
        builder.Property(lp => lp.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(lp => lp.IsStarter).HasColumnName("is_starter").IsRequired();
        builder.Property(lp => lp.OrderIndex).HasColumnName("order_index").IsRequired();
        builder.Property(lp => lp.Availability).HasColumnName("availability").HasConversion<string>().IsRequired();

        builder.Property(lp => lp.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(lp => lp.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(lp => lp.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(lp => lp.UpdatedDate).HasColumnName("updated_date");

        builder.HasIndex(lp => new { lp.TeamLineupId, lp.PlayerId }).IsUnique();
        builder.HasOne(lp => lp.Player).WithMany().HasForeignKey(lp => lp.PlayerId);
    }
}
