using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class NotificationRecipientConfiguration : IEntityTypeConfiguration<NotificationRecipient>
{
    public void Configure(EntityTypeBuilder<NotificationRecipient> builder)
    {
        builder.ToTable("notification_recipients");
        builder.HasKey(nr => nr.Id);
        builder.Property(nr => nr.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(nr => nr.NotificationId).HasColumnName("notification_id").IsRequired();
        builder.Property(nr => nr.RecipientId).HasColumnName("recipient_id").IsRequired();
        builder.Property(nr => nr.IsRead).HasColumnName("is_read").IsRequired();
        builder.Property(nr => nr.ReadDate).HasColumnName("read_date");

        builder.Property(nr => nr.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(nr => nr.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(nr => nr.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(nr => nr.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(nr => nr.Notification).WithMany(n => n.Recipients).HasForeignKey(nr => nr.NotificationId);
        builder.HasOne(nr => nr.Recipient).WithMany().HasForeignKey(nr => nr.RecipientId);

        // Newest-first "my notifications" history is the hot query path.
        builder.HasIndex(nr => new { nr.RecipientId, nr.NotificationId });
    }
}
