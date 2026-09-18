using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPausedToPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_paused",
                table: "players",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_paused",
                table: "players");
        }
    }
}
