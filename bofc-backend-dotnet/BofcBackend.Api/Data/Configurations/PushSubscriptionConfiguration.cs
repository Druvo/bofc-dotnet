using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.ToTable("push_subscriptions");
        builder.HasKey(ps => ps.Id);
        builder.Property(ps => ps.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(ps => ps.PlayerId).HasColumnName("player_id").IsRequired();
        builder.Property(ps => ps.Endpoint).HasColumnName("endpoint").HasMaxLength(1000).IsRequired();
        builder.Property(ps => ps.P256dh).HasColumnName("p256dh").HasMaxLength(200).IsRequired();
        builder.Property(ps => ps.Auth).HasColumnName("auth").HasMaxLength(100).IsRequired();

        builder.Property(ps => ps.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(ps => ps.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(ps => ps.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(ps => ps.UpdatedDate).HasColumnName("updated_date");

        // No unique index on (PlayerId, Endpoint): endpoint is nvarchar(1000) and some
        // browsers' push endpoints run long enough to risk SQL Server's ~900-byte index
        // key limit. Upsert-by-equality is handled in NotificationService instead — a
        // player has at most a handful of subscribed devices, so the linear check is cheap.
        // The FK below already gives PlayerId its own index by EF Core convention.
        builder.HasOne(ps => ps.Player).WithMany().HasForeignKey(ps => ps.PlayerId);
    }
}
