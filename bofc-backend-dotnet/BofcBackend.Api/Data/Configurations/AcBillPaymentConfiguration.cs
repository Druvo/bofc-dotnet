using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcBillPaymentConfiguration : IEntityTypeConfiguration<AcBillPayment>
{
    public void Configure(EntityTypeBuilder<AcBillPayment> builder)
    {
        builder.ToTable("ac_bill_payments");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(p => p.Code).HasColumnName("code").HasMaxLength(30).IsRequired();
        builder.HasIndex(p => p.Code).IsUnique();
        builder.Property(p => p.Amount).HasColumnName("amount").HasPrecision(18, 2).IsRequired();
        builder.Property(p => p.PaymentDate).HasColumnName("payment_date").HasColumnType("date").IsRequired();
        builder.Property(p => p.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(p => p.CostTypeId).HasColumnName("cost_type_id").IsRequired();

        builder.Property(p => p.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(p => p.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(p => p.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(p => p.UpdatedDate).HasColumnName("updated_date");

        builder.Property(p => p.PaymentAccountId).HasColumnName("payment_account_id");
        builder.HasOne(p => p.PaymentAccount).WithMany().HasForeignKey(p => p.PaymentAccountId).OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.CostType).WithMany().HasForeignKey(p => p.CostTypeId).OnDelete(DeleteBehavior.Restrict);
    }
}
