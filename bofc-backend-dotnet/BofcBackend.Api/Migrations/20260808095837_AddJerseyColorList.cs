using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddJerseyColorList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "jersey_color",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    system_settings_id = table.Column<long>(type: "bigint", nullable: false),
                    color = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_jersey_color", x => x.id);
                    table.ForeignKey(
                        name: "FK_jersey_color_system_settings_system_settings_id",
                        column: x => x.system_settings_id,
                        principalTable: "system_settings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_jersey_color_system_settings_id",
                table: "jersey_color",
                column: "system_settings_id");

            // Data migration: seed the new table from the existing jersey_color_a/b columns
            // BEFORE dropping them - a straight DropColumn here would silently lose whatever the
            // club had actually configured (confirmed non-default data: white/yellow).
            migrationBuilder.Sql(@"
                INSERT INTO jersey_color (system_settings_id, color, sort_order)
                SELECT id, jersey_color_a, 0 FROM system_settings WHERE jersey_color_a IS NOT NULL;
                INSERT INTO jersey_color (system_settings_id, color, sort_order)
                SELECT id, jersey_color_b, 1 FROM system_settings WHERE jersey_color_b IS NOT NULL;
            ");

            migrationBuilder.DropColumn(
                name: "jersey_color_a",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "jersey_color_b",
                table: "system_settings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "jersey_color");

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
        }
    }
}
