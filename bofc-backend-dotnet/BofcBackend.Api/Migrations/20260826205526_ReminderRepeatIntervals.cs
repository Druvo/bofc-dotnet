using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReminderRepeatIntervals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_payment_reminder_sent_month",
                table: "system_settings");

            migrationBuilder.AddColumn<DateTime>(
                name: "last_payment_reminder_sent_at",
                table: "system_settings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "match_day_reminder_repeat_hours",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 48);

            migrationBuilder.AddColumn<int>(
                name: "payment_due_reminder_repeat_days",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 7);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_payment_reminder_sent_at",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "match_day_reminder_repeat_hours",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "payment_due_reminder_repeat_days",
                table: "system_settings");

            migrationBuilder.AddColumn<string>(
                name: "last_payment_reminder_sent_month",
                table: "system_settings",
                type: "nvarchar(7)",
                maxLength: 7,
                nullable: true);
        }
    }
}
