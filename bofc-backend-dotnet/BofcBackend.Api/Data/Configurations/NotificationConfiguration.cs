using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(n => n.Title).HasColumnName("title").HasMaxLength(150).IsRequired();
        builder.Property(n => n.Body).HasColumnName("body").HasMaxLength(1000).IsRequired();
        builder.Property(n => n.TargetType).HasColumnName("target_type").HasConversion<string>().IsRequired();

        builder.Property(n => n.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(n => n.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(n => n.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(n => n.UpdatedDate).HasColumnName("updated_date");
    }
}
