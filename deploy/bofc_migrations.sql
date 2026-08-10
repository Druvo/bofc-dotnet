IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_collections] (
        [id] bigint NOT NULL IDENTITY,
        [transaction_id] nvarchar(30) NOT NULL,
        [amount] decimal(18,2) NOT NULL,
        [total_amount] decimal(18,2) NOT NULL,
        [month_of_payment] date NOT NULL,
        [description] nvarchar(max) NULL,
        [date] date NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_collections] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_natures] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(20) NOT NULL,
        [code] int NOT NULL,
        [description] nvarchar(500) NULL,
        [type] nvarchar(15) NOT NULL,
        [sl_no] int NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_natures] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_voucher_types] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(30) NOT NULL,
        [alias] nvarchar(2) NOT NULL,
        [ac_transaction_type] nvarchar(max) NOT NULL,
        [description] nvarchar(max) NULL,
        [is_default] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_voucher_types] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [club_rule] (
        [id] bigint NOT NULL IDENTITY,
        [description] nvarchar(max) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_club_rule] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [payment_accounts] (
        [id] bigint NOT NULL IDENTITY,
        [account_type] nvarchar(max) NOT NULL,
        [account_name] nvarchar(150) NOT NULL,
        [account_number] nvarchar(50) NOT NULL,
        [bank_name] nvarchar(100) NULL,
        [branch] nvarchar(100) NULL,
        [note] nvarchar(255) NULL,
        [display_order] int NOT NULL,
        [is_active] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_payment_accounts] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [players] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(max) NOT NULL,
        [email] nvarchar(450) NOT NULL,
        [employee_id] nvarchar(450) NOT NULL,
        [skype_id] nvarchar(450) NOT NULL,
        [mobile_no] nvarchar(max) NULL,
        [is_active] bit NOT NULL,
        [playing_position] nvarchar(max) NOT NULL,
        [password] nvarchar(max) NOT NULL,
        [last_password_change_date] datetime2 NULL,
        [profile_photo] nvarchar(500) NULL,
        [photo_key] nvarchar(max) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_players] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [roles] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_roles] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [tournament_participant_players] (
        [tournament_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [tournament_name] nvarchar(max) NULL,
        [tournament_date] datetime2 NULL,
        [player_name] nvarchar(max) NULL,
        [player_employee_id] nvarchar(max) NULL,
        [photo_key] nvarchar(max) NULL,
        [comments] nvarchar(max) NULL,
        [participation_status] bit NULL,
        [tournament_participant_id] bigint NULL,
        CONSTRAINT [PK_tournament_participant_players] PRIMARY KEY ([tournament_id], [player_id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [venues] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(100) NOT NULL,
        [address] nvarchar(255) NOT NULL,
        [is_active] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_venues] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_charts] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(250) NOT NULL,
        [code] nvarchar(50) NOT NULL,
        [description] nvarchar(250) NOT NULL,
        [parent_no] bigint NULL,
        [nature_no] bigint NOT NULL,
        [is_active] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_charts] PRIMARY KEY ([id]),
        CONSTRAINT [FK_ac_charts_ac_charts_parent_no] FOREIGN KEY ([parent_no]) REFERENCES [ac_charts] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ac_charts_ac_natures_nature_no] FOREIGN KEY ([nature_no]) REFERENCES [ac_natures] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [collection_players] (
        [collection_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        CONSTRAINT [PK_collection_players] PRIMARY KEY ([collection_id], [player_id]),
        CONSTRAINT [FK_collection_players_ac_collections_collection_id] FOREIGN KEY ([collection_id]) REFERENCES [ac_collections] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_collection_players_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [players_roles] (
        [player_id] bigint NOT NULL,
        [role_id] bigint NOT NULL,
        CONSTRAINT [PK_players_roles] PRIMARY KEY ([player_id], [role_id]),
        CONSTRAINT [FK_players_roles_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_players_roles_roles_role_id] FOREIGN KEY ([role_id]) REFERENCES [roles] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [tournament] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(max) NOT NULL,
        [title] nvarchar(max) NULL,
        [season] nvarchar(max) NULL,
        [description] NVARCHAR(MAX) NULL,
        [rules] NVARCHAR(MAX) NULL,
        [roadmap_image_url] nvarchar(500) NULL,
        [tournament_date] datetime2 NOT NULL,
        [venue_id] bigint NOT NULL,
        [tournament_status] nvarchar(max) NOT NULL,
        [is_active] bit NOT NULL,
        [is_default] bit NOT NULL,
        [sport_type] nvarchar(max) NOT NULL,
        [tournament_type] nvarchar(max) NOT NULL,
        [group_count] int NULL,
        [auction_mode] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_tournament] PRIMARY KEY ([id]),
        CONSTRAINT [fk_tournament_venue] FOREIGN KEY ([venue_id]) REFERENCES [venues] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [cost_types] (
        [id] bigint NOT NULL IDENTITY,
        [name] nvarchar(450) NOT NULL,
        [description] nvarchar(max) NULL,
        [is_active] bit NOT NULL,
        [chart_id] bigint NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_cost_types] PRIMARY KEY ([id]),
        CONSTRAINT [FK_cost_types_ac_charts_chart_id] FOREIGN KEY ([chart_id]) REFERENCES [ac_charts] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [auction_player_registrations] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [name] nvarchar(max) NOT NULL,
        [email] nvarchar(max) NOT NULL,
        [employee_id] nvarchar(max) NOT NULL,
        [skype_id] nvarchar(max) NULL,
        [mobile_no] nvarchar(max) NULL,
        [playing_position] nvarchar(max) NOT NULL,
        [batting_style] nvarchar(max) NULL,
        [bowling_style] nvarchar(max) NULL,
        [previous_experience] NVARCHAR(MAX) NULL,
        [availability_status] nvarchar(max) NOT NULL,
        [profile_photo] nvarchar(max) NULL,
        [emergency_contact] nvarchar(max) NULL,
        [preferred_base_price] int NULL,
        [approval_status] nvarchar(max) NOT NULL,
        [approved_by] bigint NULL,
        [approved_at] datetime2 NULL,
        [rejection_reason] nvarchar(max) NULL,
        [created_player_id] bigint NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_auction_player_registrations] PRIMARY KEY ([id]),
        CONSTRAINT [FK_auction_player_registrations_players_approved_by] FOREIGN KEY ([approved_by]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_player_registrations_players_created_player_id] FOREIGN KEY ([created_player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_player_registrations_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [auction_settings] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [team_budget] int NOT NULL,
        [min_squad_size] int NOT NULL,
        [max_squad_size] int NOT NULL,
        [auction_timer_seconds] int NOT NULL,
        [bid_increment] int NOT NULL,
        [unsold_reauction_enabled] bit NOT NULL,
        [timer_extension_seconds] int NOT NULL,
        [extend_if_bid_within_last_seconds] int NOT NULL,
        [min_role_requirements] NVARCHAR(MAX) NULL,
        [auction_status] nvarchar(max) NOT NULL,
        [scheduled_start_time] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_auction_settings] PRIMARY KEY ([id]),
        CONSTRAINT [FK_auction_settings_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [player_goalkeeping_history] (
        [id] bigint NOT NULL IDENTITY,
        [player_id] bigint NOT NULL,
        [tournament_id] bigint NOT NULL,
        [round_number] int NOT NULL,
        [played_date] datetime2 NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_player_goalkeeping_history] PRIMARY KEY ([id]),
        CONSTRAINT [FK_player_goalkeeping_history_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_player_goalkeeping_history_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [team] (
        [id] bigint NOT NULL IDENTITY,
        [team_name] nvarchar(max) NOT NULL,
        [logo_key] nvarchar(max) NULL,
        [tournament_id] bigint NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_team] PRIMARY KEY ([id]),
        CONSTRAINT [FK_team_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [tournament_participant] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [participation_status] bit NOT NULL,
        [comments] nvarchar(max) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_tournament_participant] PRIMARY KEY ([id]),
        CONSTRAINT [FK_tournament_participant_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_tournament_participant_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [tournament_round] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [round_number] int NOT NULL,
        [round_name] nvarchar(100) NOT NULL,
        [round_type] nvarchar(50) NOT NULL,
        [advancement_rule] NVARCHAR(MAX) NULL,
        [status] nvarchar(20) NOT NULL,
        [sequence_order] int NOT NULL,
        [start_date] datetime2 NULL,
        [end_date] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_tournament_round] PRIMARY KEY ([id]),
        CONSTRAINT [FK_tournament_round_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_bill_payments] (
        [id] bigint NOT NULL IDENTITY,
        [code] nvarchar(30) NOT NULL,
        [amount] decimal(18,2) NOT NULL,
        [payment_date] date NOT NULL,
        [description] nvarchar(500) NULL,
        [cost_type_id] bigint NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_bill_payments] PRIMARY KEY ([id]),
        CONSTRAINT [FK_ac_bill_payments_cost_types_cost_type_id] FOREIGN KEY ([cost_type_id]) REFERENCES [cost_types] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [monthly_cost] (
        [id] bigint NOT NULL IDENTITY,
        [cost_type_id] bigint NOT NULL,
        [amount] float NOT NULL,
        [month_of_cost] date NOT NULL,
        [description] nvarchar(max) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_monthly_cost] PRIMARY KEY ([id]),
        CONSTRAINT [FK_monthly_cost_cost_types_cost_type_id] FOREIGN KEY ([cost_type_id]) REFERENCES [cost_types] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [auction_players] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [player_type] nvarchar(max) NOT NULL,
        [category] nvarchar(max) NULL,
        [base_price] int NOT NULL,
        [current_bid] int NULL,
        [current_highest_team_id] bigint NULL,
        [sold_to_team_id] bigint NULL,
        [final_price] int NULL,
        [status] nvarchar(max) NOT NULL,
        [auction_round] int NOT NULL,
        [player_rating] decimal(4,2) NULL,
        [sequence_order] int NULL,
        [version] int NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_auction_players] PRIMARY KEY ([id]),
        CONSTRAINT [FK_auction_players_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_players_team_current_highest_team_id] FOREIGN KEY ([current_highest_team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_players_team_sold_to_team_id] FOREIGN KEY ([sold_to_team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_players_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [team_budgets] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [team_id] bigint NOT NULL,
        [owner_id] bigint NOT NULL,
        [total_budget] int NOT NULL,
        [remaining_budget] int NOT NULL,
        [total_spent] int NOT NULL,
        [players_bought] int NOT NULL,
        [version] int NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_team_budgets] PRIMARY KEY ([id]),
        CONSTRAINT [FK_team_budgets_players_owner_id] FOREIGN KEY ([owner_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_team_budgets_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_team_budgets_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [team_player] (
        [id] bigint NOT NULL IDENTITY,
        [team_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [playing_position] nvarchar(max) NOT NULL,
        [team_player_role] nvarchar(max) NOT NULL,
        [is_captain] bit NOT NULL,
        [jersey_number] int NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_team_player] PRIMARY KEY ([id]),
        CONSTRAINT [FK_team_player_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_team_player_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [tournament_prize] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [prize_type] nvarchar(20) NOT NULL,
        [team_id] bigint NULL,
        [player_id] bigint NULL,
        [position_rank] int NOT NULL,
        [prize_amount] decimal(10,2) NULL,
        [prize_category] nvarchar(50) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [image_links] NVARCHAR(MAX) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_tournament_prize] PRIMARY KEY ([id]),
        CONSTRAINT [FK_tournament_prize_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_tournament_prize_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_tournament_prize_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [round_group] (
        [id] bigint NOT NULL IDENTITY,
        [round_id] bigint NOT NULL,
        [parent_group_id] bigint NULL,
        [group_name] nvarchar(100) NOT NULL,
        [group_format] nvarchar(50) NULL,
        [advancement_rule] NVARCHAR(MAX) NULL,
        [max_teams] int NULL,
        [status] nvarchar(20) NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_round_group] PRIMARY KEY ([id]),
        CONSTRAINT [FK_round_group_round_group_parent_group_id] FOREIGN KEY ([parent_group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_round_group_tournament_round_round_id] FOREIGN KEY ([round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [round_team] (
        [id] bigint NOT NULL IDENTITY,
        [round_id] bigint NOT NULL,
        [team_id] bigint NULL,
        [assignment_type] nvarchar(50) NOT NULL,
        [source_rule] NVARCHAR(MAX) NULL,
        [is_placeholder] bit NOT NULL,
        [placeholder_name] nvarchar(255) NULL,
        [seed_position] int NULL,
        [assigned_at] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_round_team] PRIMARY KEY ([id]),
        CONSTRAINT [FK_round_team_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_round_team_tournament_round_round_id] FOREIGN KEY ([round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_vouchers] (
        [id] bigint NOT NULL IDENTITY,
        [code] nvarchar(20) NOT NULL,
        [narration] nvarchar(500) NULL,
        [voucher_date] date NOT NULL,
        [amount] decimal(18,2) NOT NULL,
        [post_flag] bit NOT NULL,
        [posted_by] bigint NULL,
        [post_date] date NULL,
        [voucher_type_id] bigint NOT NULL,
        [collection_id] bigint NULL,
        [payment_id] bigint NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_vouchers] PRIMARY KEY ([id]),
        CONSTRAINT [FK_ac_vouchers_ac_bill_payments_payment_id] FOREIGN KEY ([payment_id]) REFERENCES [ac_bill_payments] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ac_vouchers_ac_collections_collection_id] FOREIGN KEY ([collection_id]) REFERENCES [ac_collections] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ac_vouchers_ac_voucher_types_voucher_type_id] FOREIGN KEY ([voucher_type_id]) REFERENCES [ac_voucher_types] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ac_vouchers_players_posted_by] FOREIGN KEY ([posted_by]) REFERENCES [players] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [auction_sessions] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [status] nvarchar(max) NOT NULL,
        [current_auction_player_id] bigint NULL,
        [round_number] int NOT NULL,
        [started_at] datetime2 NULL,
        [paused_at] datetime2 NULL,
        [completed_at] datetime2 NULL,
        [current_timer_ends_at] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_auction_sessions] PRIMARY KEY ([id]),
        CONSTRAINT [FK_auction_sessions_auction_players_current_auction_player_id] FOREIGN KEY ([current_auction_player_id]) REFERENCES [auction_players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_sessions_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [advancement_rule] (
        [id] bigint NOT NULL IDENTITY,
        [source_round_id] bigint NOT NULL,
        [source_group_id] bigint NULL,
        [target_round_id] bigint NOT NULL,
        [target_group_id] bigint NULL,
        [rule_type] nvarchar(50) NOT NULL,
        [rule_config] NVARCHAR(MAX) NOT NULL,
        [priority_order] int NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_advancement_rule] PRIMARY KEY ([id]),
        CONSTRAINT [FK_advancement_rule_round_group_source_group_id] FOREIGN KEY ([source_group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_advancement_rule_round_group_target_group_id] FOREIGN KEY ([target_group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_advancement_rule_tournament_round_source_round_id] FOREIGN KEY ([source_round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_advancement_rule_tournament_round_target_round_id] FOREIGN KEY ([target_round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [group_standing] (
        [id] bigint NOT NULL IDENTITY,
        [group_id] bigint NOT NULL,
        [team_id] bigint NOT NULL,
        [matches_played] int NOT NULL,
        [wins] int NOT NULL,
        [draws] int NOT NULL,
        [losses] int NOT NULL,
        [goals_for] int NOT NULL,
        [goals_against] int NOT NULL,
        [goal_difference] int NOT NULL,
        [points] int NOT NULL,
        [yellow_cards] int NOT NULL,
        [red_cards] int NOT NULL,
        [fair_play_points] int NOT NULL,
        [tiebreak_rank] int NULL,
        [position] int NULL,
        [is_advanced] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_group_standing] PRIMARY KEY ([id]),
        CONSTRAINT [FK_group_standing_round_group_group_id] FOREIGN KEY ([group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_group_standing_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [logic_node] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [node_name] nvarchar(100) NOT NULL,
        [node_type] nvarchar(50) NOT NULL,
        [source_round_id] bigint NULL,
        [source_group_id] bigint NULL,
        [target_round_id] bigint NOT NULL,
        [rule_config] NVARCHAR(MAX) NULL,
        [priority_order] int NULL,
        [is_active] bit NOT NULL,
        [auto_execute] bit NOT NULL,
        [execution_count] int NOT NULL,
        [last_executed_at] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_logic_node] PRIMARY KEY ([id]),
        CONSTRAINT [FK_logic_node_round_group_source_group_id] FOREIGN KEY ([source_group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_logic_node_tournament_round_source_round_id] FOREIGN KEY ([source_round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_logic_node_tournament_round_target_round_id] FOREIGN KEY ([target_round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_logic_node_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [match] (
        [id] bigint NOT NULL IDENTITY,
        [tournament_id] bigint NOT NULL,
        [round_id] bigint NULL,
        [group_id] bigint NULL,
        [home_team_id] bigint NOT NULL,
        [away_team_id] bigint NOT NULL,
        [venue_id] bigint NULL,
        [match_date] datetime2 NOT NULL,
        [match_status] nvarchar(max) NOT NULL,
        [match_order] int NULL,
        [round] int NULL,
        [group_name] nvarchar(max) NULL,
        [is_placeholder_match] bit NOT NULL,
        [match_type] nvarchar(50) NULL,
        [series_number] int NULL,
        [bracket_position] nvarchar(50) NULL,
        [home_team_score] int NOT NULL,
        [away_team_score] int NOT NULL,
        [match_duration_minutes] int NULL,
        [elapsed_time_seconds] int NOT NULL,
        [started_at] datetime2 NULL,
        [completed_at] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_match] PRIMARY KEY ([id]),
        CONSTRAINT [FK_match_round_group_group_id] FOREIGN KEY ([group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_team_away_team_id] FOREIGN KEY ([away_team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_team_home_team_id] FOREIGN KEY ([home_team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_tournament_round_round_id] FOREIGN KEY ([round_id]) REFERENCES [tournament_round] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_venues_venue_id] FOREIGN KEY ([venue_id]) REFERENCES [venues] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [round_group_team] (
        [id] bigint NOT NULL IDENTITY,
        [group_id] bigint NOT NULL,
        [team_id] bigint NULL,
        [assignment_type] nvarchar(50) NOT NULL,
        [source_rule] NVARCHAR(MAX) NULL,
        [is_placeholder] bit NOT NULL,
        [placeholder_name] nvarchar(255) NULL,
        [assigned_at] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_round_group_team] PRIMARY KEY ([id]),
        CONSTRAINT [FK_round_group_team_round_group_group_id] FOREIGN KEY ([group_id]) REFERENCES [round_group] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_round_group_team_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [ac_voucher_details] (
        [id] bigint NOT NULL IDENTITY,
        [narration] nvarchar(max) NULL,
        [dr] decimal(19,2) NULL,
        [cr] decimal(19,2) NULL,
        [ac_chart_id] bigint NOT NULL,
        [voucher_id] bigint NOT NULL,
        [reference_no] nvarchar(100) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_ac_voucher_details] PRIMARY KEY ([id]),
        CONSTRAINT [FK_ac_voucher_details_ac_charts_ac_chart_id] FOREIGN KEY ([ac_chart_id]) REFERENCES [ac_charts] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ac_voucher_details_ac_vouchers_voucher_id] FOREIGN KEY ([voucher_id]) REFERENCES [ac_vouchers] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [auction_bids] (
        [id] bigint NOT NULL IDENTITY,
        [auction_session_id] bigint NOT NULL,
        [tournament_id] bigint NOT NULL,
        [auction_player_id] bigint NOT NULL,
        [team_id] bigint NOT NULL,
        [bidder_user_id] bigint NOT NULL,
        [bid_amount] int NOT NULL,
        [bid_time] datetime2 NOT NULL,
        [is_winning] bit NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_auction_bids] PRIMARY KEY ([id]),
        CONSTRAINT [FK_auction_bids_auction_players_auction_player_id] FOREIGN KEY ([auction_player_id]) REFERENCES [auction_players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_bids_auction_sessions_auction_session_id] FOREIGN KEY ([auction_session_id]) REFERENCES [auction_sessions] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_bids_players_bidder_user_id] FOREIGN KEY ([bidder_user_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_bids_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_auction_bids_tournament_tournament_id] FOREIGN KEY ([tournament_id]) REFERENCES [tournament] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [match_event] (
        [id] bigint NOT NULL IDENTITY,
        [match_id] bigint NOT NULL,
        [event_type] nvarchar(max) NOT NULL,
        [player_id] bigint NULL,
        [team_id] bigint NULL,
        [event_time] int NOT NULL,
        [description] nvarchar(max) NULL,
        [related_player_id] bigint NULL,
        [details] NVARCHAR(MAX) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_match_event] PRIMARY KEY ([id]),
        CONSTRAINT [FK_match_event_match_match_id] FOREIGN KEY ([match_id]) REFERENCES [match] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_match_event_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_event_players_related_player_id] FOREIGN KEY ([related_player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_event_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE TABLE [match_statistics] (
        [id] bigint NOT NULL IDENTITY,
        [match_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [team_id] bigint NOT NULL,
        [goals_scored] int NOT NULL,
        [assists] int NOT NULL,
        [red_cards] int NOT NULL,
        [yellow_cards] int NOT NULL,
        [substitution_in] int NOT NULL,
        [substitution_out] int NOT NULL,
        [minutes_played] int NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_match_statistics] PRIMARY KEY ([id]),
        CONSTRAINT [FK_match_statistics_match_match_id] FOREIGN KEY ([match_id]) REFERENCES [match] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_match_statistics_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_match_statistics_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_bill_payments_code] ON [ac_bill_payments] ([code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_bill_payments_cost_type_id] ON [ac_bill_payments] ([cost_type_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_charts_code] ON [ac_charts] ([code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_charts_description] ON [ac_charts] ([description]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_charts_name] ON [ac_charts] ([name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_charts_nature_no] ON [ac_charts] ([nature_no]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_charts_parent_no] ON [ac_charts] ([parent_no]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_collections_transaction_id] ON [ac_collections] ([transaction_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_voucher_details_ac_chart_id] ON [ac_voucher_details] ([ac_chart_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_voucher_details_voucher_id] ON [ac_voucher_details] ([voucher_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_voucher_types_name] ON [ac_voucher_types] ([name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ac_vouchers_code] ON [ac_vouchers] ([code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ac_vouchers_collection_id] ON [ac_vouchers] ([collection_id]) WHERE [collection_id] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_ac_vouchers_payment_id] ON [ac_vouchers] ([payment_id]) WHERE [payment_id] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_vouchers_posted_by] ON [ac_vouchers] ([posted_by]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ac_vouchers_voucher_type_id] ON [ac_vouchers] ([voucher_type_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_advancement_rule_source_group_id] ON [advancement_rule] ([source_group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_advancement_rule_source_round_id] ON [advancement_rule] ([source_round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_advancement_rule_target_group_id] ON [advancement_rule] ([target_group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_advancement_rule_target_round_id] ON [advancement_rule] ([target_round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_bids_auction_player_id] ON [auction_bids] ([auction_player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_bids_auction_session_id] ON [auction_bids] ([auction_session_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_bids_bidder_user_id] ON [auction_bids] ([bidder_user_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_bids_team_id] ON [auction_bids] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_bids_tournament_id] ON [auction_bids] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_player_registrations_approved_by] ON [auction_player_registrations] ([approved_by]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_player_registrations_created_player_id] ON [auction_player_registrations] ([created_player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_player_registrations_tournament_id] ON [auction_player_registrations] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_players_current_highest_team_id] ON [auction_players] ([current_highest_team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_players_player_id] ON [auction_players] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_players_sold_to_team_id] ON [auction_players] ([sold_to_team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_auction_players_tournament_id_player_id] ON [auction_players] ([tournament_id], [player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_sessions_current_auction_player_id] ON [auction_sessions] ([current_auction_player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_auction_sessions_tournament_id] ON [auction_sessions] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_auction_settings_tournament_id] ON [auction_settings] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_collection_players_player_id] ON [collection_players] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_cost_types_chart_id] ON [cost_types] ([chart_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_cost_types_name] ON [cost_types] ([name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_group_standing_group_id] ON [group_standing] ([group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_group_standing_team_id] ON [group_standing] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_logic_node_source_group_id] ON [logic_node] ([source_group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_logic_node_source_round_id] ON [logic_node] ([source_round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_logic_node_target_round_id] ON [logic_node] ([target_round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_logic_node_tournament_id] ON [logic_node] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_away_team_id] ON [match] ([away_team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_group_id] ON [match] ([group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_home_team_id] ON [match] ([home_team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_round_id] ON [match] ([round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_tournament_id] ON [match] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_venue_id] ON [match] ([venue_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_event_match_id] ON [match_event] ([match_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_event_player_id] ON [match_event] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_event_related_player_id] ON [match_event] ([related_player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_event_team_id] ON [match_event] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_statistics_match_id] ON [match_statistics] ([match_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_statistics_player_id] ON [match_statistics] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_match_statistics_team_id] ON [match_statistics] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_monthly_cost_cost_type_id] ON [monthly_cost] ([cost_type_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_player_goalkeeping_history_player_id] ON [player_goalkeeping_history] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_player_goalkeeping_history_tournament_id] ON [player_goalkeeping_history] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_players_email] ON [players] ([email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_players_email_employee_id] ON [players] ([email], [employee_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_players_employee_id] ON [players] ([employee_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_players_skype_id] ON [players] ([skype_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_players_roles_role_id] ON [players_roles] ([role_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_roles_name] ON [roles] ([name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_round_group_parent_group_id] ON [round_group] ([parent_group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_round_group_round_id] ON [round_group] ([round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_round_group_team_group_id] ON [round_group_team] ([group_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_round_group_team_team_id] ON [round_group_team] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_round_team_round_id] ON [round_team] ([round_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_round_team_team_id] ON [round_team] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_team_tournament_id] ON [team] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_team_budgets_owner_id] ON [team_budgets] ([owner_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_team_budgets_team_id] ON [team_budgets] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_team_budgets_tournament_id_team_id] ON [team_budgets] ([tournament_id], [team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_team_player_player_id] ON [team_player] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_team_player_team_id] ON [team_player] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tournament_venue_id] ON [tournament] ([venue_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tournament_participant_player_id] ON [tournament_participant] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_tournament_participant_tournament_id_player_id] ON [tournament_participant] ([tournament_id], [player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tournament_prize_player_id] ON [tournament_prize] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tournament_prize_team_id] ON [tournament_prize] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tournament_prize_tournament_id] ON [tournament_prize] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_tournament_round_tournament_id] ON [tournament_round] ([tournament_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730180802_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260730180802_InitialCreate', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730182822_RenameSkypeIdToTeamsId'
)
BEGIN
    EXEC sp_rename N'[players].[skype_id]', N'teams_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730182822_RenameSkypeIdToTeamsId'
)
BEGIN
    EXEC sp_rename N'[players].[IX_players_skype_id]', N'IX_players_teams_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730182822_RenameSkypeIdToTeamsId'
)
BEGIN
    EXEC sp_rename N'[auction_player_registrations].[skype_id]', N'teams_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730182822_RenameSkypeIdToTeamsId'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260730182822_RenameSkypeIdToTeamsId', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    ALTER TABLE [ac_collections] ADD [payment_account_id] bigint NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    ALTER TABLE [ac_bill_payments] ADD [payment_account_id] bigint NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    CREATE INDEX [IX_ac_collections_payment_account_id] ON [ac_collections] ([payment_account_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    CREATE INDEX [IX_ac_bill_payments_payment_account_id] ON [ac_bill_payments] ([payment_account_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    ALTER TABLE [ac_bill_payments] ADD CONSTRAINT [FK_ac_bill_payments_payment_accounts_payment_account_id] FOREIGN KEY ([payment_account_id]) REFERENCES [payment_accounts] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    ALTER TABLE [ac_collections] ADD CONSTRAINT [FK_ac_collections_payment_accounts_payment_account_id] FOREIGN KEY ([payment_account_id]) REFERENCES [payment_accounts] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260801190121_AddPaymentAccountToCollectionsAndBillPayments', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802040838_AddJerseyNumberToPlayer'
)
BEGIN
    ALTER TABLE [players] ADD [jersey_number] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802040838_AddJerseyNumberToPlayer'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260802040838_AddJerseyNumberToPlayer', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802072149_AddMapLinkToVenue'
)
BEGIN
    ALTER TABLE [venues] ADD [map_link] nvarchar(500) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802072149_AddMapLinkToVenue'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260802072149_AddMapLinkToVenue', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    CREATE TABLE [notifications] (
        [id] bigint NOT NULL IDENTITY,
        [title] nvarchar(150) NOT NULL,
        [body] nvarchar(1000) NOT NULL,
        [target_type] nvarchar(max) NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_notifications] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    CREATE TABLE [push_subscriptions] (
        [id] bigint NOT NULL IDENTITY,
        [player_id] bigint NOT NULL,
        [endpoint] nvarchar(1000) NOT NULL,
        [p256dh] nvarchar(200) NOT NULL,
        [auth] nvarchar(100) NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_push_subscriptions] PRIMARY KEY ([id]),
        CONSTRAINT [FK_push_subscriptions_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    CREATE TABLE [notification_recipients] (
        [id] bigint NOT NULL IDENTITY,
        [notification_id] bigint NOT NULL,
        [recipient_id] bigint NOT NULL,
        [is_read] bit NOT NULL,
        [read_date] datetime2 NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_notification_recipients] PRIMARY KEY ([id]),
        CONSTRAINT [FK_notification_recipients_notifications_notification_id] FOREIGN KEY ([notification_id]) REFERENCES [notifications] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_notification_recipients_players_recipient_id] FOREIGN KEY ([recipient_id]) REFERENCES [players] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_notification_recipients_notification_id] ON [notification_recipients] ([notification_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_notification_recipients_recipient_id_notification_id] ON [notification_recipients] ([recipient_id], [notification_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    CREATE INDEX [IX_push_subscriptions_player_id] ON [push_subscriptions] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802141039_AddNotifications'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260802141039_AddNotifications', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804103159_AddSystemSettingsAndEmailNotifications'
)
BEGIN
    ALTER TABLE [tournament] ADD [reminder_sent_at] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804103159_AddSystemSettingsAndEmailNotifications'
)
BEGIN
    CREATE TABLE [system_settings] (
        [id] bigint NOT NULL,
        [smtp_enabled] bit NOT NULL,
        [smtp_host] nvarchar(250) NULL,
        [smtp_port] int NOT NULL,
        [smtp_username] nvarchar(250) NULL,
        [smtp_password_encrypted] nvarchar(1000) NULL,
        [smtp_from_email] nvarchar(250) NULL,
        [smtp_from_name] nvarchar(150) NULL,
        [smtp_use_ssl] bit NOT NULL,
        [notify_tournament_reminder_enabled] bit NOT NULL,
        [tournament_reminder_days_before] int NOT NULL,
        [notify_payment_due_enabled] bit NOT NULL,
        [payment_due_reminder_day_of_month] int NOT NULL,
        [notify_custom_email_enabled] bit NOT NULL,
        [last_payment_reminder_sent_month] nvarchar(7) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_system_settings] PRIMARY KEY ([id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804103159_AddSystemSettingsAndEmailNotifications'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804103159_AddSystemSettingsAndEmailNotifications', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804105532_AddPlayerThemePreference'
)
BEGIN
    ALTER TABLE [players] ADD [theme_preference] nvarchar(10) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804105532_AddPlayerThemePreference'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804105532_AddPlayerThemePreference', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_day_of_week] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_duration_minutes] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_enabled] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_invite_all_active_players] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_sport_type] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_time] time NOT NULL DEFAULT '00:00:00';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_venue_id] bigint NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE TABLE [weekly_match_invited_players] (
        [id] bigint NOT NULL IDENTITY,
        [player_id] bigint NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_weekly_match_invited_players] PRIMARY KEY ([id]),
        CONSTRAINT [FK_weekly_match_invited_players_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE TABLE [weekly_matches] (
        [id] bigint NOT NULL IDENTITY,
        [match_date] datetime2 NOT NULL,
        [venue_id] bigint NOT NULL,
        [sport_type] nvarchar(max) NOT NULL,
        [duration_minutes] int NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_weekly_matches] PRIMARY KEY ([id]),
        CONSTRAINT [FK_weekly_matches_venues_venue_id] FOREIGN KEY ([venue_id]) REFERENCES [venues] ([id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE TABLE [weekly_match_rsvps] (
        [id] bigint NOT NULL IDENTITY,
        [weekly_match_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [is_going] bit NOT NULL,
        [comments] nvarchar(500) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_weekly_match_rsvps] PRIMARY KEY ([id]),
        CONSTRAINT [FK_weekly_match_rsvps_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_weekly_match_rsvps_weekly_matches_weekly_match_id] FOREIGN KEY ([weekly_match_id]) REFERENCES [weekly_matches] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE INDEX [IX_system_settings_weekly_match_venue_id] ON [system_settings] ([weekly_match_venue_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE UNIQUE INDEX [IX_weekly_match_invited_players_player_id] ON [weekly_match_invited_players] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE INDEX [IX_weekly_match_rsvps_player_id] ON [weekly_match_rsvps] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE UNIQUE INDEX [IX_weekly_match_rsvps_weekly_match_id_player_id] ON [weekly_match_rsvps] ([weekly_match_id], [player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE INDEX [IX_weekly_matches_match_date] ON [weekly_matches] ([match_date]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    CREATE INDEX [IX_weekly_matches_venue_id] ON [weekly_matches] ([venue_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD CONSTRAINT [FK_system_settings_venues_weekly_match_venue_id] FOREIGN KEY ([weekly_match_venue_id]) REFERENCES [venues] ([id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804165305_AddWeeklyMatch'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804165305_AddWeeklyMatch', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804192336_AddAccountingChartCodesToSettings'
)
BEGIN
    ALTER TABLE [system_settings] ADD [cash_chart_code] nvarchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804192336_AddAccountingChartCodesToSettings'
)
BEGIN
    ALTER TABLE [system_settings] ADD [collection_income_chart_code] nvarchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804192336_AddAccountingChartCodesToSettings'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804192336_AddAccountingChartCodesToSettings', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    DROP TABLE [weekly_match_invited_players];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    DROP TABLE [weekly_match_rsvps];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    DROP TABLE [weekly_matches];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[system_settings]') AND [c].[name] = N'weekly_match_invite_all_active_players');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [system_settings] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [system_settings] DROP COLUMN [weekly_match_invite_all_active_players];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    ALTER TABLE [tournament] ADD [is_weekly_match_day] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    ALTER TABLE [team] ADD [jersey_color] nvarchar(30) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_time_gap_minutes] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805023853_MatchDayPivot'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805023853_MatchDayPivot', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805032514_AddPushNotificationsEnabledSetting'
)
BEGIN
    ALTER TABLE [system_settings] ADD [push_notifications_enabled] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805032514_AddPushNotificationsEnabledSetting'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805032514_AddPushNotificationsEnabledSetting', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805074300_AddWeeklyMatchNamePrefix'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_name_prefix] nvarchar(100) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805074300_AddWeeklyMatchNamePrefix'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805074300_AddWeeklyMatchNamePrefix', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805083148_AddAuctionEnabledSetting'
)
BEGIN
    ALTER TABLE [system_settings] ADD [auction_enabled] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805083148_AddAuctionEnabledSetting'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805083148_AddAuctionEnabledSetting', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805140406_MoveJerseyColorToMatch'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[team]') AND [c].[name] = N'jersey_color');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [team] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [team] DROP COLUMN [jersey_color];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805140406_MoveJerseyColorToMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [jersey_color_a] nvarchar(30) NOT NULL DEFAULT N'red';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805140406_MoveJerseyColorToMatch'
)
BEGIN
    ALTER TABLE [system_settings] ADD [jersey_color_b] nvarchar(30) NOT NULL DEFAULT N'yellow';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805140406_MoveJerseyColorToMatch'
)
BEGIN
    ALTER TABLE [match] ADD [away_jersey_color] nvarchar(30) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805140406_MoveJerseyColorToMatch'
)
BEGIN
    ALTER TABLE [match] ADD [home_jersey_color] nvarchar(30) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805140406_MoveJerseyColorToMatch'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805140406_MoveJerseyColorToMatch', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805180616_AddDurationMinutesToTournament'
)
BEGIN
    ALTER TABLE [tournament] ADD [duration_minutes] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805180616_AddDurationMinutesToTournament'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805180616_AddDurationMinutesToTournament', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [advancement_rule] DROP CONSTRAINT [FK_advancement_rule_tournament_round_source_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [advancement_rule] DROP CONSTRAINT [FK_advancement_rule_tournament_round_target_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_bids] DROP CONSTRAINT [FK_auction_bids_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_player_registrations] DROP CONSTRAINT [FK_auction_player_registrations_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_players] DROP CONSTRAINT [FK_auction_players_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_sessions] DROP CONSTRAINT [FK_auction_sessions_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_settings] DROP CONSTRAINT [FK_auction_settings_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [logic_node] DROP CONSTRAINT [FK_logic_node_tournament_round_source_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [logic_node] DROP CONSTRAINT [FK_logic_node_tournament_round_target_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [logic_node] DROP CONSTRAINT [FK_logic_node_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match] DROP CONSTRAINT [FK_match_tournament_round_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match] DROP CONSTRAINT [FK_match_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [player_goalkeeping_history] DROP CONSTRAINT [FK_player_goalkeeping_history_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [round_group] DROP CONSTRAINT [FK_round_group_tournament_round_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [round_team] DROP CONSTRAINT [FK_round_team_tournament_round_round_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [team] DROP CONSTRAINT [FK_team_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [team_budgets] DROP CONSTRAINT [FK_team_budgets_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament] DROP CONSTRAINT [fk_tournament_venue];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament_participant] DROP CONSTRAINT [FK_tournament_participant_players_player_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament_participant] DROP CONSTRAINT [FK_tournament_participant_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament_prize] DROP CONSTRAINT [FK_tournament_prize_players_player_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament_prize] DROP CONSTRAINT [FK_tournament_prize_team_team_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament_prize] DROP CONSTRAINT [FK_tournament_prize_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [tournament_round] DROP CONSTRAINT [FK_tournament_round_tournament_tournament_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    DROP VIEW [tournament_participant_players];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[tournament_participant]', N'match_day_participant';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[tournament_prize]', N'match_day_prize';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[tournament_round]', N'match_day_round';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[tournament]', N'match_day';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day].[tournament_date]', N'match_day_date', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day].[tournament_status]', N'match_day_status', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day].[tournament_type]', N'match_day_type', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_participant].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_prize].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_round].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'dbo.PK_tournament', N'PK_match_day', N'OBJECT';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'dbo.PK_tournament_participant', N'PK_match_day_participant', N'OBJECT';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'dbo.PK_tournament_prize', N'PK_match_day_prize', N'OBJECT';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'dbo.PK_tournament_round', N'PK_match_day_round', N'OBJECT';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day].[IX_tournament_venue_id]', N'IX_match_day_venue_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_participant].[IX_tournament_participant_player_id]', N'IX_match_day_participant_player_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_participant].[IX_tournament_participant_tournament_id_player_id]', N'IX_match_day_participant_match_day_id_player_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_prize].[IX_tournament_prize_player_id]', N'IX_match_day_prize_player_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_prize].[IX_tournament_prize_team_id]', N'IX_match_day_prize_team_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_prize].[IX_tournament_prize_tournament_id]', N'IX_match_day_prize_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match_day_round].[IX_tournament_round_tournament_id]', N'IX_match_day_round_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day] ADD CONSTRAINT [fk_match_day_venue] FOREIGN KEY ([venue_id]) REFERENCES [venues] ([id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day_participant] ADD CONSTRAINT [FK_match_day_participant_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day_participant] ADD CONSTRAINT [FK_match_day_participant_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day_prize] ADD CONSTRAINT [FK_match_day_prize_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day_prize] ADD CONSTRAINT [FK_match_day_prize_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day_prize] ADD CONSTRAINT [FK_match_day_prize_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match_day_round] ADD CONSTRAINT [FK_match_day_round_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[team_budgets].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[team_budgets].[IX_team_budgets_tournament_id_team_id]', N'IX_team_budgets_match_day_id_team_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[team].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[team].[IX_team_tournament_id]', N'IX_team_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[tournament_reminder_days_before]', N'match_day_reminder_days_before', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[notify_tournament_reminder_enabled]', N'notify_match_day_reminder_enabled', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[player_goalkeeping_history].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[player_goalkeeping_history].[IX_player_goalkeeping_history_tournament_id]', N'IX_player_goalkeeping_history_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[match].[IX_match_tournament_id]', N'IX_match_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[logic_node].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[logic_node].[IX_logic_node_tournament_id]', N'IX_logic_node_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_settings].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_settings].[IX_auction_settings_tournament_id]', N'IX_auction_settings_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_sessions].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_sessions].[IX_auction_sessions_tournament_id]', N'IX_auction_sessions_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_players].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_players].[IX_auction_players_tournament_id_player_id]', N'IX_auction_players_match_day_id_player_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_player_registrations].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_player_registrations].[IX_auction_player_registrations_tournament_id]', N'IX_auction_player_registrations_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_bids].[tournament_id]', N'match_day_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    EXEC sp_rename N'[auction_bids].[IX_auction_bids_tournament_id]', N'IX_auction_bids_match_day_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [advancement_rule] ADD CONSTRAINT [FK_advancement_rule_match_day_round_source_round_id] FOREIGN KEY ([source_round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [advancement_rule] ADD CONSTRAINT [FK_advancement_rule_match_day_round_target_round_id] FOREIGN KEY ([target_round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_bids] ADD CONSTRAINT [FK_auction_bids_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_player_registrations] ADD CONSTRAINT [FK_auction_player_registrations_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_players] ADD CONSTRAINT [FK_auction_players_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_sessions] ADD CONSTRAINT [FK_auction_sessions_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [auction_settings] ADD CONSTRAINT [FK_auction_settings_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [logic_node] ADD CONSTRAINT [FK_logic_node_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [logic_node] ADD CONSTRAINT [FK_logic_node_match_day_round_source_round_id] FOREIGN KEY ([source_round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [logic_node] ADD CONSTRAINT [FK_logic_node_match_day_round_target_round_id] FOREIGN KEY ([target_round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match] ADD CONSTRAINT [FK_match_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [match] ADD CONSTRAINT [FK_match_match_day_round_round_id] FOREIGN KEY ([round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [player_goalkeeping_history] ADD CONSTRAINT [FK_player_goalkeeping_history_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [round_group] ADD CONSTRAINT [FK_round_group_match_day_round_round_id] FOREIGN KEY ([round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [round_team] ADD CONSTRAINT [FK_round_team_match_day_round_round_id] FOREIGN KEY ([round_id]) REFERENCES [match_day_round] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [team] ADD CONSTRAINT [FK_team_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    ALTER TABLE [team_budgets] ADD CONSTRAINT [FK_team_budgets_match_day_match_day_id] FOREIGN KEY ([match_day_id]) REFERENCES [match_day] ([id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806054257_RenameTournamentToMatchDay'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260806054257_RenameTournamentToMatchDay', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807161626_AddTeamLineup'
)
BEGIN
    CREATE TABLE [team_lineup] (
        [id] bigint NOT NULL IDENTITY,
        [team_id] bigint NOT NULL,
        [squad_size] int NOT NULL,
        [formation] nvarchar(50) NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_team_lineup] PRIMARY KEY ([id]),
        CONSTRAINT [FK_team_lineup_team_team_id] FOREIGN KEY ([team_id]) REFERENCES [team] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807161626_AddTeamLineup'
)
BEGIN
    CREATE TABLE [team_lineup_player] (
        [id] bigint NOT NULL IDENTITY,
        [team_lineup_id] bigint NOT NULL,
        [player_id] bigint NOT NULL,
        [is_starter] bit NOT NULL,
        [order_index] int NOT NULL,
        [availability] nvarchar(max) NOT NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_team_lineup_player] PRIMARY KEY ([id]),
        CONSTRAINT [FK_team_lineup_player_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_team_lineup_player_team_lineup_team_lineup_id] FOREIGN KEY ([team_lineup_id]) REFERENCES [team_lineup] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807161626_AddTeamLineup'
)
BEGIN
    CREATE UNIQUE INDEX [IX_team_lineup_team_id] ON [team_lineup] ([team_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807161626_AddTeamLineup'
)
BEGIN
    CREATE INDEX [IX_team_lineup_player_player_id] ON [team_lineup_player] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807161626_AddTeamLineup'
)
BEGIN
    CREATE UNIQUE INDEX [IX_team_lineup_player_team_lineup_id_player_id] ON [team_lineup_player] ([team_lineup_id], [player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807161626_AddTeamLineup'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807161626_AddTeamLineup', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [system_settings] ADD [matches_per_week] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_auto_teams_enabled] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_auto_teams_lead_hours] int NOT NULL DEFAULT 24;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_team_count] int NOT NULL DEFAULT 2;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [players] ADD [player_rank] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [match_day] ADD [auto_gen_slot_day_of_week] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [match_day] ADD [auto_gen_week_start] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [match_day] ADD [auto_teams_generated] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    ALTER TABLE [match_day] ADD [is_manually_modified] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    CREATE TABLE [weekly_match_slot] (
        [id] bigint NOT NULL IDENTITY,
        [system_settings_id] bigint NOT NULL,
        [day_of_week] nvarchar(max) NOT NULL,
        [time] time NOT NULL,
        [sort_order] int NOT NULL,
        CONSTRAINT [PK_weekly_match_slot] PRIMARY KEY ([id]),
        CONSTRAINT [FK_weekly_match_slot_system_settings_system_settings_id] FOREIGN KEY ([system_settings_id]) REFERENCES [system_settings] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    CREATE INDEX [IX_weekly_match_slot_system_settings_id] ON [weekly_match_slot] ([system_settings_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807174449_AddSchedulerWeeklyMatchTeamAutoGen', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807191213_AddMatchDayStatusCheckIntervalHours'
)
BEGIN
    ALTER TABLE [system_settings] ADD [match_day_status_check_interval_hours] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807191213_AddMatchDayStatusCheckIntervalHours'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807191213_AddMatchDayStatusCheckIntervalHours', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    ALTER TABLE [system_settings] DROP CONSTRAINT [FK_system_settings_venues_weekly_match_venue_id];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[weekly_match_slot]', N'weekly_match_day_slot';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[weekly_match_day_slot].[IX_weekly_match_slot_system_settings_id]', N'IX_weekly_match_day_slot_system_settings_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_venue_id]', N'weekly_match_day_venue_id', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_team_count]', N'weekly_match_day_team_count', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_sport_type]', N'weekly_match_day_sport_type', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_name_prefix]', N'weekly_match_day_name_prefix', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_enabled]', N'weekly_match_day_enabled', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_duration_minutes]', N'weekly_match_day_duration_minutes', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_auto_teams_lead_hours]', N'weekly_match_day_auto_teams_lead_hours', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[weekly_match_auto_teams_enabled]', N'weekly_match_day_auto_teams_enabled', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[matches_per_week]', N'match_days_per_week', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'[system_settings].[IX_system_settings_weekly_match_venue_id]', N'IX_system_settings_weekly_match_day_venue_id', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'dbo.PK_weekly_match_slot', N'PK_weekly_match_day_slot', N'OBJECT';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    EXEC sp_rename N'dbo.FK_weekly_match_slot_system_settings_system_settings_id', N'FK_weekly_match_day_slot_system_settings_system_settings_id', N'OBJECT';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    ALTER TABLE [system_settings] ADD CONSTRAINT [FK_system_settings_venues_weekly_match_day_venue_id] FOREIGN KEY ([weekly_match_day_venue_id]) REFERENCES [venues] ([id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807211829_RenameWeeklyMatchToWeeklyMatchDay', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808033343_AddMatchDaySingleDefaultIndex'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ux_match_day_single_default] ON [match_day] ([is_default]) WHERE [is_default] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808033343_AddMatchDaySingleDefaultIndex'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808033343_AddMatchDaySingleDefaultIndex', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808095837_AddJerseyColorList'
)
BEGIN
    CREATE TABLE [jersey_color] (
        [id] bigint NOT NULL IDENTITY,
        [system_settings_id] bigint NOT NULL,
        [color] nvarchar(30) NOT NULL,
        [sort_order] int NOT NULL,
        CONSTRAINT [PK_jersey_color] PRIMARY KEY ([id]),
        CONSTRAINT [FK_jersey_color_system_settings_system_settings_id] FOREIGN KEY ([system_settings_id]) REFERENCES [system_settings] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808095837_AddJerseyColorList'
)
BEGIN
    CREATE INDEX [IX_jersey_color_system_settings_id] ON [jersey_color] ([system_settings_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808095837_AddJerseyColorList'
)
BEGIN

                    INSERT INTO jersey_color (system_settings_id, color, sort_order)
                    SELECT id, jersey_color_a, 0 FROM system_settings WHERE jersey_color_a IS NOT NULL;
                    INSERT INTO jersey_color (system_settings_id, color, sort_order)
                    SELECT id, jersey_color_b, 1 FROM system_settings WHERE jersey_color_b IS NOT NULL;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808095837_AddJerseyColorList'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[system_settings]') AND [c].[name] = N'jersey_color_a');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [system_settings] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [system_settings] DROP COLUMN [jersey_color_a];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808095837_AddJerseyColorList'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[system_settings]') AND [c].[name] = N'jersey_color_b');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [system_settings] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [system_settings] DROP COLUMN [jersey_color_b];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808095837_AddJerseyColorList'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808095837_AddJerseyColorList', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808123329_AddPerSlotDuration'
)
BEGIN
    ALTER TABLE [weekly_match_day_slot] ADD [duration_minutes] int NOT NULL DEFAULT 90;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808123329_AddPerSlotDuration'
)
BEGIN

                    UPDATE wds
                    SET wds.duration_minutes = ss.weekly_match_day_duration_minutes
                    FROM weekly_match_day_slot wds
                    JOIN system_settings ss ON ss.id = wds.system_settings_id;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808123329_AddPerSlotDuration'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[system_settings]') AND [c].[name] = N'weekly_match_day_duration_minutes');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [system_settings] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [system_settings] DROP COLUMN [weekly_match_day_duration_minutes];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808123329_AddPerSlotDuration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808123329_AddPerSlotDuration', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808124857_AddPerSlotTimeGap'
)
BEGIN
    ALTER TABLE [weekly_match_day_slot] ADD [time_gap_minutes] int NOT NULL DEFAULT 15;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808124857_AddPerSlotTimeGap'
)
BEGIN
    ALTER TABLE [match_day] ADD [time_gap_minutes] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808124857_AddPerSlotTimeGap'
)
BEGIN

                    UPDATE wds
                    SET wds.time_gap_minutes = ss.weekly_match_time_gap_minutes
                    FROM weekly_match_day_slot wds
                    JOIN system_settings ss ON ss.id = wds.system_settings_id;
                
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808124857_AddPerSlotTimeGap'
)
BEGIN
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[system_settings]') AND [c].[name] = N'weekly_match_time_gap_minutes');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [system_settings] DROP CONSTRAINT [' + @var5 + '];');
    ALTER TABLE [system_settings] DROP COLUMN [weekly_match_time_gap_minutes];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808124857_AddPerSlotTimeGap'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808124857_AddPerSlotTimeGap', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808164156_AddPerSlotMatchDuration'
)
BEGIN
    ALTER TABLE [weekly_match_day_slot] ADD [match_duration_minutes] int NOT NULL DEFAULT 13;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808164156_AddPerSlotMatchDuration'
)
BEGIN
    ALTER TABLE [match_day] ADD [match_duration_minutes] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808164156_AddPerSlotMatchDuration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808164156_AddPerSlotMatchDuration', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808192306_FixTimeGapValueGenerated'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808192306_FixTimeGapValueGenerated', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809024212_ReplaceTeamCountWithMaxPlayersPerTeam'
)
BEGIN
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[system_settings]') AND [c].[name] = N'weekly_match_day_team_count');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [system_settings] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [system_settings] DROP COLUMN [weekly_match_day_team_count];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809024212_ReplaceTeamCountWithMaxPlayersPerTeam'
)
BEGIN
    ALTER TABLE [system_settings] ADD [weekly_match_day_max_players_per_team] int NOT NULL DEFAULT 6;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809024212_ReplaceTeamCountWithMaxPlayersPerTeam'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260809024212_ReplaceTeamCountWithMaxPlayersPerTeam', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809053657_AddPlayerStatAdjustment'
)
BEGIN
    CREATE TABLE [player_stat_adjustment] (
        [id] bigint NOT NULL IDENTITY,
        [player_id] bigint NOT NULL,
        [goals_adjustment] int NOT NULL DEFAULT 0,
        [assists_adjustment] int NOT NULL DEFAULT 0,
        [yellow_cards_adjustment] int NOT NULL DEFAULT 0,
        [red_cards_adjustment] int NOT NULL DEFAULT 0,
        [matches_played_adjustment] int NOT NULL DEFAULT 0,
        [note] nvarchar(500) NULL,
        [created_by] bigint NOT NULL,
        [created_date] datetime2 NOT NULL,
        [last_modified_by] bigint NULL,
        [updated_date] datetime2 NULL,
        CONSTRAINT [PK_player_stat_adjustment] PRIMARY KEY ([id]),
        CONSTRAINT [FK_player_stat_adjustment_players_player_id] FOREIGN KEY ([player_id]) REFERENCES [players] ([id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809053657_AddPlayerStatAdjustment'
)
BEGIN
    CREATE UNIQUE INDEX [IX_player_stat_adjustment_player_id] ON [player_stat_adjustment] ([player_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809053657_AddPlayerStatAdjustment'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260809053657_AddPlayerStatAdjustment', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    DROP INDEX [IX_player_stat_adjustment_player_id] ON [player_stat_adjustment];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    ALTER TABLE [player_stat_adjustment] ADD [match_id] bigint NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    CREATE INDEX [IX_player_stat_adjustment_match_id] ON [player_stat_adjustment] ([match_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_player_stat_adjustment_player_id_lifetime] ON [player_stat_adjustment] ([player_id]) WHERE [match_id] IS NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_player_stat_adjustment_player_id_match_id] ON [player_stat_adjustment] ([player_id], [match_id]) WHERE [match_id] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    ALTER TABLE [player_stat_adjustment] ADD CONSTRAINT [FK_player_stat_adjustment_match_match_id] FOREIGN KEY ([match_id]) REFERENCES [match] ([id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260809060459_AddPlayerStatAdjustmentMatchScope'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260809060459_AddPlayerStatAdjustmentMatchScope', N'8.0.10');
END;
GO

COMMIT;
GO

