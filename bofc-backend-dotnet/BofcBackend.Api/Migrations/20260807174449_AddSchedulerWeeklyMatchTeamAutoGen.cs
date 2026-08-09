using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSchedulerWeeklyMatchTeamAutoGen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "matches_per_week",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "weekly_match_auto_teams_enabled",
                table: "system_settings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_auto_teams_lead_hours",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 24);

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_team_count",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "player_rank",
                table: "players",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "auto_gen_slot_day_of_week",
                table: "match_day",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "auto_gen_week_start",
                table: "match_day",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "auto_teams_generated",
                table: "match_day",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_manually_modified",
                table: "match_day",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "weekly_match_slot",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    system_settings_id = table.Column<long>(type: "bigint", nullable: false),
                    day_of_week = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    time = table.Column<TimeSpan>(type: "time", nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_weekly_match_slot", x => x.id);
                    table.ForeignKey(
                        name: "FK_weekly_match_slot_system_settings_system_settings_id",
                        column: x => x.system_settings_id,
                        principalTable: "system_settings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_weekly_match_slot_system_settings_id",
                table: "weekly_match_slot",
                column: "system_settings_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "weekly_match_slot");

            migrationBuilder.DropColumn(
                name: "matches_per_week",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_auto_teams_enabled",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_auto_teams_lead_hours",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_team_count",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "player_rank",
                table: "players");

            migrationBuilder.DropColumn(
                name: "auto_gen_slot_day_of_week",
                table: "match_day");

            migrationBuilder.DropColumn(
                name: "auto_gen_week_start",
                table: "match_day");

            migrationBuilder.DropColumn(
                name: "auto_teams_generated",
                table: "match_day");

            migrationBuilder.DropColumn(
                name: "is_manually_modified",
                table: "match_day");
        }
    }
}
