using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.ToTable("team");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(t => t.TeamName).HasColumnName("team_name").IsRequired();
        builder.Property(t => t.LogoKey).HasColumnName("logo_key");
        builder.Property(t => t.TournamentId).HasColumnName("tournament_id").IsRequired();

        builder.Property(t => t.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(t => t.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(t => t.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(t => t.UpdatedDate).HasColumnName("updated_date");

        builder.HasMany(t => t.TeamPlayers)
            .WithOne(tp => tp.Team)
            .HasForeignKey(tp => tp.TeamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
