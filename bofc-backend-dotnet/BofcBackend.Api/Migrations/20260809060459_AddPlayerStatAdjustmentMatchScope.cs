using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerStatAdjustmentMatchScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_player_stat_adjustment_player_id",
                table: "player_stat_adjustment");

            migrationBuilder.AddColumn<long>(
                name: "match_id",
                table: "player_stat_adjustment",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_player_stat_adjustment_match_id",
                table: "player_stat_adjustment",
                column: "match_id");

            migrationBuilder.CreateIndex(
                name: "IX_player_stat_adjustment_player_id_lifetime",
                table: "player_stat_adjustment",
                column: "player_id",
                unique: true,
                filter: "[match_id] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_player_stat_adjustment_player_id_match_id",
                table: "player_stat_adjustment",
                columns: new[] { "player_id", "match_id" },
                unique: true,
                filter: "[match_id] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_player_stat_adjustment_match_match_id",
                table: "player_stat_adjustment",
                column: "match_id",
                principalTable: "match",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_player_stat_adjustment_match_match_id",
                table: "player_stat_adjustment");

            migrationBuilder.DropIndex(
                name: "IX_player_stat_adjustment_match_id",
                table: "player_stat_adjustment");

            migrationBuilder.DropIndex(
                name: "IX_player_stat_adjustment_player_id_lifetime",
                table: "player_stat_adjustment");

            migrationBuilder.DropIndex(
                name: "IX_player_stat_adjustment_player_id_match_id",
                table: "player_stat_adjustment");

            migrationBuilder.DropColumn(
                name: "match_id",
                table: "player_stat_adjustment");

            migrationBuilder.CreateIndex(
                name: "IX_player_stat_adjustment_player_id",
                table: "player_stat_adjustment",
                column: "player_id",
                unique: true);
        }
    }
}
