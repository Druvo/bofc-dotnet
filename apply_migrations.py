import sys, pymssql, re

if len(sys.argv) < 2:
    print("Usage: apply_migrations.py <sql_file>")
    sys.exit(1)

sql_file = sys.argv[1]
with open(sql_file, 'rb') as f:
    raw = f.read()

# Strip UTF-8 BOM if present
if raw.startswith(b'\xef\xbb\xbf'):
    raw = raw[3:]
    print("Stripped UTF-8 BOM")

sql = raw.decode('utf-8')

# Normalize line endings
sql = sql.replace('\r\n', '\n')

# Split on GO on its own line (with optional whitespace)
batches = re.split(r'^GO\s*$', sql, flags=re.MULTILINE)

conn = pymssql.connect(
    server='localhost', user='sa', password='BofcDotnet2026!',
    database='bofc_football', autocommit=True
)
cursor = conn.cursor()

applied = 0
skipped = 0
for i, batch in enumerate(batches):
    batch = batch.strip()
    if batch and not batch.startswith('--'):
        try:
            cursor.execute(batch)
            applied += 1
        except Exception as e:
            err = str(e).lower()
            if 'already exists' in err or 'duplicate' in err or 'there is already an object' in err:
                skipped += 1
            else:
                print(f'Error in batch {i+1}: {e}')
                # Print first 200 chars of failing batch for debugging
                print(f'Batch preview: {batch[:200]}')
                sys.exit(1)

conn.close()
print(f'Applied {applied} migration batches, skipped {skipped} (already applied)')
