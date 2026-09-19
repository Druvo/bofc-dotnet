using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchDayGuest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "match_day_guest",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_match_day_guest", x => x.id);
                    table.ForeignKey(
                        name: "FK_match_day_guest_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_match_day_guest_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_match_day_guest_match_day_id",
                table: "match_day_guest",
                column: "match_day_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_day_guest_team_id",
                table: "match_day_guest",
                column: "team_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "match_day_guest");
        }
    }
}
