using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDefaultGoalkeeperToPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "default_goalkeeper",
                table: "players",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "default_goalkeeper",
                table: "players");
        }
    }
}
