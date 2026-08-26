using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class EmailTemplateConfiguration : IEntityTypeConfiguration<EmailTemplate>
{
    public void Configure(EntityTypeBuilder<EmailTemplate> builder)
    {
        builder.ToTable("email_templates");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(t => t.Key).HasColumnName("key_name").HasMaxLength(100).IsRequired();
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(t => t.Description).HasColumnName("description").HasMaxLength(1000);
        builder.Property(t => t.Subject).HasColumnName("subject").HasMaxLength(300).IsRequired();
        builder.Property(t => t.Body).HasColumnName("body").IsRequired();

        builder.HasIndex(t => t.Key).IsUnique();

        builder.Property(t => t.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(t => t.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(t => t.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(t => t.UpdatedDate).HasColumnName("updated_date");
    }
}
