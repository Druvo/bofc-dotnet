using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class TeamBudgetConfiguration : IEntityTypeConfiguration<TeamBudget>
{
    public void Configure(EntityTypeBuilder<TeamBudget> builder)
    {
        builder.ToTable("team_budgets");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(b => b.MatchDayId).HasColumnName("match_day_id").IsRequired();
        builder.Property(b => b.TeamId).HasColumnName("team_id").IsRequired();
        builder.Property(b => b.OwnerId).HasColumnName("owner_id").IsRequired();
        builder.Property(b => b.TotalBudget).HasColumnName("total_budget").IsRequired();
        builder.Property(b => b.RemainingBudget).HasColumnName("remaining_budget").IsRequired();
        builder.Property(b => b.TotalSpent).HasColumnName("total_spent").IsRequired();
        builder.Property(b => b.PlayersBought).HasColumnName("players_bought").IsRequired();
        builder.Property(b => b.Version).HasColumnName("version");

        builder.HasIndex(b => new { b.MatchDayId, b.TeamId }).IsUnique();

        builder.Property(b => b.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(b => b.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(b => b.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(b => b.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(b => b.MatchDay).WithMany().HasForeignKey(b => b.MatchDayId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.Team).WithMany().HasForeignKey(b => b.TeamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(b => b.Owner).WithMany().HasForeignKey(b => b.OwnerId).OnDelete(DeleteBehavior.Restrict);
    }
}
