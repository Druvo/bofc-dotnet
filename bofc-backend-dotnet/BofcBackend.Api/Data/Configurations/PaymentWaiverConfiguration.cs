using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class PaymentWaiverConfiguration : IEntityTypeConfiguration<PaymentWaiver>
{
    public void Configure(EntityTypeBuilder<PaymentWaiver> builder)
    {
        builder.ToTable("payment_waivers");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(w => w.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(w => w.MonthOfPayment).HasColumnName("month_of_payment").HasColumnType("date").IsRequired();
        builder.Property(w => w.Reason).HasColumnName("reason").HasMaxLength(500);

        builder.Property(w => w.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(w => w.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(w => w.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(w => w.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(w => w.Player)
            .WithMany()
            .HasForeignKey(w => w.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);

        // One waiver per player per month - omitting an already-omitted month just updates it.
        builder.HasIndex(w => new { w.PlayerId, w.MonthOfPayment }).IsUnique();
    }
}
