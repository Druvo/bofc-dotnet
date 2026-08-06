using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class MoveJerseyColorToMatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "jersey_color",
                table: "team");

            migrationBuilder.AddColumn<string>(
                name: "jersey_color_a",
                table: "system_settings",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "red");

            migrationBuilder.AddColumn<string>(
                name: "jersey_color_b",
                table: "system_settings",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "yellow");

            migrationBuilder.AddColumn<string>(
                name: "away_jersey_color",
                table: "match",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "home_jersey_color",
                table: "match",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "jersey_color_a",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "jersey_color_b",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "away_jersey_color",
                table: "match");

            migrationBuilder.DropColumn(
                name: "home_jersey_color",
                table: "match");

            migrationBuilder.AddColumn<string>(
                name: "jersey_color",
                table: "team",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);
        }
    }
}
