using BofcBackend.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BofcBackend.Api.Data.Configurations;

public class SystemSettingsConfiguration : IEntityTypeConfiguration<SystemSettings>
{
    public void Configure(EntityTypeBuilder<SystemSettings> builder)
    {
        builder.ToTable("system_settings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").ValueGeneratedNever();

        builder.Property(s => s.SmtpEnabled).HasColumnName("smtp_enabled").IsRequired();
        builder.Property(s => s.SmtpHost).HasColumnName("smtp_host").HasMaxLength(250);
        builder.Property(s => s.SmtpPort).HasColumnName("smtp_port").IsRequired();
        builder.Property(s => s.SmtpUsername).HasColumnName("smtp_username").HasMaxLength(250);
        builder.Property(s => s.SmtpPasswordEncrypted).HasColumnName("smtp_password_encrypted").HasMaxLength(1000);
        builder.Property(s => s.SmtpFromEmail).HasColumnName("smtp_from_email").HasMaxLength(250);
        builder.Property(s => s.SmtpFromName).HasColumnName("smtp_from_name").HasMaxLength(150);
        builder.Property(s => s.SmtpUseSsl).HasColumnName("smtp_use_ssl").IsRequired();

        builder.Property(s => s.NotifyMatchDayReminderEnabled).HasColumnName("notify_match_day_reminder_enabled").IsRequired();
        builder.Property(s => s.MatchDayReminderDaysBefore).HasColumnName("match_day_reminder_days_before").IsRequired();

        builder.Property(s => s.NotifyPaymentDueEnabled).HasColumnName("notify_payment_due_enabled").IsRequired();
        builder.Property(s => s.PaymentDueReminderDayOfMonth).HasColumnName("payment_due_reminder_day_of_month").IsRequired();

        builder.Property(s => s.NotifyCustomEmailEnabled).HasColumnName("notify_custom_email_enabled").IsRequired();
        builder.Property(s => s.PushNotificationsEnabled).HasColumnName("push_notifications_enabled").IsRequired();
        builder.Property(s => s.LastPaymentReminderSentAt).HasColumnName("last_payment_reminder_sent_at");
        builder.Property(s => s.MatchDayReminderRepeatHours).HasColumnName("match_day_reminder_repeat_hours").HasDefaultValue(48).IsRequired();
        builder.Property(s => s.PaymentDueReminderRepeatDays).HasColumnName("payment_due_reminder_repeat_days").HasDefaultValue(7).IsRequired();
        builder.Property(s => s.MatchDayStatusCheckIntervalHours).HasColumnName("match_day_status_check_interval_hours").HasDefaultValue(1).IsRequired();
        builder.Property(s => s.VotingLockEnabled).HasColumnName("voting_lock_enabled").IsRequired();
        builder.Property(s => s.VotingLockHoursBeforeMatch).HasColumnName("voting_lock_hours_before_match").HasDefaultValue(5).IsRequired();

        builder.Property(s => s.WeeklyMatchDayEnabled).HasColumnName("weekly_match_day_enabled").IsRequired();
        builder.Property(s => s.WeeklyMatchDayNamePrefix).HasColumnName("weekly_match_day_name_prefix").HasMaxLength(100).IsRequired();
        builder.Property(s => s.WeeklyMatchDayOfWeek).HasColumnName("weekly_match_day_of_week").HasConversion<string>().IsRequired();
        builder.Property(s => s.WeeklyMatchTime).HasColumnName("weekly_match_time").IsRequired();
        builder.Property(s => s.WeeklyMatchDayVenueId).HasColumnName("weekly_match_day_venue_id");
        builder.Property(s => s.WeeklyMatchDaySportType).HasColumnName("weekly_match_day_sport_type").HasConversion<string>().IsRequired();
        builder.HasOne(s => s.WeeklyMatchDayVenue).WithMany().HasForeignKey(s => s.WeeklyMatchDayVenueId).OnDelete(DeleteBehavior.SetNull);

        builder.Property(s => s.MatchDaysPerWeek).HasColumnName("match_days_per_week").HasDefaultValue(1).IsRequired();
        // Remember: this replaced WeeklyMatchDayTeamCount (a fixed team count) - the stored
        // meaning changed, not just the name, so the migration for this drops the old column
        // and adds this one fresh with a sensible default rather than reinterpreting old values.
        builder.Property(s => s.WeeklyMatchDayMaxPlayersPerTeam).HasColumnName("weekly_match_day_max_players_per_team").HasDefaultValue(6).ValueGeneratedNever().IsRequired();
        builder.Property(s => s.WeeklyMatchDayAutoTeamsEnabled).HasColumnName("weekly_match_day_auto_teams_enabled").IsRequired();
        builder.Property(s => s.WeeklyMatchDayAutoTeamsLeadHours).HasColumnName("weekly_match_day_auto_teams_lead_hours").HasDefaultValue(24).IsRequired();
        builder.Property(s => s.MinGoalkeepersPerTeam).HasColumnName("min_goalkeepers_per_team").HasDefaultValue(2).ValueGeneratedNever().IsRequired();
        builder.HasMany(s => s.WeeklyMatchDaySlots).WithOne(sl => sl.SystemSettings).HasForeignKey(sl => sl.SystemSettingsId).OnDelete(DeleteBehavior.Cascade);

        builder.Property(s => s.CashChartCode).HasColumnName("cash_chart_code").HasMaxLength(50);
        builder.Property(s => s.CollectionIncomeChartCode).HasColumnName("collection_income_chart_code").HasMaxLength(50);


        builder.Property(s => s.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(s => s.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(s => s.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(s => s.UpdatedDate).HasColumnName("updated_date");
    }
}
