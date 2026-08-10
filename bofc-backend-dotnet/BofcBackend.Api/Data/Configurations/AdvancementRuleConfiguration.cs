using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AdvancementRuleConfiguration : IEntityTypeConfiguration<AdvancementRule>
{
    public void Configure(EntityTypeBuilder<AdvancementRule> builder)
    {
        builder.ToTable("advancement_rule");
        builder.HasKey(ar => ar.Id);
        builder.Property(ar => ar.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(ar => ar.SourceRoundId).HasColumnName("source_round_id").IsRequired();
        builder.Property(ar => ar.SourceGroupId).HasColumnName("source_group_id");
        builder.Property(ar => ar.TargetRoundId).HasColumnName("target_round_id").IsRequired();
        builder.Property(ar => ar.TargetGroupId).HasColumnName("target_group_id");
        builder.Property(ar => ar.RuleType).HasColumnName("rule_type").HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(ar => ar.RuleConfig).HasColumnName("rule_config").HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(ar => ar.PriorityOrder).HasColumnName("priority_order");

        builder.Property(ar => ar.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(ar => ar.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(ar => ar.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(ar => ar.UpdatedDate).HasColumnName("updated_date");

        // TargetGroup has no inverse collection anywhere (Java's RoundGroup only declares
        // the "sourceGroup"-mapped collection) - unidirectional, no WithMany needed.
        builder.HasOne(ar => ar.TargetGroup).WithMany().HasForeignKey(ar => ar.TargetGroupId).OnDelete(DeleteBehavior.Restrict);
    }
}
