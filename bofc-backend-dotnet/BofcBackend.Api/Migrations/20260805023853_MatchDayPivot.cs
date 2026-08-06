using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class MatchDayPivot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "weekly_match_invited_players");

            migrationBuilder.DropTable(
                name: "weekly_match_rsvps");

            migrationBuilder.DropTable(
                name: "weekly_matches");

            migrationBuilder.DropColumn(
                name: "weekly_match_invite_all_active_players",
                table: "system_settings");

            migrationBuilder.AddColumn<bool>(
                name: "is_weekly_match_day",
                table: "tournament",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "jersey_color",
                table: "team",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_time_gap_minutes",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_weekly_match_day",
                table: "tournament");

            migrationBuilder.DropColumn(
                name: "jersey_color",
                table: "team");

            migrationBuilder.DropColumn(
                name: "weekly_match_time_gap_minutes",
                table: "system_settings");

            migrationBuilder.AddColumn<bool>(
                name: "weekly_match_invite_all_active_players",
                table: "system_settings",
                type: "bit",
                nullable: false,
                defaultValue: false);

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
                    venue_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    duration_minutes = table.Column<int>(type: "int", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    match_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    sport_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
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
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    weekly_match_id = table.Column<long>(type: "bigint", nullable: false),
                    comments = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_going = table.Column<bool>(type: "bit", nullable: false),
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
        }
    }
}
