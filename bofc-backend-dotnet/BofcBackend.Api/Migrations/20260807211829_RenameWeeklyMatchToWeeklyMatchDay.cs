using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameWeeklyMatchToWeeklyMatchDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_system_settings_venues_weekly_match_venue_id",
                table: "system_settings");

            migrationBuilder.RenameTable(
                name: "weekly_match_slot",
                newName: "weekly_match_day_slot");

            migrationBuilder.RenameIndex(
                name: "IX_weekly_match_slot_system_settings_id",
                table: "weekly_match_day_slot",
                newName: "IX_weekly_match_day_slot_system_settings_id");

            migrationBuilder.RenameColumn(
                name: "weekly_match_venue_id",
                table: "system_settings",
                newName: "weekly_match_day_venue_id");

            migrationBuilder.RenameColumn(
                name: "weekly_match_team_count",
                table: "system_settings",
                newName: "weekly_match_day_team_count");

            migrationBuilder.RenameColumn(
                name: "weekly_match_sport_type",
                table: "system_settings",
                newName: "weekly_match_day_sport_type");

            migrationBuilder.RenameColumn(
                name: "weekly_match_name_prefix",
                table: "system_settings",
                newName: "weekly_match_day_name_prefix");

            migrationBuilder.RenameColumn(
                name: "weekly_match_enabled",
                table: "system_settings",
                newName: "weekly_match_day_enabled");

            migrationBuilder.RenameColumn(
                name: "weekly_match_duration_minutes",
                table: "system_settings",
                newName: "weekly_match_day_duration_minutes");

            migrationBuilder.RenameColumn(
                name: "weekly_match_auto_teams_lead_hours",
                table: "system_settings",
                newName: "weekly_match_day_auto_teams_lead_hours");

            migrationBuilder.RenameColumn(
                name: "weekly_match_auto_teams_enabled",
                table: "system_settings",
                newName: "weekly_match_day_auto_teams_enabled");

            migrationBuilder.RenameColumn(
                name: "matches_per_week",
                table: "system_settings",
                newName: "match_days_per_week");

            migrationBuilder.RenameIndex(
                name: "IX_system_settings_weekly_match_venue_id",
                table: "system_settings",
                newName: "IX_system_settings_weekly_match_day_venue_id");

            migrationBuilder.Sql(
                "EXEC sp_rename N'dbo.PK_weekly_match_slot', N'PK_weekly_match_day_slot', N'OBJECT';");

            migrationBuilder.Sql(
                "EXEC sp_rename N'dbo.FK_weekly_match_slot_system_settings_system_settings_id', N'FK_weekly_match_day_slot_system_settings_system_settings_id', N'OBJECT';");

            migrationBuilder.AddForeignKey(
                name: "FK_system_settings_venues_weekly_match_day_venue_id",
                table: "system_settings",
                column: "weekly_match_day_venue_id",
                principalTable: "venues",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_system_settings_venues_weekly_match_day_venue_id",
                table: "system_settings");

            migrationBuilder.Sql(
                "EXEC sp_rename N'dbo.FK_weekly_match_day_slot_system_settings_system_settings_id', N'FK_weekly_match_slot_system_settings_system_settings_id', N'OBJECT';");

            migrationBuilder.Sql(
                "EXEC sp_rename N'dbo.PK_weekly_match_day_slot', N'PK_weekly_match_slot', N'OBJECT';");

            migrationBuilder.RenameTable(
                name: "weekly_match_day_slot",
                newName: "weekly_match_slot");

            migrationBuilder.RenameIndex(
                name: "IX_weekly_match_day_slot_system_settings_id",
                table: "weekly_match_slot",
                newName: "IX_weekly_match_slot_system_settings_id");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_venue_id",
                table: "system_settings",
                newName: "weekly_match_venue_id");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_team_count",
                table: "system_settings",
                newName: "weekly_match_team_count");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_sport_type",
                table: "system_settings",
                newName: "weekly_match_sport_type");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_name_prefix",
                table: "system_settings",
                newName: "weekly_match_name_prefix");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_enabled",
                table: "system_settings",
                newName: "weekly_match_enabled");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_duration_minutes",
                table: "system_settings",
                newName: "weekly_match_duration_minutes");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_auto_teams_lead_hours",
                table: "system_settings",
                newName: "weekly_match_auto_teams_lead_hours");

            migrationBuilder.RenameColumn(
                name: "weekly_match_day_auto_teams_enabled",
                table: "system_settings",
                newName: "weekly_match_auto_teams_enabled");

            migrationBuilder.RenameColumn(
                name: "match_days_per_week",
                table: "system_settings",
                newName: "matches_per_week");

            migrationBuilder.RenameIndex(
                name: "IX_system_settings_weekly_match_day_venue_id",
                table: "system_settings",
                newName: "IX_system_settings_weekly_match_venue_id");

            migrationBuilder.AddForeignKey(
                name: "FK_system_settings_venues_weekly_match_venue_id",
                table: "system_settings",
                column: "weekly_match_venue_id",
                principalTable: "venues",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
