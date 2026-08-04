using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameSkypeIdToTeamsId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "skype_id",
                table: "players",
                newName: "teams_id");

            migrationBuilder.RenameIndex(
                name: "IX_players_skype_id",
                table: "players",
                newName: "IX_players_teams_id");

            migrationBuilder.RenameColumn(
                name: "skype_id",
                table: "auction_player_registrations",
                newName: "teams_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "teams_id",
                table: "players",
                newName: "skype_id");

            migrationBuilder.RenameIndex(
                name: "IX_players_teams_id",
                table: "players",
                newName: "IX_players_skype_id");

            migrationBuilder.RenameColumn(
                name: "teams_id",
                table: "auction_player_registrations",
                newName: "skype_id");
        }
    }
}
