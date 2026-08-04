using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class TeamPlayerConfiguration : IEntityTypeConfiguration<TeamPlayer>
{
    public void Configure(EntityTypeBuilder<TeamPlayer> builder)
    {
        builder.ToTable("team_player");
        builder.HasKey(tp => tp.Id);
        builder.Property(tp => tp.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(tp => tp.TeamId).HasColumnName("team_id").IsRequired();
        builder.Property(tp => tp.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(tp => tp.PlayingPosition).HasColumnName("playing_position").HasConversion<string>().IsRequired();
        builder.Property(tp => tp.TeamPlayerRole).HasColumnName("team_player_role").HasConversion<string>().IsRequired();
        builder.Property(tp => tp.IsCaptain).HasColumnName("is_captain").IsRequired();
        builder.Property(tp => tp.JerseyNumber).HasColumnName("jersey_number");

        builder.Property(tp => tp.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(tp => tp.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(tp => tp.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(tp => tp.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(tp => tp.Player).WithMany().HasForeignKey(tp => tp.PlayerId);
    }
}
