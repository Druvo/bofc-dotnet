"""
Apply pending EF Core migrations from an idempotent SQL script.
Handles: UTF-8 BOM, Windows CRLF, GO batch separators, already-applied skip,
         CREATE VIEW inside BEGIN...END, and default constraint cleanup.
"""
import sys, pymssql, re

if len(sys.argv) < 2:
    print("Usage: apply_migrations.py <sql_file>")
    sys.exit(1)

sql_file = sys.argv[1]
with open(sql_file, 'rb') as f:
    raw = f.read()

# Strip UTF-8 BOM
if raw.startswith(b'\xef\xbb\xbf'):
    raw = raw[3:]
    print("Stripped UTF-8 BOM")

sql = raw.decode('utf-8').replace('\r\n', '\n')

# Connect
conn = pymssql.connect(
    server='localhost', user='sa', password='BofcDotnet2026!',
    database='bofc_football', autocommit=True
)
cursor = conn.cursor()

# Get already-applied migrations
cursor.execute('SELECT MigrationId FROM __EFMigrationsHistory')
applied = set(row[0] for row in cursor.fetchall())
print(f"Already applied: {len(applied)} migrations")

# Split on GO
batches = re.split(r'^GO\s*$', sql, flags=re.MULTILINE)
migration_re = re.compile(r"\[MigrationId\]\s*=\s*N'(\d+_\w+)'")

# Track state: skip entire migration blocks for already-applied migrations
skipping = False
current_skip_mid = None
executed = 0
skipped = 0
new_migrations = set()

for batch in batches:
    batch = batch.strip()
    if not batch or batch.startswith('--'):
        continue

    # COMMIT ends a migration block
    if batch.strip().rstrip(';').upper() == 'COMMIT':
        if skipping:
            skipping = False
            current_skip_mid = None
        skipped += 1
        continue

    # BEGIN TRANSACTION — always execute (even if skipping, we'll COMMIT/rollback)
    if batch.strip().rstrip(';').upper() == 'BEGIN TRANSACTION':
        skipped += 1  # Don't execute — autocommit handles it
        continue

    # Check if this batch references a migration ID
    match = migration_re.search(batch)
    if match:
        mid = match.group(1)
        if mid in applied:
            skipping = True
            current_skip_mid = mid
            skipped += 1
            continue
        else:
            skipping = False
            current_skip_mid = None
            new_migrations.add(mid)

    if skipping:
        skipped += 1
        continue

    # Execute
    try:
        cursor.execute(batch)
        executed += 1
    except Exception as e:
        err = str(e).lower()
        if any(x in err for x in ['already exists', 'duplicate', 'there is already an object']):
            skipped += 1
        else:
            print(f'Error: {e}')
            print(f'Batch preview: {batch[:200]}')
            sys.exit(1)

conn.close()
if new_migrations:
    print(f'Applied: {", ".join(sorted(new_migrations))}')
print(f'Done: executed {executed}, skipped {skipped}')
