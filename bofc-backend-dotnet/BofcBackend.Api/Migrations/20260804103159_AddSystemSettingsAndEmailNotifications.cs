using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettingsAndEmailNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "reminder_sent_at",
                table: "tournament",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "system_settings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false),
                    smtp_enabled = table.Column<bool>(type: "bit", nullable: false),
                    smtp_host = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    smtp_port = table.Column<int>(type: "int", nullable: false),
                    smtp_username = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    smtp_password_encrypted = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    smtp_from_email = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    smtp_from_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    smtp_use_ssl = table.Column<bool>(type: "bit", nullable: false),
                    notify_tournament_reminder_enabled = table.Column<bool>(type: "bit", nullable: false),
                    tournament_reminder_days_before = table.Column<int>(type: "int", nullable: false),
                    notify_payment_due_enabled = table.Column<bool>(type: "bit", nullable: false),
                    payment_due_reminder_day_of_month = table.Column<int>(type: "int", nullable: false),
                    notify_custom_email_enabled = table.Column<bool>(type: "bit", nullable: false),
                    last_payment_reminder_sent_month = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_settings", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "system_settings");

            migrationBuilder.DropColumn(
                name: "reminder_sent_at",
                table: "tournament");
        }
    }
}
