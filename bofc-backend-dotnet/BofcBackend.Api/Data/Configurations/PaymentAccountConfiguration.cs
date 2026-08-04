using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class PaymentAccountConfiguration : IEntityTypeConfiguration<PaymentAccount>
{
    public void Configure(EntityTypeBuilder<PaymentAccount> builder)
    {
        builder.ToTable("payment_accounts");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(p => p.AccountType).HasColumnName("account_type").HasConversion<string>().IsRequired();
        builder.Property(p => p.AccountName).HasColumnName("account_name").HasMaxLength(150).IsRequired();
        builder.Property(p => p.AccountNumber).HasColumnName("account_number").HasMaxLength(50).IsRequired();
        builder.Property(p => p.BankName).HasColumnName("bank_name").HasMaxLength(100);
        builder.Property(p => p.Branch).HasColumnName("branch").HasMaxLength(100);
        builder.Property(p => p.Note).HasColumnName("note").HasMaxLength(255);
        builder.Property(p => p.DisplayOrder).HasColumnName("display_order").IsRequired();
        builder.Property(p => p.IsActive).HasColumnName("is_active").IsRequired();

        builder.Property(p => p.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(p => p.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(p => p.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(p => p.UpdatedDate).HasColumnName("updated_date");
    }
}
