using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BofcBackend.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ac_collections",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    transaction_id = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    total_amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    month_of_payment = table.Column<DateTime>(type: "date", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    date = table.Column<DateTime>(type: "date", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_collections", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ac_natures",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    code = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    type = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    sl_no = table.Column<int>(type: "int", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_natures", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ac_voucher_types",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    alias = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    ac_transaction_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_default = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_voucher_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "club_rule",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_club_rule", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payment_accounts",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    account_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    account_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    account_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    bank_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    branch = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    display_order = table.Column<int>(type: "int", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_accounts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "players",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    employee_id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    skype_id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    mobile_no = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    playing_position = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    last_password_change_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    profile_photo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    photo_key = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_players", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tournament_participant_players",
                columns: table => new
                {
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    tournament_name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    tournament_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    player_name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    player_employee_id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    photo_key = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    participation_status = table.Column<bool>(type: "bit", nullable: true),
                    tournament_participant_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tournament_participant_players", x => new { x.tournament_id, x.player_id });
                });

            migrationBuilder.CreateTable(
                name: "venues",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_venues", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ac_charts",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    parent_no = table.Column<long>(type: "bigint", nullable: true),
                    nature_no = table.Column<long>(type: "bigint", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_charts", x => x.id);
                    table.ForeignKey(
                        name: "FK_ac_charts_ac_charts_parent_no",
                        column: x => x.parent_no,
                        principalTable: "ac_charts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ac_charts_ac_natures_nature_no",
                        column: x => x.nature_no,
                        principalTable: "ac_natures",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "collection_players",
                columns: table => new
                {
                    collection_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collection_players", x => new { x.collection_id, x.player_id });
                    table.ForeignKey(
                        name: "FK_collection_players_ac_collections_collection_id",
                        column: x => x.collection_id,
                        principalTable: "ac_collections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_collection_players_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "players_roles",
                columns: table => new
                {
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    role_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_players_roles", x => new { x.player_id, x.role_id });
                    table.ForeignKey(
                        name: "FK_players_roles_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_players_roles_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tournament",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    title = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    season = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    description = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    rules = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    roadmap_image_url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    tournament_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    venue_id = table.Column<long>(type: "bigint", nullable: false),
                    tournament_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    is_default = table.Column<bool>(type: "bit", nullable: false),
                    sport_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    tournament_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    group_count = table.Column<int>(type: "int", nullable: true),
                    auction_mode = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tournament", x => x.id);
                    table.ForeignKey(
                        name: "fk_tournament_venue",
                        column: x => x.venue_id,
                        principalTable: "venues",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cost_types",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    chart_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cost_types", x => x.id);
                    table.ForeignKey(
                        name: "FK_cost_types_ac_charts_chart_id",
                        column: x => x.chart_id,
                        principalTable: "ac_charts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_player_registrations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    employee_id = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    skype_id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    mobile_no = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    playing_position = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    batting_style = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    bowling_style = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    previous_experience = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    availability_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    profile_photo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    emergency_contact = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    preferred_base_price = table.Column<int>(type: "int", nullable: true),
                    approval_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    approved_by = table.Column<long>(type: "bigint", nullable: true),
                    approved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    rejection_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_player_id = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_player_registrations", x => x.id);
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
                    table.ForeignKey(
                        name: "FK_auction_player_registrations_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_settings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    team_budget = table.Column<int>(type: "int", nullable: false),
                    min_squad_size = table.Column<int>(type: "int", nullable: false),
                    max_squad_size = table.Column<int>(type: "int", nullable: false),
                    auction_timer_seconds = table.Column<int>(type: "int", nullable: false),
                    bid_increment = table.Column<int>(type: "int", nullable: false),
                    unsold_reauction_enabled = table.Column<bool>(type: "bit", nullable: false),
                    timer_extension_seconds = table.Column<int>(type: "int", nullable: false),
                    extend_if_bid_within_last_seconds = table.Column<int>(type: "int", nullable: false),
                    min_role_requirements = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    auction_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    scheduled_start_time = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_auction_settings_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "player_goalkeeping_history",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    round_number = table.Column<int>(type: "int", nullable: false),
                    played_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_player_goalkeeping_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_player_goalkeeping_history_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_player_goalkeeping_history_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "team",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    team_name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    logo_key = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team", x => x.id);
                    table.ForeignKey(
                        name: "FK_team_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tournament_participant",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    participation_status = table.Column<bool>(type: "bit", nullable: false),
                    comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tournament_participant", x => x.id);
                    table.ForeignKey(
                        name: "FK_tournament_participant_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tournament_participant_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tournament_round",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    round_number = table.Column<int>(type: "int", nullable: false),
                    round_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    round_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    advancement_rule = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    sequence_order = table.Column<int>(type: "int", nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    end_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tournament_round", x => x.id);
                    table.ForeignKey(
                        name: "FK_tournament_round_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ac_bill_payments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    payment_date = table.Column<DateTime>(type: "date", nullable: false),
                    description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    cost_type_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_bill_payments", x => x.id);
                    table.ForeignKey(
                        name: "FK_ac_bill_payments_cost_types_cost_type_id",
                        column: x => x.cost_type_id,
                        principalTable: "cost_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "monthly_cost",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    cost_type_id = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<double>(type: "float", nullable: false),
                    month_of_cost = table.Column<DateTime>(type: "date", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_monthly_cost", x => x.id);
                    table.ForeignKey(
                        name: "FK_monthly_cost_cost_types_cost_type_id",
                        column: x => x.cost_type_id,
                        principalTable: "cost_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_players",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    player_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    base_price = table.Column<int>(type: "int", nullable: false),
                    current_bid = table.Column<int>(type: "int", nullable: true),
                    current_highest_team_id = table.Column<long>(type: "bigint", nullable: true),
                    sold_to_team_id = table.Column<long>(type: "bigint", nullable: true),
                    final_price = table.Column<int>(type: "int", nullable: true),
                    status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    auction_round = table.Column<int>(type: "int", nullable: false),
                    player_rating = table.Column<decimal>(type: "decimal(4,2)", nullable: true),
                    sequence_order = table.Column<int>(type: "int", nullable: true),
                    version = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auction_players", x => x.id);
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
                    table.ForeignKey(
                        name: "FK_auction_players_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "team_budgets",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    owner_id = table.Column<long>(type: "bigint", nullable: false),
                    total_budget = table.Column<int>(type: "int", nullable: false),
                    remaining_budget = table.Column<int>(type: "int", nullable: false),
                    total_spent = table.Column<int>(type: "int", nullable: false),
                    players_bought = table.Column<int>(type: "int", nullable: false),
                    version = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_budgets", x => x.id);
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
                    table.ForeignKey(
                        name: "FK_team_budgets_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "team_player",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    playing_position = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    team_player_role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_captain = table.Column<bool>(type: "bit", nullable: false),
                    jersey_number = table.Column<int>(type: "int", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_player", x => x.id);
                    table.ForeignKey(
                        name: "FK_team_player_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_team_player_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tournament_prize",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    prize_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: true),
                    player_id = table.Column<long>(type: "bigint", nullable: true),
                    position_rank = table.Column<int>(type: "int", nullable: false),
                    prize_amount = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    prize_category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    image_links = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tournament_prize", x => x.id);
                    table.ForeignKey(
                        name: "FK_tournament_prize_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tournament_prize_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tournament_prize_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "round_group",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    round_id = table.Column<long>(type: "bigint", nullable: false),
                    parent_group_id = table.Column<long>(type: "bigint", nullable: true),
                    group_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    group_format = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    advancement_rule = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    max_teams = table.Column<int>(type: "int", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_round_group", x => x.id);
                    table.ForeignKey(
                        name: "FK_round_group_round_group_parent_group_id",
                        column: x => x.parent_group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_round_group_tournament_round_round_id",
                        column: x => x.round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "round_team",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    round_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: true),
                    assignment_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    source_rule = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    is_placeholder = table.Column<bool>(type: "bit", nullable: false),
                    placeholder_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    seed_position = table.Column<int>(type: "int", nullable: true),
                    assigned_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_round_team", x => x.id);
                    table.ForeignKey(
                        name: "FK_round_team_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_round_team_tournament_round_round_id",
                        column: x => x.round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ac_vouchers",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    narration = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    voucher_date = table.Column<DateTime>(type: "date", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    post_flag = table.Column<bool>(type: "bit", nullable: false),
                    posted_by = table.Column<long>(type: "bigint", nullable: true),
                    post_date = table.Column<DateTime>(type: "date", nullable: true),
                    voucher_type_id = table.Column<long>(type: "bigint", nullable: false),
                    collection_id = table.Column<long>(type: "bigint", nullable: true),
                    payment_id = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_vouchers", x => x.id);
                    table.ForeignKey(
                        name: "FK_ac_vouchers_ac_bill_payments_payment_id",
                        column: x => x.payment_id,
                        principalTable: "ac_bill_payments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ac_vouchers_ac_collections_collection_id",
                        column: x => x.collection_id,
                        principalTable: "ac_collections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ac_vouchers_ac_voucher_types_voucher_type_id",
                        column: x => x.voucher_type_id,
                        principalTable: "ac_voucher_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ac_vouchers_players_posted_by",
                        column: x => x.posted_by,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "auction_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    current_auction_player_id = table.Column<long>(type: "bigint", nullable: true),
                    round_number = table.Column<int>(type: "int", nullable: false),
                    started_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    paused_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    current_timer_ends_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
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
                        name: "FK_auction_sessions_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "advancement_rule",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    source_round_id = table.Column<long>(type: "bigint", nullable: false),
                    source_group_id = table.Column<long>(type: "bigint", nullable: true),
                    target_round_id = table.Column<long>(type: "bigint", nullable: false),
                    target_group_id = table.Column<long>(type: "bigint", nullable: true),
                    rule_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    rule_config = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    priority_order = table.Column<int>(type: "int", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_advancement_rule", x => x.id);
                    table.ForeignKey(
                        name: "FK_advancement_rule_round_group_source_group_id",
                        column: x => x.source_group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_advancement_rule_round_group_target_group_id",
                        column: x => x.target_group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_advancement_rule_tournament_round_source_round_id",
                        column: x => x.source_round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_advancement_rule_tournament_round_target_round_id",
                        column: x => x.target_round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "group_standing",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    group_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    matches_played = table.Column<int>(type: "int", nullable: false),
                    wins = table.Column<int>(type: "int", nullable: false),
                    draws = table.Column<int>(type: "int", nullable: false),
                    losses = table.Column<int>(type: "int", nullable: false),
                    goals_for = table.Column<int>(type: "int", nullable: false),
                    goals_against = table.Column<int>(type: "int", nullable: false),
                    goal_difference = table.Column<int>(type: "int", nullable: false),
                    points = table.Column<int>(type: "int", nullable: false),
                    yellow_cards = table.Column<int>(type: "int", nullable: false),
                    red_cards = table.Column<int>(type: "int", nullable: false),
                    fair_play_points = table.Column<int>(type: "int", nullable: false),
                    tiebreak_rank = table.Column<int>(type: "int", nullable: true),
                    position = table.Column<int>(type: "int", nullable: true),
                    is_advanced = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_standing", x => x.id);
                    table.ForeignKey(
                        name: "FK_group_standing_round_group_group_id",
                        column: x => x.group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_group_standing_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "logic_node",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    node_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    node_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    source_round_id = table.Column<long>(type: "bigint", nullable: true),
                    source_group_id = table.Column<long>(type: "bigint", nullable: true),
                    target_round_id = table.Column<long>(type: "bigint", nullable: false),
                    rule_config = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    priority_order = table.Column<int>(type: "int", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    auto_execute = table.Column<bool>(type: "bit", nullable: false),
                    execution_count = table.Column<int>(type: "int", nullable: false),
                    last_executed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_logic_node", x => x.id);
                    table.ForeignKey(
                        name: "FK_logic_node_round_group_source_group_id",
                        column: x => x.source_group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_logic_node_tournament_round_source_round_id",
                        column: x => x.source_round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_logic_node_tournament_round_target_round_id",
                        column: x => x.target_round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_logic_node_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "match",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    round_id = table.Column<long>(type: "bigint", nullable: true),
                    group_id = table.Column<long>(type: "bigint", nullable: true),
                    home_team_id = table.Column<long>(type: "bigint", nullable: false),
                    away_team_id = table.Column<long>(type: "bigint", nullable: false),
                    venue_id = table.Column<long>(type: "bigint", nullable: true),
                    match_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    match_status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    match_order = table.Column<int>(type: "int", nullable: true),
                    round = table.Column<int>(type: "int", nullable: true),
                    group_name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_placeholder_match = table.Column<bool>(type: "bit", nullable: false),
                    match_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    series_number = table.Column<int>(type: "int", nullable: true),
                    bracket_position = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    home_team_score = table.Column<int>(type: "int", nullable: false),
                    away_team_score = table.Column<int>(type: "int", nullable: false),
                    match_duration_minutes = table.Column<int>(type: "int", nullable: true),
                    elapsed_time_seconds = table.Column<int>(type: "int", nullable: false),
                    started_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    completed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_match", x => x.id);
                    table.ForeignKey(
                        name: "FK_match_round_group_group_id",
                        column: x => x.group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_team_away_team_id",
                        column: x => x.away_team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_team_home_team_id",
                        column: x => x.home_team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_tournament_round_round_id",
                        column: x => x.round_id,
                        principalTable: "tournament_round",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_venues_venue_id",
                        column: x => x.venue_id,
                        principalTable: "venues",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "round_group_team",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    group_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: true),
                    assignment_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    source_rule = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    is_placeholder = table.Column<bool>(type: "bit", nullable: false),
                    placeholder_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    assigned_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_round_group_team", x => x.id);
                    table.ForeignKey(
                        name: "FK_round_group_team_round_group_group_id",
                        column: x => x.group_id,
                        principalTable: "round_group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_round_group_team_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ac_voucher_details",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    narration = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    dr = table.Column<decimal>(type: "decimal(19,2)", nullable: true),
                    cr = table.Column<decimal>(type: "decimal(19,2)", nullable: true),
                    ac_chart_id = table.Column<long>(type: "bigint", nullable: false),
                    voucher_id = table.Column<long>(type: "bigint", nullable: false),
                    reference_no = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ac_voucher_details", x => x.id);
                    table.ForeignKey(
                        name: "FK_ac_voucher_details_ac_charts_ac_chart_id",
                        column: x => x.ac_chart_id,
                        principalTable: "ac_charts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ac_voucher_details_ac_vouchers_voucher_id",
                        column: x => x.voucher_id,
                        principalTable: "ac_vouchers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "auction_bids",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    auction_session_id = table.Column<long>(type: "bigint", nullable: false),
                    tournament_id = table.Column<long>(type: "bigint", nullable: false),
                    auction_player_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    bidder_user_id = table.Column<long>(type: "bigint", nullable: false),
                    bid_amount = table.Column<int>(type: "int", nullable: false),
                    bid_time = table.Column<DateTime>(type: "datetime2", nullable: false),
                    is_winning = table.Column<bool>(type: "bit", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
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
                    table.ForeignKey(
                        name: "FK_auction_bids_tournament_tournament_id",
                        column: x => x.tournament_id,
                        principalTable: "tournament",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "match_event",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    match_id = table.Column<long>(type: "bigint", nullable: false),
                    event_type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: true),
                    team_id = table.Column<long>(type: "bigint", nullable: true),
                    event_time = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    related_player_id = table.Column<long>(type: "bigint", nullable: true),
                    details = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_match_event", x => x.id);
                    table.ForeignKey(
                        name: "FK_match_event_match_match_id",
                        column: x => x.match_id,
                        principalTable: "match",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_match_event_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_event_players_related_player_id",
                        column: x => x.related_player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_event_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "match_statistics",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    match_id = table.Column<long>(type: "bigint", nullable: false),
                    player_id = table.Column<long>(type: "bigint", nullable: false),
                    team_id = table.Column<long>(type: "bigint", nullable: false),
                    goals_scored = table.Column<int>(type: "int", nullable: false),
                    assists = table.Column<int>(type: "int", nullable: false),
                    red_cards = table.Column<int>(type: "int", nullable: false),
                    yellow_cards = table.Column<int>(type: "int", nullable: false),
                    substitution_in = table.Column<int>(type: "int", nullable: false),
                    substitution_out = table.Column<int>(type: "int", nullable: false),
                    minutes_played = table.Column<int>(type: "int", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_modified_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_match_statistics", x => x.id);
                    table.ForeignKey(
                        name: "FK_match_statistics_match_match_id",
                        column: x => x.match_id,
                        principalTable: "match",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_match_statistics_players_player_id",
                        column: x => x.player_id,
                        principalTable: "players",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_match_statistics_team_team_id",
                        column: x => x.team_id,
                        principalTable: "team",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ac_bill_payments_code",
                table: "ac_bill_payments",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_bill_payments_cost_type_id",
                table: "ac_bill_payments",
                column: "cost_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_ac_charts_code",
                table: "ac_charts",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_charts_description",
                table: "ac_charts",
                column: "description",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_charts_name",
                table: "ac_charts",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_charts_nature_no",
                table: "ac_charts",
                column: "nature_no");

            migrationBuilder.CreateIndex(
                name: "IX_ac_charts_parent_no",
                table: "ac_charts",
                column: "parent_no");

            migrationBuilder.CreateIndex(
                name: "IX_ac_collections_transaction_id",
                table: "ac_collections",
                column: "transaction_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_voucher_details_ac_chart_id",
                table: "ac_voucher_details",
                column: "ac_chart_id");

            migrationBuilder.CreateIndex(
                name: "IX_ac_voucher_details_voucher_id",
                table: "ac_voucher_details",
                column: "voucher_id");

            migrationBuilder.CreateIndex(
                name: "IX_ac_voucher_types_name",
                table: "ac_voucher_types",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_vouchers_code",
                table: "ac_vouchers",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ac_vouchers_collection_id",
                table: "ac_vouchers",
                column: "collection_id",
                unique: true,
                filter: "[collection_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ac_vouchers_payment_id",
                table: "ac_vouchers",
                column: "payment_id",
                unique: true,
                filter: "[payment_id] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ac_vouchers_posted_by",
                table: "ac_vouchers",
                column: "posted_by");

            migrationBuilder.CreateIndex(
                name: "IX_ac_vouchers_voucher_type_id",
                table: "ac_vouchers",
                column: "voucher_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_advancement_rule_source_group_id",
                table: "advancement_rule",
                column: "source_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_advancement_rule_source_round_id",
                table: "advancement_rule",
                column: "source_round_id");

            migrationBuilder.CreateIndex(
                name: "IX_advancement_rule_target_group_id",
                table: "advancement_rule",
                column: "target_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_advancement_rule_target_round_id",
                table: "advancement_rule",
                column: "target_round_id");

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
                name: "IX_auction_bids_team_id",
                table: "auction_bids",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_bids_tournament_id",
                table: "auction_bids",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_player_registrations_approved_by",
                table: "auction_player_registrations",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "IX_auction_player_registrations_created_player_id",
                table: "auction_player_registrations",
                column: "created_player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_player_registrations_tournament_id",
                table: "auction_player_registrations",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_current_highest_team_id",
                table: "auction_players",
                column: "current_highest_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_player_id",
                table: "auction_players",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_sold_to_team_id",
                table: "auction_players",
                column: "sold_to_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_players_tournament_id_player_id",
                table: "auction_players",
                columns: new[] { "tournament_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_auction_sessions_current_auction_player_id",
                table: "auction_sessions",
                column: "current_auction_player_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_sessions_tournament_id",
                table: "auction_sessions",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_auction_settings_tournament_id",
                table: "auction_settings",
                column: "tournament_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_collection_players_player_id",
                table: "collection_players",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_cost_types_chart_id",
                table: "cost_types",
                column: "chart_id");

            migrationBuilder.CreateIndex(
                name: "IX_cost_types_name",
                table: "cost_types",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_group_standing_group_id",
                table: "group_standing",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "IX_group_standing_team_id",
                table: "group_standing",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_logic_node_source_group_id",
                table: "logic_node",
                column: "source_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_logic_node_source_round_id",
                table: "logic_node",
                column: "source_round_id");

            migrationBuilder.CreateIndex(
                name: "IX_logic_node_target_round_id",
                table: "logic_node",
                column: "target_round_id");

            migrationBuilder.CreateIndex(
                name: "IX_logic_node_tournament_id",
                table: "logic_node",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_away_team_id",
                table: "match",
                column: "away_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_group_id",
                table: "match",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_home_team_id",
                table: "match",
                column: "home_team_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_round_id",
                table: "match",
                column: "round_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_tournament_id",
                table: "match",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_venue_id",
                table: "match",
                column: "venue_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_event_match_id",
                table: "match_event",
                column: "match_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_event_player_id",
                table: "match_event",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_event_related_player_id",
                table: "match_event",
                column: "related_player_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_event_team_id",
                table: "match_event",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_statistics_match_id",
                table: "match_statistics",
                column: "match_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_statistics_player_id",
                table: "match_statistics",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_match_statistics_team_id",
                table: "match_statistics",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_monthly_cost_cost_type_id",
                table: "monthly_cost",
                column: "cost_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_player_goalkeeping_history_player_id",
                table: "player_goalkeeping_history",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_player_goalkeeping_history_tournament_id",
                table: "player_goalkeeping_history",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_players_email",
                table: "players",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_players_email_employee_id",
                table: "players",
                columns: new[] { "email", "employee_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_players_employee_id",
                table: "players",
                column: "employee_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_players_skype_id",
                table: "players",
                column: "skype_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_players_roles_role_id",
                table: "players_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_roles_name",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_round_group_parent_group_id",
                table: "round_group",
                column: "parent_group_id");

            migrationBuilder.CreateIndex(
                name: "IX_round_group_round_id",
                table: "round_group",
                column: "round_id");

            migrationBuilder.CreateIndex(
                name: "IX_round_group_team_group_id",
                table: "round_group_team",
                column: "group_id");

            migrationBuilder.CreateIndex(
                name: "IX_round_group_team_team_id",
                table: "round_group_team",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_round_team_round_id",
                table: "round_team",
                column: "round_id");

            migrationBuilder.CreateIndex(
                name: "IX_round_team_team_id",
                table: "round_team",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_tournament_id",
                table: "team",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_budgets_owner_id",
                table: "team_budgets",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_budgets_team_id",
                table: "team_budgets",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_budgets_tournament_id_team_id",
                table: "team_budgets",
                columns: new[] { "tournament_id", "team_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_player_player_id",
                table: "team_player",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_player_team_id",
                table: "team_player",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_tournament_venue_id",
                table: "tournament",
                column: "venue_id");

            migrationBuilder.CreateIndex(
                name: "IX_tournament_participant_player_id",
                table: "tournament_participant",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_tournament_participant_tournament_id_player_id",
                table: "tournament_participant",
                columns: new[] { "tournament_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tournament_prize_player_id",
                table: "tournament_prize",
                column: "player_id");

            migrationBuilder.CreateIndex(
                name: "IX_tournament_prize_team_id",
                table: "tournament_prize",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "IX_tournament_prize_tournament_id",
                table: "tournament_prize",
                column: "tournament_id");

            migrationBuilder.CreateIndex(
                name: "IX_tournament_round_tournament_id",
                table: "tournament_round",
                column: "tournament_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ac_voucher_details");

            migrationBuilder.DropTable(
                name: "advancement_rule");

            migrationBuilder.DropTable(
                name: "auction_bids");

            migrationBuilder.DropTable(
                name: "auction_player_registrations");

            migrationBuilder.DropTable(
                name: "auction_settings");

            migrationBuilder.DropTable(
                name: "club_rule");

            migrationBuilder.DropTable(
                name: "collection_players");

            migrationBuilder.DropTable(
                name: "group_standing");

            migrationBuilder.DropTable(
                name: "logic_node");

            migrationBuilder.DropTable(
                name: "match_event");

            migrationBuilder.DropTable(
                name: "match_statistics");

            migrationBuilder.DropTable(
                name: "monthly_cost");

            migrationBuilder.DropTable(
                name: "payment_accounts");

            migrationBuilder.DropTable(
                name: "player_goalkeeping_history");

            migrationBuilder.DropTable(
                name: "players_roles");

            migrationBuilder.DropTable(
                name: "round_group_team");

            migrationBuilder.DropTable(
                name: "round_team");

            migrationBuilder.DropTable(
                name: "team_budgets");

            migrationBuilder.DropTable(
                name: "team_player");

            migrationBuilder.DropTable(
                name: "tournament_participant");

            migrationBuilder.DropTable(
                name: "tournament_participant_players");

            migrationBuilder.DropTable(
                name: "tournament_prize");

            migrationBuilder.DropTable(
                name: "ac_vouchers");

            migrationBuilder.DropTable(
                name: "auction_sessions");

            migrationBuilder.DropTable(
                name: "match");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "ac_bill_payments");

            migrationBuilder.DropTable(
                name: "ac_collections");

            migrationBuilder.DropTable(
                name: "ac_voucher_types");

            migrationBuilder.DropTable(
                name: "auction_players");

            migrationBuilder.DropTable(
                name: "round_group");

            migrationBuilder.DropTable(
                name: "cost_types");

            migrationBuilder.DropTable(
                name: "players");

            migrationBuilder.DropTable(
                name: "team");

            migrationBuilder.DropTable(
                name: "tournament_round");

            migrationBuilder.DropTable(
                name: "ac_charts");

            migrationBuilder.DropTable(
                name: "tournament");

            migrationBuilder.DropTable(
                name: "ac_natures");

            migrationBuilder.DropTable(
                name: "venues");
        }
    }
}
