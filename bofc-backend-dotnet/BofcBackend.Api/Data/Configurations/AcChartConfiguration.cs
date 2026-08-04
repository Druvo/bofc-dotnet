using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcChartConfiguration : IEntityTypeConfiguration<AcChart>
{
    public void Configure(EntityTypeBuilder<AcChart> builder)
    {
        builder.ToTable("ac_charts");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(250).IsRequired();
        builder.Property(c => c.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
        builder.Property(c => c.Description).HasColumnName("description").HasMaxLength(250).IsRequired();
        builder.Property(c => c.ParentId).HasColumnName("parent_no");
        builder.Property(c => c.NatureId).HasColumnName("nature_no").IsRequired();
        builder.Property(c => c.IsActive).HasColumnName("is_active").IsRequired();

        builder.HasIndex(c => c.Name).IsUnique();
        builder.HasIndex(c => c.Code).IsUnique();
        builder.HasIndex(c => c.Description).IsUnique();

        builder.Property(c => c.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(c => c.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(c => c.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(c => c.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(c => c.Parent).WithMany().HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Nature).WithMany().HasForeignKey(c => c.NatureId).OnDelete(DeleteBehavior.Restrict);
    }
}
