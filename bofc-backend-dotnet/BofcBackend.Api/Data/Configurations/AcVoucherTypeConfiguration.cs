using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcVoucherTypeConfiguration : IEntityTypeConfiguration<AcVoucherType>
{
    public void Configure(EntityTypeBuilder<AcVoucherType> builder)
    {
        builder.ToTable("ac_voucher_types");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(30).IsRequired();
        builder.HasIndex(t => t.Name).IsUnique();
        builder.Property(t => t.Alias).HasColumnName("alias").HasMaxLength(2).IsRequired();
        builder.Property(t => t.AcTransactionType).HasColumnName("ac_transaction_type").HasConversion<string>().IsRequired();
        builder.Property(t => t.Description).HasColumnName("description");
        builder.Property(t => t.IsDefault).HasColumnName("is_default").IsRequired();

        builder.Property(t => t.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(t => t.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(t => t.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(t => t.UpdatedDate).HasColumnName("updated_date");
    }
}
