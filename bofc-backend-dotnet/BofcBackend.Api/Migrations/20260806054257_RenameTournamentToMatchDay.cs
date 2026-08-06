using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameTournamentToMatchDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_advancement_rule_tournament_round_source_round_id",
                table: "advancement_rule");

            migrationBuilder.DropForeignKey(
                name: "FK_advancement_rule_tournament_round_target_round_id",
                table: "advancement_rule");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_bids_tournament_tournament_id",
                table: "auction_bids");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_player_registrations_tournament_tournament_id",
                table: "auction_player_registrations");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_players_tournament_tournament_id",
                table: "auction_players");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_sessions_tournament_tournament_id",
                table: "auction_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_settings_tournament_tournament_id",
                table: "auction_settings");

            migrationBuilder.DropForeignKey(
                name: "FK_logic_node_tournament_round_source_round_id",
                table: "logic_node");

            migrationBuilder.DropForeignKey(
                name: "FK_logic_node_tournament_round_target_round_id",
                table: "logic_node");

            migrationBuilder.DropForeignKey(
                name: "FK_logic_node_tournament_tournament_id",
                table: "logic_node");

            migrationBuilder.DropForeignKey(
                name: "FK_match_tournament_round_round_id",
                table: "match");

            migrationBuilder.DropForeignKey(
                name: "FK_match_tournament_tournament_id",
                table: "match");

            migrationBuilder.DropForeignKey(
                name: "FK_player_goalkeeping_history_tournament_tournament_id",
                table: "player_goalkeeping_history");

            migrationBuilder.DropForeignKey(
                name: "FK_round_group_tournament_round_round_id",
                table: "round_group");

            migrationBuilder.DropForeignKey(
                name: "FK_round_team_tournament_round_round_id",
                table: "round_team");

            migrationBuilder.DropForeignKey(
                name: "FK_team_tournament_tournament_id",
                table: "team");

            migrationBuilder.DropForeignKey(
                name: "FK_team_budgets_tournament_tournament_id",
                table: "team_budgets");

            // The 5 tournament-* tables carry live data (rows confirmed present before this
            // migration was written) — renamed in place via RenameTable/RenameColumn instead of
            // the auto-scaffolded DropTable+CreateTable, which would have silently destroyed
            // every row. Their own internal FKs/PK/indexes are dropped and re-added under the
            // new names around the rename, same pattern EF already uses below for plain
            // column renames on the other 10 tables.
            migrationBuilder.DropForeignKey(
                name: "fk_tournament_venue",
                table: "tournament");

            migrationBuilder.DropForeignKey(
                name: "FK_tournament_participant_players_player_id",
                table: "tournament_participant");

            migrationBuilder.DropForeignKey(
                name: "FK_tournament_participant_tournament_tournament_id",
                table: "tournament_participant");

            migrationBuilder.DropForeignKey(
                name: "FK_tournament_prize_players_player_id",
                table: "tournament_prize");

            migrationBuilder.DropForeignKey(
                name: "FK_tournament_prize_team_team_id",
                table: "tournament_prize");

            migrationBuilder.DropForeignKey(
                name: "FK_tournament_prize_tournament_tournament_id",
                table: "tournament_prize");

            migrationBuilder.DropForeignKey(
                name: "FK_tournament_round_tournament_tournament_id",
                table: "tournament_round");

            // tournament_participant_players is NOT a real table — it's a hand-written SQL
            // VIEW (created directly via sqlcmd outside of migrations) whose body references
            // tournament/tournament_participant/tournament_date by name internally. A plain
            // table/column rename would leave it pointing at objects that no longer exist, so
            // it's dropped here and recreated further down once the tables/columns it joins
            // have been renamed.
            migrationBuilder.Sql("DROP VIEW [tournament_participant_players];");

            migrationBuilder.RenameTable(
                name: "tournament_participant",
                newName: "match_day_participant");

            migrationBuilder.RenameTable(
                name: "tournament_prize",
                newName: "match_day_prize");

            migrationBuilder.RenameTable(
                name: "tournament_round",
                newName: "match_day_round");

            migrationBuilder.RenameTable(
                name: "tournament",
                newName: "match_day");

            migrationBuilder.RenameColumn(
                name: "tournament_date",
                table: "match_day",
                newName: "match_day_date");

            migrationBuilder.RenameColumn(
                name: "tournament_status",
                table: "match_day",
                newName: "match_day_status");

            migrationBuilder.RenameColumn(
                name: "tournament_type",
                table: "match_day",
                newName: "match_day_type");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "match_day_participant",
                newName: "match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "match_day_prize",
                newName: "match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "match_day_round",
                newName: "match_day_id");

            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_tournament', N'PK_match_day', N'OBJECT';");
            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_tournament_participant', N'PK_match_day_participant', N'OBJECT';");
            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_tournament_prize', N'PK_match_day_prize', N'OBJECT';");
            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_tournament_round', N'PK_match_day_round', N'OBJECT';");

            migrationBuilder.Sql("""
                CREATE VIEW match_day_participant_players AS
                SELECT
                    t.id AS match_day_id,
                    t.name AS match_day_name,
                    t.match_day_date AS match_day_date,
                    p.id AS player_id,
                    p.name AS player_name,
                    p.employee_id AS player_employee_id,
                    p.photo_key AS photo_key,
                    tp.id AS match_day_participant_id,
                    tp.participation_status AS participation_status,
                    tp.comments AS comments
                FROM match_day t
                CROSS JOIN players p
                LEFT JOIN match_day_participant tp
                    ON tp.match_day_id = t.id AND tp.player_id = p.id
                WHERE t.is_active = 1 AND p.is_active = 1;
                """);

            migrationBuilder.RenameIndex(
                name: "IX_tournament_venue_id",
                table: "match_day",
                newName: "IX_match_day_venue_id");

            migrationBuilder.RenameIndex(
                name: "IX_tournament_participant_player_id",
                table: "match_day_participant",
                newName: "IX_match_day_participant_player_id");

            migrationBuilder.RenameIndex(
                name: "IX_tournament_participant_tournament_id_player_id",
                table: "match_day_participant",
                newName: "IX_match_day_participant_match_day_id_player_id");

            migrationBuilder.RenameIndex(
                name: "IX_tournament_prize_player_id",
                table: "match_day_prize",
                newName: "IX_match_day_prize_player_id");

            migrationBuilder.RenameIndex(
                name: "IX_tournament_prize_team_id",
                table: "match_day_prize",
                newName: "IX_match_day_prize_team_id");

            migrationBuilder.RenameIndex(
                name: "IX_tournament_prize_tournament_id",
                table: "match_day_prize",
                newName: "IX_match_day_prize_match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_tournament_round_tournament_id",
                table: "match_day_round",
                newName: "IX_match_day_round_match_day_id");

            migrationBuilder.AddForeignKey(
                name: "fk_match_day_venue",
                table: "match_day",
                column: "venue_id",
                principalTable: "venues",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_match_day_participant_players_player_id",
                table: "match_day_participant",
                column: "player_id",
                principalTable: "players",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_day_participant_match_day_match_day_id",
                table: "match_day_participant",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_day_prize_players_player_id",
                table: "match_day_prize",
                column: "player_id",
                principalTable: "players",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_day_prize_team_team_id",
                table: "match_day_prize",
                column: "team_id",
                principalTable: "team",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_day_prize_match_day_match_day_id",
                table: "match_day_prize",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_day_round_match_day_match_day_id",
                table: "match_day_round",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "team_budgets",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_team_budgets_tournament_id_team_id",
                table: "team_budgets",
                newName: "IX_team_budgets_match_day_id_team_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "team",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_team_tournament_id",
                table: "team",
                newName: "IX_team_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_reminder_days_before",
                table: "system_settings",
                newName: "match_day_reminder_days_before");

            migrationBuilder.RenameColumn(
                name: "notify_tournament_reminder_enabled",
                table: "system_settings",
                newName: "notify_match_day_reminder_enabled");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "player_goalkeeping_history",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_player_goalkeeping_history_tournament_id",
                table: "player_goalkeeping_history",
                newName: "IX_player_goalkeeping_history_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "match",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_tournament_id",
                table: "match",
                newName: "IX_match_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "logic_node",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_logic_node_tournament_id",
                table: "logic_node",
                newName: "IX_logic_node_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "auction_settings",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_settings_tournament_id",
                table: "auction_settings",
                newName: "IX_auction_settings_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "auction_sessions",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_sessions_tournament_id",
                table: "auction_sessions",
                newName: "IX_auction_sessions_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "auction_players",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_players_tournament_id_player_id",
                table: "auction_players",
                newName: "IX_auction_players_match_day_id_player_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "auction_player_registrations",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_player_registrations_tournament_id",
                table: "auction_player_registrations",
                newName: "IX_auction_player_registrations_match_day_id");

            migrationBuilder.RenameColumn(
                name: "tournament_id",
                table: "auction_bids",
                newName: "match_day_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_bids_tournament_id",
                table: "auction_bids",
                newName: "IX_auction_bids_match_day_id");

            migrationBuilder.AddForeignKey(
                name: "FK_advancement_rule_match_day_round_source_round_id",
                table: "advancement_rule",
                column: "source_round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_advancement_rule_match_day_round_target_round_id",
                table: "advancement_rule",
                column: "target_round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_bids_match_day_match_day_id",
                table: "auction_bids",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_player_registrations_match_day_match_day_id",
                table: "auction_player_registrations",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_players_match_day_match_day_id",
                table: "auction_players",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_sessions_match_day_match_day_id",
                table: "auction_sessions",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_settings_match_day_match_day_id",
                table: "auction_settings",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logic_node_match_day_match_day_id",
                table: "logic_node",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logic_node_match_day_round_source_round_id",
                table: "logic_node",
                column: "source_round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logic_node_match_day_round_target_round_id",
                table: "logic_node",
                column: "target_round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_match_day_match_day_id",
                table: "match",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_match_day_round_round_id",
                table: "match",
                column: "round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_player_goalkeeping_history_match_day_match_day_id",
                table: "player_goalkeeping_history",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_round_group_match_day_round_round_id",
                table: "round_group",
                column: "round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_round_team_match_day_round_round_id",
                table: "round_team",
                column: "round_id",
                principalTable: "match_day_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_team_match_day_match_day_id",
                table: "team",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_team_budgets_match_day_match_day_id",
                table: "team_budgets",
                column: "match_day_id",
                principalTable: "match_day",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_advancement_rule_match_day_round_source_round_id",
                table: "advancement_rule");

            migrationBuilder.DropForeignKey(
                name: "FK_advancement_rule_match_day_round_target_round_id",
                table: "advancement_rule");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_bids_match_day_match_day_id",
                table: "auction_bids");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_player_registrations_match_day_match_day_id",
                table: "auction_player_registrations");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_players_match_day_match_day_id",
                table: "auction_players");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_sessions_match_day_match_day_id",
                table: "auction_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_auction_settings_match_day_match_day_id",
                table: "auction_settings");

            migrationBuilder.DropForeignKey(
                name: "FK_logic_node_match_day_match_day_id",
                table: "logic_node");

            migrationBuilder.DropForeignKey(
                name: "FK_logic_node_match_day_round_source_round_id",
                table: "logic_node");

            migrationBuilder.DropForeignKey(
                name: "FK_logic_node_match_day_round_target_round_id",
                table: "logic_node");

            migrationBuilder.DropForeignKey(
                name: "FK_match_match_day_match_day_id",
                table: "match");

            migrationBuilder.DropForeignKey(
                name: "FK_match_match_day_round_round_id",
                table: "match");

            migrationBuilder.DropForeignKey(
                name: "FK_player_goalkeeping_history_match_day_match_day_id",
                table: "player_goalkeeping_history");

            migrationBuilder.DropForeignKey(
                name: "FK_round_group_match_day_round_round_id",
                table: "round_group");

            migrationBuilder.DropForeignKey(
                name: "FK_round_team_match_day_round_round_id",
                table: "round_team");

            migrationBuilder.DropForeignKey(
                name: "FK_team_match_day_match_day_id",
                table: "team");

            migrationBuilder.DropForeignKey(
                name: "FK_team_budgets_match_day_match_day_id",
                table: "team_budgets");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "team_budgets",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_team_budgets_match_day_id_team_id",
                table: "team_budgets",
                newName: "IX_team_budgets_tournament_id_team_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "team",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_team_match_day_id",
                table: "team",
                newName: "IX_team_tournament_id");

            migrationBuilder.RenameColumn(
                name: "notify_match_day_reminder_enabled",
                table: "system_settings",
                newName: "notify_tournament_reminder_enabled");

            migrationBuilder.RenameColumn(
                name: "match_day_reminder_days_before",
                table: "system_settings",
                newName: "tournament_reminder_days_before");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "player_goalkeeping_history",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_player_goalkeeping_history_match_day_id",
                table: "player_goalkeeping_history",
                newName: "IX_player_goalkeeping_history_tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "match",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_match_day_id",
                table: "match",
                newName: "IX_match_tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "logic_node",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_logic_node_match_day_id",
                table: "logic_node",
                newName: "IX_logic_node_tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "auction_settings",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_settings_match_day_id",
                table: "auction_settings",
                newName: "IX_auction_settings_tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "auction_sessions",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_sessions_match_day_id",
                table: "auction_sessions",
                newName: "IX_auction_sessions_tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "auction_players",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_players_match_day_id_player_id",
                table: "auction_players",
                newName: "IX_auction_players_tournament_id_player_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "auction_player_registrations",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_player_registrations_match_day_id",
                table: "auction_player_registrations",
                newName: "IX_auction_player_registrations_tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "auction_bids",
                newName: "tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_auction_bids_match_day_id",
                table: "auction_bids",
                newName: "IX_auction_bids_tournament_id");

            // Reverse of the rename-in-place performed in Up() for the 5 tables that carry
            // live data — mirrors it with RenameTable/RenameColumn instead of DropTable, so a
            // rollback does not destroy data either.
            migrationBuilder.DropForeignKey(
                name: "fk_match_day_venue",
                table: "match_day");

            migrationBuilder.DropForeignKey(
                name: "FK_match_day_participant_players_player_id",
                table: "match_day_participant");

            migrationBuilder.DropForeignKey(
                name: "FK_match_day_participant_match_day_match_day_id",
                table: "match_day_participant");

            migrationBuilder.DropForeignKey(
                name: "FK_match_day_prize_players_player_id",
                table: "match_day_prize");

            migrationBuilder.DropForeignKey(
                name: "FK_match_day_prize_team_team_id",
                table: "match_day_prize");

            migrationBuilder.DropForeignKey(
                name: "FK_match_day_prize_match_day_match_day_id",
                table: "match_day_prize");

            migrationBuilder.DropForeignKey(
                name: "FK_match_day_round_match_day_match_day_id",
                table: "match_day_round");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_venue_id",
                table: "match_day",
                newName: "IX_tournament_venue_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_participant_player_id",
                table: "match_day_participant",
                newName: "IX_tournament_participant_player_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_participant_match_day_id_player_id",
                table: "match_day_participant",
                newName: "IX_tournament_participant_tournament_id_player_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_prize_player_id",
                table: "match_day_prize",
                newName: "IX_tournament_prize_player_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_prize_team_id",
                table: "match_day_prize",
                newName: "IX_tournament_prize_team_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_prize_match_day_id",
                table: "match_day_prize",
                newName: "IX_tournament_prize_tournament_id");

            migrationBuilder.RenameIndex(
                name: "IX_match_day_round_match_day_id",
                table: "match_day_round",
                newName: "IX_tournament_round_tournament_id");

            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_match_day', N'PK_tournament', N'OBJECT';");
            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_match_day_participant', N'PK_tournament_participant', N'OBJECT';");
            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_match_day_prize', N'PK_tournament_prize', N'OBJECT';");
            migrationBuilder.Sql("EXEC sp_rename N'dbo.PK_match_day_round', N'PK_tournament_round', N'OBJECT';");

            // match_day_participant_players is the hand-written view, not a table — see the
            // matching comment in Up(). Drop it before the columns/tables it joins are renamed
            // back, then recreate it against the old names.
            migrationBuilder.Sql("DROP VIEW [match_day_participant_players];");

            migrationBuilder.RenameColumn(
                name: "match_day_date",
                table: "match_day",
                newName: "tournament_date");

            migrationBuilder.RenameColumn(
                name: "match_day_status",
                table: "match_day",
                newName: "tournament_status");

            migrationBuilder.RenameColumn(
                name: "match_day_type",
                table: "match_day",
                newName: "tournament_type");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "match_day_participant",
                newName: "tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "match_day_prize",
                newName: "tournament_id");

            migrationBuilder.RenameColumn(
                name: "match_day_id",
                table: "match_day_round",
                newName: "tournament_id");

            migrationBuilder.RenameTable(
                name: "match_day_participant",
                newName: "tournament_participant");

            migrationBuilder.RenameTable(
                name: "match_day_prize",
                newName: "tournament_prize");

            migrationBuilder.RenameTable(
                name: "match_day_round",
                newName: "tournament_round");

            migrationBuilder.RenameTable(
                name: "match_day",
                newName: "tournament");

            migrationBuilder.Sql("""
                CREATE VIEW tournament_participant_players AS
                SELECT
                    t.id AS tournament_id,
                    t.name AS tournament_name,
                    t.tournament_date AS tournament_date,
                    p.id AS player_id,
                    p.name AS player_name,
                    p.employee_id AS player_employee_id,
                    p.photo_key AS photo_key,
                    tp.id AS tournament_participant_id,
                    tp.participation_status AS participation_status,
                    tp.comments AS comments
                FROM tournament t
                CROSS JOIN players p
                LEFT JOIN tournament_participant tp
                    ON tp.tournament_id = t.id AND tp.player_id = p.id
                WHERE t.is_active = 1 AND p.is_active = 1;
                """);

            migrationBuilder.AddForeignKey(
                name: "fk_tournament_venue",
                table: "tournament",
                column: "venue_id",
                principalTable: "venues",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tournament_participant_players_player_id",
                table: "tournament_participant",
                column: "player_id",
                principalTable: "players",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tournament_participant_tournament_tournament_id",
                table: "tournament_participant",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tournament_prize_players_player_id",
                table: "tournament_prize",
                column: "player_id",
                principalTable: "players",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tournament_prize_team_team_id",
                table: "tournament_prize",
                column: "team_id",
                principalTable: "team",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tournament_prize_tournament_tournament_id",
                table: "tournament_prize",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_tournament_round_tournament_tournament_id",
                table: "tournament_round",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_advancement_rule_tournament_round_source_round_id",
                table: "advancement_rule",
                column: "source_round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_advancement_rule_tournament_round_target_round_id",
                table: "advancement_rule",
                column: "target_round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_bids_tournament_tournament_id",
                table: "auction_bids",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_player_registrations_tournament_tournament_id",
                table: "auction_player_registrations",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_players_tournament_tournament_id",
                table: "auction_players",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_sessions_tournament_tournament_id",
                table: "auction_sessions",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_auction_settings_tournament_tournament_id",
                table: "auction_settings",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logic_node_tournament_round_source_round_id",
                table: "logic_node",
                column: "source_round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logic_node_tournament_round_target_round_id",
                table: "logic_node",
                column: "target_round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_logic_node_tournament_tournament_id",
                table: "logic_node",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_tournament_round_round_id",
                table: "match",
                column: "round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_match_tournament_tournament_id",
                table: "match",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_player_goalkeeping_history_tournament_tournament_id",
                table: "player_goalkeeping_history",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_round_group_tournament_round_round_id",
                table: "round_group",
                column: "round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_round_team_tournament_round_round_id",
                table: "round_team",
                column: "round_id",
                principalTable: "tournament_round",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_team_tournament_tournament_id",
                table: "team",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_team_budgets_tournament_tournament_id",
                table: "team_budgets",
                column: "tournament_id",
                principalTable: "tournament",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
