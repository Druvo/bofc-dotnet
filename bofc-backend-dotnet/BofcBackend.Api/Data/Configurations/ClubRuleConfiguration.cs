using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class ClubRuleConfiguration : IEntityTypeConfiguration<ClubRule>
{
    public void Configure(EntityTypeBuilder<ClubRule> builder)
    {
        builder.ToTable("club_rule");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(c => c.Description).HasColumnName("description");

        builder.Property(c => c.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(c => c.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(c => c.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(c => c.UpdatedDate).HasColumnName("updated_date");
    }
}
