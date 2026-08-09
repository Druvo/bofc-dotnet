using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class TeamLineupConfiguration : IEntityTypeConfiguration<TeamLineup>
{
    public void Configure(EntityTypeBuilder<TeamLineup> builder)
    {
        builder.ToTable("team_lineup");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(l => l.TeamId).HasColumnName("team_id").IsRequired();
        builder.Property(l => l.SquadSize).HasColumnName("squad_size").IsRequired();
        builder.Property(l => l.Formation).HasColumnName("formation").HasMaxLength(50).IsRequired();

        builder.Property(l => l.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(l => l.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(l => l.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(l => l.UpdatedDate).HasColumnName("updated_date");

        builder.HasIndex(l => l.TeamId).IsUnique();
        builder.HasOne(l => l.Team).WithMany().HasForeignKey(l => l.TeamId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.LineupPlayers)
            .WithOne(lp => lp.TeamLineup)
            .HasForeignKey(lp => lp.TeamLineupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
