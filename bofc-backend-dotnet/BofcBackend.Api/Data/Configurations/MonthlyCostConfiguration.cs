using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class MonthlyCostConfiguration : IEntityTypeConfiguration<MonthlyCost>
{
    public void Configure(EntityTypeBuilder<MonthlyCost> builder)
    {
        builder.ToTable("monthly_cost");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(c => c.CostTypeId).HasColumnName("cost_type_id").IsRequired();
        builder.Property(c => c.Amount).HasColumnName("amount").IsRequired();
        builder.Property(c => c.MonthOfCost).HasColumnName("month_of_cost").HasColumnType("date").IsRequired();
        builder.Property(c => c.Description).HasColumnName("description");

        builder.Property(c => c.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(c => c.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(c => c.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(c => c.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(c => c.CostType).WithMany().HasForeignKey(c => c.CostTypeId).OnDelete(DeleteBehavior.Restrict);
    }
}
