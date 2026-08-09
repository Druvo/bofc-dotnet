using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerStatAdjustment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "player_stat_adjustment",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    goals_adjustment = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    assists_adjustment = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    yellow_cards_adjustment = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    red_cards_adjustment = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    matches_played_adjustment = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_player_stat_adjustment", x => x.id);
                    table.ForeignKey(
                        name: "FK_player_stat_adjustment_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_player_stat_adjustment_player_id",
                table: "player_stat_adjustment",
                column: "player_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "player_stat_adjustment");
        }
    }
}
