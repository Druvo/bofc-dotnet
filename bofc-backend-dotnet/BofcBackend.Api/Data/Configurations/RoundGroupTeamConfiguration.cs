using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class RoundGroupTeamConfiguration : IEntityTypeConfiguration<RoundGroupTeam>
{
    public void Configure(EntityTypeBuilder<RoundGroupTeam> builder)
    {
        builder.ToTable("round_group_team");
        builder.HasKey(gt => gt.Id);
        builder.Property(gt => gt.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(gt => gt.GroupId).HasColumnName("group_id").IsRequired();
        builder.Property(gt => gt.TeamId).HasColumnName("team_id");
        builder.Property(gt => gt.AssignmentType).HasColumnName("assignment_type").HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(gt => gt.SourceRule).HasColumnName("source_rule").HasColumnType("NVARCHAR(MAX)");
        builder.Property(gt => gt.IsPlaceholder).HasColumnName("is_placeholder").IsRequired();
        builder.Property(gt => gt.PlaceholderName).HasColumnName("placeholder_name").HasMaxLength(255);
        builder.Property(gt => gt.AssignedAt).HasColumnName("assigned_at");

        builder.Property(gt => gt.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(gt => gt.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(gt => gt.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(gt => gt.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(gt => gt.Team).WithMany().HasForeignKey(gt => gt.TeamId).OnDelete(DeleteBehavior.Restrict);
    }
}
