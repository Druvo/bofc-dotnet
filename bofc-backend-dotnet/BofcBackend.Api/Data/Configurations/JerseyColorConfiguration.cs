using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class JerseyColorConfiguration : IEntityTypeConfiguration<JerseyColor>
{
    public void Configure(EntityTypeBuilder<JerseyColor> builder)
    {
        builder.ToTable("jersey_color");
        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(j => j.SystemSettingsId).HasColumnName("system_settings_id").IsRequired();
        builder.Property(j => j.Color).HasColumnName("color").HasMaxLength(30).IsRequired();
        builder.Property(j => j.SortOrder).HasColumnName("sort_order").IsRequired();

        builder.HasOne(j => j.SystemSettings)
            .WithMany(s => s.JerseyColors)
            .HasForeignKey(j => j.SystemSettingsId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
