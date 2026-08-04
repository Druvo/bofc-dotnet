using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class GroupStandingConfiguration : IEntityTypeConfiguration<GroupStanding>
{
    public void Configure(EntityTypeBuilder<GroupStanding> builder)
    {
        builder.ToTable("group_standing");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(s => s.GroupId).HasColumnName("group_id").IsRequired();
        builder.Property(s => s.TeamId).HasColumnName("team_id").IsRequired();
        builder.Property(s => s.MatchesPlayed).HasColumnName("matches_played").IsRequired();
        builder.Property(s => s.Wins).HasColumnName("wins").IsRequired();
        builder.Property(s => s.Draws).HasColumnName("draws").IsRequired();
        builder.Property(s => s.Losses).HasColumnName("losses").IsRequired();
        builder.Property(s => s.GoalsFor).HasColumnName("goals_for").IsRequired();
        builder.Property(s => s.GoalsAgainst).HasColumnName("goals_against").IsRequired();
        builder.Property(s => s.GoalDifference).HasColumnName("goal_difference").IsRequired();
        builder.Property(s => s.Points).HasColumnName("points").IsRequired();
        builder.Property(s => s.YellowCards).HasColumnName("yellow_cards").IsRequired();
        builder.Property(s => s.RedCards).HasColumnName("red_cards").IsRequired();
        builder.Property(s => s.FairPlayPoints).HasColumnName("fair_play_points").IsRequired();
        builder.Property(s => s.TiebreakRank).HasColumnName("tiebreak_rank");
        builder.Property(s => s.Position).HasColumnName("position");
        builder.Property(s => s.IsAdvanced).HasColumnName("is_advanced");

        builder.Property(s => s.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(s => s.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(s => s.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(s => s.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(s => s.Team).WithMany().HasForeignKey(s => s.TeamId).OnDelete(DeleteBehavior.Restrict);
    }
}
