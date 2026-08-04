using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class VenueConfiguration : IEntityTypeConfiguration<Venue>
{
    public void Configure(EntityTypeBuilder<Venue> builder)
    {
        builder.ToTable("venues");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(v => v.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(v => v.Address).HasColumnName("address").HasMaxLength(255).IsRequired();
        builder.Property(v => v.MapLink).HasColumnName("map_link").HasMaxLength(500);
        builder.Property(v => v.IsActive).HasColumnName("is_active").IsRequired();

        builder.Property(v => v.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(v => v.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(v => v.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(v => v.UpdatedDate).HasColumnName("updated_date");
    }
}
