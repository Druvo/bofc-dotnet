"""Migrate BOFC data from MySQL (Java backend) to SQL Server (.NET backend).
Handles column renames and FK constraint conflicts."""
import pymysql
import pyodbc

MYSQL_CONFIG = {
    'host': '192.168.0.50',
    'port': 3307,
    'user': 'root',
    'password': 'bofc129',
    'database': 'bofc_football',
}

SQLSERVER_CONN = (
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=192.168.0.50,1433;'
    'DATABASE=bofc_football;'
    'UID=sa;'
    'PWD=BofcDotnet2026!;'
    'TrustServerCertificate=yes;'
    'Encrypt=no;'
)

# Column renames: MySQL name -> SQL Server name
COLUMN_RENAMES = {
    'skype_id': 'teams_id',
}

# Tables to skip
SKIP_TABLES = {'__EFMigrationsHistory', 'flyway_schema_history', 'notifications',
               'notification_recipients', 'push_subscriptions', 'payment_accounts'}

# Order matters for FK constraints
TABLES = [
    'roles',
    'players',
    'players_roles',
    'ac_natures',
    'ac_charts',
    'ac_voucher_types',
    'cost_types',
    'ac_vouchers',
    'ac_voucher_details',
    'ac_bill_payments',
    'ac_collections',
    'collection_players',
    'venues',
    'tournament',
    'tournament_participant',
    'tournament_participant_players',
    'tournament_prize',
    'tournament_round',
    'round_group',
    'round_group_team',
    'round_team',
    'group_standing',
    'advancement_rule',
    'logic_node',
    'match',
    'match_event',
    'match_statistics',
    'club_rule',
    'monthly_cost',
    'player_goalkeeping_history',
    'team',
    'team_budgets',
    'team_player',
    'auction_sessions',
    'auction_settings',
    'auction_players',
    'auction_player_registrations',
    'auction_bids',
]


def get_sqlserver_columns(cur, table):
    """Get column names from SQL Server table."""
    cur.execute(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}' ORDER BY ORDINAL_POSITION")
    return [row[0] for row in cur.fetchall()]


def get_mysql_columns(cur, table):
    """Get column names from MySQL table."""
    cur.execute(f"SELECT * FROM `{table}` LIMIT 0")
    return [desc[0] for desc in cur.description]


def map_columns(mysql_cols, sqlserver_cols):
    """Map MySQL column indices to SQL Server columns. Returns (insert_cols, mysql_indices)."""
    mapped_cols = []
    mysql_indices = []
    for scol in sqlserver_cols:
        # Check if SQL Server column exists in MySQL (possibly renamed)
        mysql_name = None
        for mcol_name, scol_name in COLUMN_RENAMES.items():
            if scol_name == scol and mcol_name in mysql_cols:
                mysql_name = mcol_name
                break
        if mysql_name is None and scol in mysql_cols:
            mysql_name = scol
        
        if mysql_name:
            mapped_cols.append(scol)
            mysql_indices.append(mysql_cols.index(mysql_name))
    
    return mapped_cols, mysql_indices


def convert_value(val):
    if val is None:
        return None
    if isinstance(val, bytes):
        return val.decode('utf-8', errors='replace')
    return val


def main():
    print("Connecting to MySQL...")
    mysql = pymysql.connect(**MYSQL_CONFIG, charset='utf8mb4')
    mc = mysql.cursor()

    print("Connecting to SQL Server...")
    sqls = pyodbc.connect(SQLSERVER_CONN)
    sc = sqls.cursor()

    # Disable all FK constraints
    print("Disabling FK constraints...")
    sc.execute("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'")
    sqls.commit()

    total = 0
    for table in TABLES:
        if table in SKIP_TABLES:
            continue
        try:
            mysql_cols = get_mysql_columns(mc, table)
            sqlserver_cols = get_sqlserver_columns(sc, table)
            mapped_cols, mysql_indices = map_columns(mysql_cols, sqlserver_cols)
            
            if not mapped_cols:
                print(f"  {table}: no matching columns, skipped")
                continue

            mc.execute(f"SELECT * FROM `{table}`")
            rows = mc.fetchall()
            if not rows:
                print(f"  {table}: empty")
                continue

            # Delete existing data first (from EF seed data)
            try:
                sc.execute(f"DELETE FROM [{table}]")
            except Exception:
                pass

            col_list = ', '.join(f'[{c}]' for c in mapped_cols)
            placeholders = ', '.join(['?'] * len(mapped_cols))
            insert_sql = f"INSERT INTO [{table}] ({col_list}) VALUES ({placeholders})"

            has_id = 'id' in mapped_cols
            if has_id:
                try:
                    sc.execute(f"SET IDENTITY_INSERT [{table}] ON")
                except Exception:
                    pass

            count = 0
            for row in rows:
                values = [convert_value(row[i]) for i in mysql_indices]
                try:
                    sc.execute(insert_sql, values)
                    count += 1
                except Exception as e:
                    print(f"  WARN {table}: {str(e)[:120]}")

            if has_id:
                try:
                    sc.execute(f"SET IDENTITY_INSERT [{table}] OFF")
                except Exception:
                    pass

            print(f"  {table}: {count}/{len(rows)} rows")
            total += count
        except Exception as e:
            print(f"  {table}: ERROR ({str(e)[:100]})")

    # Re-enable FK constraints
    print("\nRe-enabling FK constraints...")
    sc.execute("EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'")
    sqls.commit()

    # Verify
    sc.execute("SELECT COUNT(*) FROM players")
    pc = sc.fetchone()[0]
    mc.execute("SELECT COUNT(*) FROM players")
    mc_pc = mc.fetchone()[0]
    print(f"\nPlayers: MySQL={mc_pc}, SQL Server={pc}")
    
    sc.execute("SELECT COUNT(*) FROM tournament")
    tc = sc.fetchone()[0]
    mc.execute("SELECT COUNT(*) FROM tournament")
    mc_tc = mc.fetchone()[0]
    print(f"Tournaments: MySQL={mc_tc}, SQL Server={tc}")
    
    sc.execute("SELECT COUNT(*) FROM ac_collections")
    ac = sc.fetchone()[0]
    mc.execute("SELECT COUNT(*) FROM ac_collections")
    mc_ac = mc.fetchone()[0]
    print(f"Collections: MySQL={mc_ac}, SQL Server={ac}")

    print(f"\nTotal rows migrated: {total}")

    mc.close()
    mysql.close()
    sc.close()
    sqls.close()


if __name__ == '__main__':
    main()
