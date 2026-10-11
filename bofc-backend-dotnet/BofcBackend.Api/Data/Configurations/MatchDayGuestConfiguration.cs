using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MatchDayGuestConfiguration : IEntityTypeConfiguration<MatchDayGuest>
{
    public void Configure(EntityTypeBuilder<MatchDayGuest> builder)
    {
        builder.ToTable("match_day_guest");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(g => g.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(g => g.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(g => g.TeamId).HasColumnName("team_id");
        // "rank" is reserved in SQL Server - same naming as players.player_rank.
        builder.Property(g => g.Rank).HasColumnName("guest_rank");

        builder.Property(g => g.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(g => g.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(g => g.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(g => g.UpdatedDate).HasColumnName("updated_date");

        builder.HasIndex(g => g.MatchDayId);
        builder.HasIndex(g => g.TeamId);

        builder.HasOne(g => g.MatchDay)
            .WithMany()
            .HasForeignKey(g => g.MatchDayId)
            .OnDelete(DeleteBehavior.Cascade);

        // NoAction, not SetNull: team rows themselves cascade from match_day, so a second
        // cascading path into match_day_guest would be rejected by SQL Server ("may cause
        // cycles or multiple cascade paths"). Deleting a team therefore unassigns its guests
        // explicitly in TeamService.DeleteTeamAsync instead of leaning on the database.
        builder.HasOne(g => g.Team)
            .WithMany()
            .HasForeignKey(g => g.TeamId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
