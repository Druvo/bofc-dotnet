using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MatchStatisticsConfiguration : IEntityTypeConfiguration<MatchStatistics>
{
    public void Configure(EntityTypeBuilder<MatchStatistics> builder)
    {
        builder.ToTable("match_statistics");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(s => s.MatchId).HasColumnName("match_id").IsRequired();
        builder.Property(s => s.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(s => s.TeamId).HasColumnName("team_id").IsRequired();
        builder.Property(s => s.GoalsScored).HasColumnName("goals_scored").IsRequired();
        builder.Property(s => s.Assists).HasColumnName("assists").IsRequired();
        builder.Property(s => s.RedCards).HasColumnName("red_cards").IsRequired();
        builder.Property(s => s.YellowCards).HasColumnName("yellow_cards").IsRequired();
        builder.Property(s => s.SubstitutionIn).HasColumnName("substitution_in").IsRequired();
        builder.Property(s => s.SubstitutionOut).HasColumnName("substitution_out").IsRequired();
        builder.Property(s => s.MinutesPlayed).HasColumnName("minutes_played").IsRequired();

        builder.Property(s => s.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(s => s.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(s => s.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(s => s.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(s => s.Player).WithMany().HasForeignKey(s => s.PlayerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.Team).WithMany().HasForeignKey(s => s.TeamId).OnDelete(DeleteBehavior.Restrict);
    }
}
