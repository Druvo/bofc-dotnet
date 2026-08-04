using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class RoundTeamConfiguration : IEntityTypeConfiguration<RoundTeam>
{
    public void Configure(EntityTypeBuilder<RoundTeam> builder)
    {
        builder.ToTable("round_team");
        builder.HasKey(rt => rt.Id);
        builder.Property(rt => rt.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(rt => rt.RoundId).HasColumnName("round_id").IsRequired();
        builder.Property(rt => rt.TeamId).HasColumnName("team_id");
        builder.Property(rt => rt.AssignmentType).HasColumnName("assignment_type").HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(rt => rt.SourceRule).HasColumnName("source_rule").HasColumnType("NVARCHAR(MAX)");
        builder.Property(rt => rt.IsPlaceholder).HasColumnName("is_placeholder").IsRequired();
        builder.Property(rt => rt.PlaceholderName).HasColumnName("placeholder_name").HasMaxLength(255);
        builder.Property(rt => rt.SeedPosition).HasColumnName("seed_position");
        builder.Property(rt => rt.AssignedAt).HasColumnName("assigned_at");

        builder.Property(rt => rt.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(rt => rt.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(rt => rt.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(rt => rt.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(rt => rt.Team).WithMany().HasForeignKey(rt => rt.TeamId).OnDelete(DeleteBehavior.Restrict);
    }
}
