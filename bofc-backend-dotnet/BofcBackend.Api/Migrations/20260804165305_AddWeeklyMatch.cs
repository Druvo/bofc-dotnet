using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWeeklyMatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "weekly_match_day_of_week",
                table: "system_settings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_duration_minutes",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "weekly_match_enabled",
                table: "system_settings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "weekly_match_invite_all_active_players",
                table: "system_settings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "weekly_match_sport_type",
                table: "system_settings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "weekly_match_time",
                table: "system_settings",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<long>(
                name: "weekly_match_venue_id",
                table: "system_settings",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "weekly_match_invited_players",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_weekly_match_invited_players", x => x.id);
                    table.ForeignKey(
                        name: "FK_weekly_match_invited_players_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "weekly_matches",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    match_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    venue_id = table.Column<long>(type: "bigint", nullable: false),
                    sport_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    duration_minutes = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_weekly_matches", x => x.id);
                    table.ForeignKey(
                        name: "FK_weekly_matches_venues_venue_id",
                        column: x => x.venue_id,
                        principalTable: "venues",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "weekly_match_rsvps",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    weekly_match_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    is_going = table.Column<bool>(type: "bit", nullable: false),
                    comments = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_weekly_match_rsvps", x => x.id);
                    table.ForeignKey(
                        name: "FK_weekly_match_rsvps_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_weekly_match_rsvps_weekly_matches_weekly_match_id",
                        column: x => x.weekly_match_id,
                        principalTable: "weekly_matches",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_system_settings_weekly_match_venue_id",
                table: "system_settings",
                column: "weekly_match_venue_id");

            migrationBuilder.CreateIndex(
                name: "IX_weekly_match_invited_players_player_id",
                table: "weekly_match_invited_players",
                column: "player_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_weekly_match_rsvps_player_id",
                table: "weekly_match_rsvps",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_weekly_match_rsvps_weekly_match_id_player_id",
                table: "weekly_match_rsvps",
                columns: new[] { "weekly_match_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_weekly_matches_match_date",
                table: "weekly_matches",
                column: "match_date");

            migrationBuilder.CreateIndex(
                name: "IX_weekly_matches_venue_id",
                table: "weekly_matches",
                column: "venue_id");

            migrationBuilder.AddForeignKey(
                name: "FK_system_settings_venues_weekly_match_venue_id",
                table: "system_settings",
                column: "weekly_match_venue_id",
                principalTable: "venues",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_system_settings_venues_weekly_match_venue_id",
                table: "system_settings");

            migrationBuilder.DropTable(
                name: "weekly_match_invited_players");

            migrationBuilder.DropTable(
                name: "weekly_match_rsvps");

            migrationBuilder.DropTable(
                name: "weekly_matches");

            migrationBuilder.DropIndex(
                name: "IX_system_settings_weekly_match_venue_id",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_day_of_week",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_duration_minutes",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_enabled",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_invite_all_active_players",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_sport_type",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_time",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "weekly_match_venue_id",
                table: "system_settings");
        }
    }
}
