using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAuctionFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auction_bids");

            migrationBuilder.DropTable(
                name: "auction_player_registrations");

            migrationBuilder.DropTable(
                name: "auction_settings");

            migrationBuilder.DropTable(
                name: "team_budgets");

            migrationBuilder.DropTable(
                name: "auction_sessions");

            migrationBuilder.DropTable(
                name: "auction_players");

            migrationBuilder.DropColumn(
                name: "auction_enabled",
                table: "system_settings");

            migrationBuilder.DropColumn(
                name: "auction_mode",
                table: "match_day");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "auction_enabled",
                table: "system_settings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "auction_mode",
                table: "match_day",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "auction_player_registrations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    approved_by = table.Column<long>(type: "bigint", nullable: true),
                    created_player_id = table.Column<long>(type: "bigint", nullable: true),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    approval_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    approved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    availability_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    batting_style = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    bowling_style = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    emergency_contact = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    employee_id = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    mobile_no = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    playing_position = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    preferred_base_price = table.Column<int>(type: "int", nullable: true),
                    previous_experience = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    profile_photo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    teams_id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_player_registrations", x => x.id);
                    table.ForeignKey(
                        name: "FK_auction_player_registrations_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_player_registrations_players_approved_by",
                        column: x => x.approved_by,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_player_registrations_players_created_player_id",
                        column: x => x.created_player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_players",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    current_highest_team_id = table.Column<long>(type: "bigint", nullable: true),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    sold_to_team_id = table.Column<long>(type: "bigint", nullable: true),
                    auction_round = table.Column<int>(type: "int", nullable: false),
                    base_price = table.Column<int>(type: "int", nullable: false),
                    category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    current_bid = table.Column<int>(type: "int", nullable: true),
                    final_price = table.Column<int>(type: "int", nullable: true),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    player_rating = table.Column<decimal>(type: "decimal(4,2)", nullable: true),
                    player_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    sequence_order = table.Column<int>(type: "int", nullable: true),
                    status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    version = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_players", x => x.id);
                    table.ForeignKey(
                        name: "FK_auction_players_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_players_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_players_team_current_highest_team_id",
                        column: x => x.current_highest_team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_players_team_sold_to_team_id",
                        column: x => x.sold_to_team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_settings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    auction_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    auction_timer_seconds = table.Column<int>(type: "int", nullable: false),
                    bid_increment = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    extend_if_bid_within_last_seconds = table.Column<int>(type: "int", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    max_squad_size = table.Column<int>(type: "int", nullable: false),
                    min_role_requirements = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    min_squad_size = table.Column<int>(type: "int", nullable: false),
                    scheduled_start_time = table.Column<DateTime>(type: "datetime2", nullable: true),
                    team_budget = table.Column<int>(type: "int", nullable: false),
                    timer_extension_seconds = table.Column<int>(type: "int", nullable: false),
                    unsold_reauction_enabled = table.Column<bool>(type: "bit", nullable: false),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_auction_settings_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "team_budgets",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    owner_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    players_bought = table.Column<int>(type: "int", nullable: false),
                    remaining_budget = table.Column<int>(type: "int", nullable: false),
                    total_budget = table.Column<int>(type: "int", nullable: false),
                    total_spent = table.Column<int>(type: "int", nullable: false),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    version = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_budgets", x => x.id);
                    table.ForeignKey(
                        name: "FK_team_budgets_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_team_budgets_players_owner_id",
                        column: x => x.owner_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_team_budgets_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    current_auction_player_id = table.Column<long>(type: "bigint", nullable: true),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    current_timer_ends_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    paused_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    round_number = table.Column<int>(type: "int", nullable: false),
                    started_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_auction_sessions_auction_players_current_auction_player_id",
                        column: x => x.current_auction_player_id,
                        principalTable: "auction_players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_sessions_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_bids",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    auction_player_id = table.Column<long>(type: "bigint", nullable: false),
                    auction_session_id = table.Column<long>(type: "bigint", nullable: false),
                    bidder_user_id = table.Column<long>(type: "bigint", nullable: false),
                    match_day_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    bid_amount = table.Column<int>(type: "int", nullable: false),
                    bid_time = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_winning = table.Column<bool>(type: "bit", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_bids", x => x.id);
                    table.ForeignKey(
                        name: "FK_auction_bids_auction_players_auction_player_id",
                        column: x => x.auction_player_id,
                        principalTable: "auction_players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_bids_auction_sessions_auction_session_id",
                        column: x => x.auction_session_id,
                        principalTable: "auction_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_bids_match_day_match_day_id",
                        column: x => x.match_day_id,
                        principalTable: "match_day",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_bids_players_bidder_user_id",
                        column: x => x.bidder_user_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_auction_bids_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auction_bids_auction_player_id",
                table: "auction_bids",
                column: "auction_player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_bids_auction_session_id",
                table: "auction_bids",
                column: "auction_session_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_bids_bidder_user_id",
                table: "auction_bids",
                column: "bidder_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_bids_match_day_id",
                table: "auction_bids",
                column: "match_day_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_bids_team_id",
                table: "auction_bids",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_player_registrations_approved_by",
                table: "auction_player_registrations",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_auction_player_registrations_created_player_id",
                table: "auction_player_registrations",
                column: "created_player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_player_registrations_match_day_id",
                table: "auction_player_registrations",
                column: "match_day_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_current_highest_team_id",
                table: "auction_players",
                column: "current_highest_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_match_day_id_player_id",
                table: "auction_players",
                columns: new[] { "match_day_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_player_id",
                table: "auction_players",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_sold_to_team_id",
                table: "auction_players",
                column: "sold_to_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_sessions_current_auction_player_id",
                table: "auction_sessions",
                column: "current_auction_player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_sessions_match_day_id",
                table: "auction_sessions",
                column: "match_day_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_settings_match_day_id",
                table: "auction_settings",
                column: "match_day_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_budgets_match_day_id_team_id",
                table: "team_budgets",
                columns: new[] { "match_day_id", "team_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_budgets_owner_id",
                table: "team_budgets",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_budgets_team_id",
                table: "team_budgets",
                column: "team_id");
        }
    }
}
