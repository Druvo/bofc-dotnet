using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPerSlotTimeGap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "time_gap_minutes",
                table: "weekly_match_day_slot",
                type: "int",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.AddColumn<int>(
                name: "time_gap_minutes",
                table: "match_day",
                type: "int",
                nullable: true);

            // Data migration: backfill each slot's new per-slot gap from the old shared global
            // value BEFORE dropping it - a straight DropColumn here would silently lose whatever
            // the club had actually configured.
            migrationBuilder.Sql(@"
                UPDATE wds
                SET wds.time_gap_minutes = ss.weekly_match_time_gap_minutes
                FROM weekly_match_day_slot wds
                JOIN system_settings ss ON ss.id = wds.system_settings_id;
            ");

            migrationBuilder.DropColumn(
                name: "weekly_match_time_gap_minutes",
                table: "system_settings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "time_gap_minutes",
                table: "weekly_match_day_slot");

            migrationBuilder.DropColumn(
                name: "time_gap_minutes",
                table: "match_day");

            migrationBuilder.AddColumn<int>(
                name: "weekly_match_time_gap_minutes",
                table: "system_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
