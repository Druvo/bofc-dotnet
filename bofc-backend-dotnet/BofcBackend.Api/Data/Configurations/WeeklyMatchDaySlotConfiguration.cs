using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class WeeklyMatchDaySlotConfiguration : IEntityTypeConfiguration<WeeklyMatchDaySlot>
{
    public void Configure(EntityTypeBuilder<WeeklyMatchDaySlot> builder)
    {
        builder.ToTable("weekly_match_day_slot");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(s => s.SystemSettingsId).HasColumnName("system_settings_id").IsRequired();
        builder.Property(s => s.DayOfWeek).HasColumnName("day_of_week").HasConversion<string>().IsRequired();
        builder.Property(s => s.Time).HasColumnName("time").IsRequired();
        // ValueGeneratedNever() on all three below is load-bearing, not decoration: HasDefaultValue
        // alone marks a property as database-generated, and EF Core's SaveChanges then omits any
        // property from the INSERT whenever its value equals the CLR default for its type (0 for
        // int) — "assume unset, let the DB default apply." TimeGapMinutes' valid range legitimately
        // includes 0 (no gap), which IS int's default, so admins saving a 0 gap had it silently
        // discarded and replaced by the column's DEFAULT 15 on every insert (this service always
        // fully replaces the slot list, so every save is a fresh INSERT). ValueGeneratedNever forces
        // EF to always send whatever the app set, never substituting the DB default.
        builder.Property(s => s.DurationMinutes).HasColumnName("duration_minutes").HasDefaultValue(90).ValueGeneratedNever().IsRequired();
        builder.Property(s => s.MatchDurationMinutes).HasColumnName("match_duration_minutes").HasDefaultValue(13).ValueGeneratedNever().IsRequired();
        builder.Property(s => s.TimeGapMinutes).HasColumnName("time_gap_minutes").HasDefaultValue(15).ValueGeneratedNever().IsRequired();
        builder.Property(s => s.SortOrder).HasColumnName("sort_order").IsRequired();
    }
}
