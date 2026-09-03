using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

/// <summary>
/// Partial mapping for Phase 2 (only what Team's FK needs). Phase 3 extends this same
/// configuration file with the round/group/advancement-rule/prize relations once those
/// entities exist - do not duplicate a second IEntityTypeConfiguration&lt;MatchDay&gt;.
/// </summary>
public class MatchDayConfiguration : IEntityTypeConfiguration<MatchDay>
{
    public void Configure(EntityTypeBuilder<MatchDay> builder)
    {
        builder.ToTable("match_day");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(t => t.Name).HasColumnName("name");
        builder.Property(t => t.Title).HasColumnName("title");
        builder.Property(t => t.Season).HasColumnName("season");
        builder.Property(t => t.Description).HasColumnName("description").HasColumnType("NVARCHAR(MAX)");
        builder.Property(t => t.Rules).HasColumnName("rules").HasColumnType("NVARCHAR(MAX)");
        builder.Property(t => t.RoadmapImageUrl).HasColumnName("roadmap_image_url").HasMaxLength(500);
        builder.Property(t => t.MatchDayDate).HasColumnName("match_day_date").IsRequired();
        builder.Property(t => t.DurationMinutes).HasColumnName("duration_minutes");
        builder.Property(t => t.TimeGapMinutes).HasColumnName("time_gap_minutes");
        builder.Property(t => t.MatchDurationMinutes).HasColumnName("match_duration_minutes");

        builder.Property(t => t.MatchDayStatus).HasColumnName("match_day_status").HasConversion<string>().IsRequired();
        builder.Property(t => t.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(t => t.DefaultMatchDay).HasColumnName("is_default").IsRequired();
        builder.Property(t => t.SportType).HasColumnName("sport_type").HasConversion<string>().IsRequired();
        builder.Property(t => t.MatchDayType).HasColumnName("match_day_type").HasConversion<string>().IsRequired();
        builder.Property(t => t.GroupCount).HasColumnName("group_count");
        builder.Property(t => t.VenueId).HasColumnName("venue_id");
        builder.Property(t => t.ReminderSentAt).HasColumnName("reminder_sent_at");
        builder.Property(t => t.IsWeeklyMatchDay).HasColumnName("is_weekly_match_day").IsRequired();
        builder.Property(t => t.AutoGenSlotDayOfWeek).HasColumnName("auto_gen_slot_day_of_week").HasConversion<string>();
        builder.Property(t => t.AutoGenWeekStart).HasColumnName("auto_gen_week_start");
        builder.Property(t => t.IsManuallyModified).HasColumnName("is_manually_modified").IsRequired();
        builder.Property(t => t.AutoTeamsGenerated).HasColumnName("auto_teams_generated").IsRequired();

        builder.Property(t => t.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(t => t.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(t => t.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(t => t.UpdatedDate).HasColumnName("updated_date");

        builder.HasOne(t => t.Venue)
            .WithMany()
            .HasForeignKey(t => t.VenueId)
            .HasConstraintName("fk_match_day_venue")
            .IsRequired();

        // No MatchDay delete endpoint exists today, so this is currently unreachable - but note
        // for whoever adds one: this Cascade is inconsistent with MatchDayParticipantConfiguration
        // and MatchDayRoundConfiguration, which both use Restrict against MatchDay. As written, a
        // future delete would either always fail with an FK violation (once any participant/round
        // exists) or silently cascade away Teams/TeamPlayers while leaving orphaned participant
        // rows behind for MatchDays with none recorded yet. Reconcile before wiring up a delete.
        builder.HasMany(t => t.Teams)
            .WithOne(team => team.MatchDay)
            .HasForeignKey(team => team.MatchDayId)
            .OnDelete(DeleteBehavior.Cascade);

        // App-level "clear every other default, then set this one" (MatchDayService) is a
        // check-then-act race under concurrent writes - this filtered unique index is the real
        // backstop: at most one row can have is_default = 1 no matter how two transactions
        // interleave, and the loser's SaveChangesAsync throws instead of silently leaving two.
        builder.HasIndex(t => t.DefaultMatchDay)
            .HasFilter("[is_default] = 1")
            .IsUnique()
            .HasDatabaseName("ux_match_day_single_default");
    }
}
