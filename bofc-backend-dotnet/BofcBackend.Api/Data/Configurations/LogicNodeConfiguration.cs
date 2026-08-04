using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class LogicNodeConfiguration : IEntityTypeConfiguration<LogicNode>
{
    public void Configure(EntityTypeBuilder<LogicNode> builder)
    {
        builder.ToTable("logic_node");
        builder.HasKey(ln => ln.Id);
        builder.Property(ln => ln.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(ln => ln.TournamentId).HasColumnName("tournament_id").IsRequired();
        builder.Property(ln => ln.NodeName).HasColumnName("node_name").HasMaxLength(100).IsRequired();
        builder.Property(ln => ln.NodeType).HasColumnName("node_type").HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(ln => ln.SourceRoundId).HasColumnName("source_round_id");
        builder.Property(ln => ln.SourceGroupId).HasColumnName("source_group_id");
        builder.Property(ln => ln.TargetRoundId).HasColumnName("target_round_id").IsRequired();
        builder.Property(ln => ln.RuleConfig).HasColumnName("rule_config").HasColumnType("NVARCHAR(MAX)");
        builder.Property(ln => ln.PriorityOrder).HasColumnName("priority_order");
        builder.Property(ln => ln.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(ln => ln.AutoExecute).HasColumnName("auto_execute").IsRequired();
        builder.Property(ln => ln.ExecutionCount).HasColumnName("execution_count").IsRequired();
        builder.Property(ln => ln.LastExecutedAt).HasColumnName("last_executed_at");

        builder.Property(ln => ln.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(ln => ln.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(ln => ln.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(ln => ln.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(ln => ln.Tournament).WithMany().HasForeignKey(ln => ln.TournamentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(ln => ln.SourceGroup).WithMany().HasForeignKey(ln => ln.SourceGroupId).OnDelete(DeleteBehavior.Restrict);
    }
}
