using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcNatureConfiguration : IEntityTypeConfiguration<AcNature>
{
    public void Configure(EntityTypeBuilder<AcNature> builder)
    {
        builder.ToTable("ac_natures");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(n => n.Name).HasColumnName("name").HasMaxLength(20).IsRequired();
        builder.Property(n => n.Code).HasColumnName("code").IsRequired();
        builder.Property(n => n.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(n => n.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(15).IsRequired();
        builder.Property(n => n.SlNo).HasColumnName("sl_no");

        builder.Property(n => n.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(n => n.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(n => n.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(n => n.UpdatedDate).HasColumnName("updated_date");
    }
}
