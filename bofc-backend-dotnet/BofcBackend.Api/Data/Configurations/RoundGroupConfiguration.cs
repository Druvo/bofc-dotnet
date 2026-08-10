using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class RoundGroupConfiguration : IEntityTypeConfiguration<RoundGroup>
{
    public void Configure(EntityTypeBuilder<RoundGroup> builder)
    {
        builder.ToTable("round_group");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(g => g.RoundId).HasColumnName("round_id").IsRequired();
        builder.Property(g => g.ParentGroupId).HasColumnName("parent_group_id");
        builder.Property(g => g.GroupName).HasColumnName("group_name").HasMaxLength(100).IsRequired();
        builder.Property(g => g.GroupFormat).HasColumnName("group_format").HasConversion<string>().HasMaxLength(50);
        builder.Property(g => g.AdvancementRuleText).HasColumnName("advancement_rule").HasColumnType("NVARCHAR(MAX)");
        builder.Property(g => g.MaxTeams).HasColumnName("max_teams");
        builder.Property(g => g.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.Property(g => g.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(g => g.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(g => g.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(g => g.UpdatedDate).HasColumnName("updated_date");

        // See the cascade-path note in MatchDayRoundConfiguration - same reasoning applies
        // to the self-referencing parent/child group tree.
        builder.HasOne(g => g.ParentGroup)
            .WithMany(g => g.ChildGroups)
            .HasForeignKey(g => g.ParentGroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(g => g.GroupTeams).WithOne(gt => gt.Group).HasForeignKey(gt => gt.GroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(g => g.Matches).WithOne(m => m.Group).HasForeignKey(m => m.GroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(g => g.Standings).WithOne(s => s.Group).HasForeignKey(s => s.GroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(g => g.AdvancementRules)
            .WithOne(ar => ar.SourceGroup)
            .HasForeignKey(ar => ar.SourceGroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
