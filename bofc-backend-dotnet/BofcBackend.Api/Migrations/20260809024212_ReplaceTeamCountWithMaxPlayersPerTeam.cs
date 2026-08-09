using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceTeamCountWithMaxPlayersPerTeam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "weekly_match_day_team_count",
                table: "system_settings");

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_day_max_players_per_team",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 6);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "weekly_match_day_max_players_per_team",
                table: "system_settings");

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_day_team_count",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 2);
        }
    }
}
