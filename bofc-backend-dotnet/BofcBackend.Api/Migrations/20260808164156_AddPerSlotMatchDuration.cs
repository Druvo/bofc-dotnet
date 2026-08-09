using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPerSlotMatchDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "match_duration_minutes",
                table: "weekly_match_day_slot",
                type: "int",
                nullable: false,
                defaultValue: 13);

            migrationBuilder.AddColumn<int>(
                name: "match_duration_minutes",
                table: "match_day",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "match_duration_minutes",
                table: "weekly_match_day_slot");

            migrationBuilder.DropColumn(
                name: "match_duration_minutes",
                table: "match_day");
        }
    }
}
