using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class CostTypeConfiguration : IEntityTypeConfiguration<CostType>
{
    public void Configure(EntityTypeBuilder<CostType> builder)
    {
        builder.ToTable("cost_types");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(c => c.Name).HasColumnName("name").IsRequired();
        builder.HasIndex(c => c.Name).IsUnique();
        builder.Property(c => c.Description).HasColumnName("description");
        builder.Property(c => c.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(c => c.ChartId).HasColumnName("chart_id").IsRequired();

        builder.Property(c => c.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(c => c.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(c => c.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(c => c.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(c => c.Chart).WithMany().HasForeignKey(c => c.ChartId).OnDelete(DeleteBehavior.Restrict);
    }
}
