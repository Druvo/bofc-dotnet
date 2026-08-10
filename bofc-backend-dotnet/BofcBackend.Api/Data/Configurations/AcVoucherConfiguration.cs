using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcVoucherConfiguration : IEntityTypeConfiguration<AcVoucher>
{
    public void Configure(EntityTypeBuilder<AcVoucher> builder)
    {
        builder.ToTable("ac_vouchers");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(v => v.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
        builder.HasIndex(v => v.Code).IsUnique();
        builder.Property(v => v.Narration).HasColumnName("narration").HasMaxLength(500);
        builder.Property(v => v.VoucherDate).HasColumnName("voucher_date").HasColumnType("date").IsRequired();
        builder.Property(v => v.Amount).HasColumnName("amount").HasPrecision(18, 2).IsRequired();
        builder.Property(v => v.PostFlag).HasColumnName("post_flag").IsRequired();
        builder.Property(v => v.PostedById).HasColumnName("posted_by");
        builder.Property(v => v.PostDate).HasColumnName("post_date").HasColumnType("date");
        builder.Property(v => v.VoucherTypeId).HasColumnName("voucher_type_id").IsRequired();

        // Java's @JoinColumn(name = "payment_id") on the FK - not "bill_payment_id".
        builder.Property(v => v.BillPaymentId).HasColumnName("payment_id");
        builder.Property(v => v.CollectionId).HasColumnName("collection_id");

        builder.Property(v => v.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(v => v.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(v => v.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(v => v.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(v => v.PostedBy).WithMany().HasForeignKey(v => v.PostedById).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(v => v.VoucherType).WithMany().HasForeignKey(v => v.VoucherTypeId).OnDelete(DeleteBehavior.Restrict);

        // Deleting the AcCollection/AcBillPayment cascades to its 1:1 AcVoucher - matches Java's
        // cascade=ALL,orphanRemoval=true declared on the mappedBy (inverse/principal) side.
        builder.HasOne(v => v.Collection).WithOne(c => c!.Voucher)
            .HasForeignKey<AcVoucher>(v => v.CollectionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(v => v.BillPayment).WithOne(p => p!.Voucher)
            .HasForeignKey<AcVoucher>(v => v.BillPaymentId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(v => v.Details).WithOne(d => d.Voucher).HasForeignKey(d => d.VoucherId).OnDelete(DeleteBehavior.Cascade);
    }
}
