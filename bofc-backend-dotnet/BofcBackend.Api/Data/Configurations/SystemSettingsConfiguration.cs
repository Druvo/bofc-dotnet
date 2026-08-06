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

        builder.Property(s => s.NotifyTournamentReminderEnabled).HasColumnName("notify_tournament_reminder_enabled").IsRequired();
        builder.Property(s => s.TournamentReminderDaysBefore).HasColumnName("tournament_reminder_days_before").IsRequired();

        builder.Property(s => s.NotifyPaymentDueEnabled).HasColumnName("notify_payment_due_enabled").IsRequired();
        builder.Property(s => s.PaymentDueReminderDayOfMonth).HasColumnName("payment_due_reminder_day_of_month").IsRequired();

        builder.Property(s => s.NotifyCustomEmailEnabled).HasColumnName("notify_custom_email_enabled").IsRequired();
        builder.Property(s => s.PushNotificationsEnabled).HasColumnName("push_notifications_enabled").IsRequired();
        builder.Property(s => s.AuctionEnabled).HasColumnName("auction_enabled").IsRequired();
        builder.Property(s => s.LastPaymentReminderSentMonth).HasColumnName("last_payment_reminder_sent_month").HasMaxLength(7);

        builder.Property(s => s.WeeklyMatchEnabled).HasColumnName("weekly_match_enabled").IsRequired();
        builder.Property(s => s.WeeklyMatchNamePrefix).HasColumnName("weekly_match_name_prefix").HasMaxLength(100).IsRequired();
        builder.Property(s => s.WeeklyMatchDayOfWeek).HasColumnName("weekly_match_day_of_week").HasConversion<string>().IsRequired();
        builder.Property(s => s.WeeklyMatchTime).HasColumnName("weekly_match_time").IsRequired();
        builder.Property(s => s.WeeklyMatchVenueId).HasColumnName("weekly_match_venue_id");
        builder.Property(s => s.WeeklyMatchSportType).HasColumnName("weekly_match_sport_type").HasConversion<string>().IsRequired();
        builder.Property(s => s.WeeklyMatchDurationMinutes).HasColumnName("weekly_match_duration_minutes").IsRequired();
        builder.Property(s => s.WeeklyMatchTimeGapMinutes).HasColumnName("weekly_match_time_gap_minutes").IsRequired();
        builder.HasOne(s => s.WeeklyMatchVenue).WithMany().HasForeignKey(s => s.WeeklyMatchVenueId).OnDelete(DeleteBehavior.SetNull);

        builder.Property(s => s.CashChartCode).HasColumnName("cash_chart_code").HasMaxLength(50);
        builder.Property(s => s.CollectionIncomeChartCode).HasColumnName("collection_income_chart_code").HasMaxLength(50);

        builder.Property(s => s.JerseyColorA).HasColumnName("jersey_color_a").HasMaxLength(30).HasDefaultValue("red").IsRequired();
        builder.Property(s => s.JerseyColorB).HasColumnName("jersey_color_b").HasMaxLength(30).HasDefaultValue("yellow").IsRequired();

        builder.Property(s => s.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(s => s.CreatedDate).HasColumnName("created_date").IsRequired();
        builder.Property(s => s.LastModifiedBy).HasColumnName("last_modified_by");
        builder.Property(s => s.UpdatedDate).HasColumnName("updated_date");
    }
}
