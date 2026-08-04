using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class AcVoucherDetailConfiguration : IEntityTypeConfiguration<AcVoucherDetail>
{
    public void Configure(EntityTypeBuilder<AcVoucherDetail> builder)
    {
        builder.ToTable("ac_voucher_details");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(d => d.Narration).HasColumnName("narration");
        builder.Property(d => d.Dr).HasColumnName("dr").HasColumnType("decimal(19,2)");
        builder.Property(d => d.Cr).HasColumnName("cr").HasColumnType("decimal(19,2)");
        builder.Property(d => d.AcChartId).HasColumnName("ac_chart_id").IsRequired();
        builder.Property(d => d.VoucherId).HasColumnName("voucher_id").IsRequired();
        builder.Property(d => d.ReferenceNo).HasColumnName("reference_no").HasMaxLength(100);

        builder.Property(d => d.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(d => d.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(d => d.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(d => d.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(d => d.AcChart).WithMany().HasForeignKey(d => d.AcChartId).OnDelete(DeleteBehavior.Restrict);
    }
}
