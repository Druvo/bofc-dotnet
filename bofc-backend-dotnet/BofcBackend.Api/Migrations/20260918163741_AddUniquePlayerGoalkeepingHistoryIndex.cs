using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUniquePlayerGoalkeepingHistoryIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_player_goalkeeping_history_player_id",
                table: "player_goalkeeping_history");

            // Live data already violates the constraint being added below - nothing guarded these
            // rows before, so assign/remove/re-assign and repeat clicks of Auto-Assign each appended
            // another row, leaving several players with two or three rows for one match day. Creating
            // the unique index against that data fails outright, so the duplicates go first. The
            // lowest id per (player, match day) survives: it carries the round number the player was
            // first credited with, which is the one the fairness rotation was run on. The rows being
            // deleted are pure duplicates - the balance math already collapses them via .Distinct(),
            // so only the player-facing history display changes.
            migrationBuilder.Sql(@"
                DELETE dup
                FROM player_goalkeeping_history dup
                WHERE dup.id > (
                    SELECT MIN(keep.id)
                    FROM player_goalkeeping_history keep
                    WHERE keep.player_id = dup.player_id
                      AND keep.match_day_id = dup.match_day_id
                );
            ");

            migrationBuilder.CreateIndex(
                name: "IX_player_goalkeeping_history_player_id_match_day_id",
                table: "player_goalkeeping_history",
                columns: new[] { "player_id", "match_day_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Schema-only revert: the indexes go back to how they were, but the duplicate history
            // rows Up deleted are gone for good and cannot be reconstructed from anything left in
            // the database. Restoring them needs a backup taken before this migration ran.
            migrationBuilder.DropIndex(
                name: "IX_player_goalkeeping_history_player_id_match_day_id",
                table: "player_goalkeeping_history");

            migrationBuilder.CreateIndex(
                name: "IX_player_goalkeeping_history_player_id",
                table: "player_goalkeeping_history",
                column: "player_id");
        }
    }
}
