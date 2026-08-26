import sys, pymssql

if len(sys.argv) < 2:
    print("Usage: apply_migrations.py <sql_file>")
    sys.exit(1)

sql_file = sys.argv[1]
with open(sql_file, 'r') as f:
    sql = f.read()

conn = pymssql.connect(
    server='localhost', user='sa', password='BofcDotnet2026!',
    database='bofc_football', autocommit=True
)
cursor = conn.cursor()

# Split on GO statements (SQL Server batch separator)
batches = sql.split('\nGO\n')
applied = 0
for batch in batches:
    batch = batch.strip()
    if batch and not batch.startswith('--'):
        try:
            cursor.execute(batch)
            applied += 1
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print(f'Skipped (already exists): {str(e)[:80]}')
            else:
                print(f'Error: {e}')
                sys.exit(1)

conn.close()
print(f'Applied {applied} migration batches successfully')
