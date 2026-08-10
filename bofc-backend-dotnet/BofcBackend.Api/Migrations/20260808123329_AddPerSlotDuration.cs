using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPerSlotDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "duration_minutes",
                table: "weekly_match_day_slot",
                type: "int",
                nullable: false,
                defaultValue: 90);

            // Data migration: backfill each slot's new per-slot duration from the old shared
            // global value BEFORE dropping it - a straight DropColumn here would silently lose
            // whatever the club had actually configured.
            migrationBuilder.Sql(@"
                UPDATE wds
                SET wds.duration_minutes = ss.weekly_match_day_duration_minutes
                FROM weekly_match_day_slot wds
                JOIN system_settings ss ON ss.id = wds.system_settings_id;
            ");

            migrationBuilder.DropColumn(
                name: "weekly_match_day_duration_minutes",
                table: "system_settings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "duration_minutes",
                table: "weekly_match_day_slot");

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_day_duration_minutes",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
