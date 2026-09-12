#!/usr/bin/env python3
"""
Back up the BOFC database (and uploaded files) and prune old backups.

Runs on the VPS. Invoked by .github/workflows/deploy.yml immediately before
migrations are applied, and safe to run by hand or from a timer at any time.

Why it works the way it does:

- SQL Server runs in the `bofc-sqlserver` container, and recent azure-sql-edge
  images ship without mssql-tools, so there is no sqlcmd either in the container
  or on the host. The backup is therefore driven over the wire with pymssql -
  the same library apply_migrations.py already relies on.
- BACKUP DATABASE writes to the *server's* filesystem, i.e. inside the
  container, so the .bak is copied out with `docker cp` and then removed from
  the container to avoid keeping two copies on the same volume.
- Credentials are read from appsettings.Production.json, which already lives on
  the host. Nothing new is stored, and no password is duplicated into this file.

Usage:
    backup.py [--label LABEL] [--keep-days N] [--keep-min N] [--out DIR]
"""
import argparse
import datetime as dt
import gzip
import json
import os
import shutil
import subprocess
import sys
import tarfile

CONTAINER = os.environ.get("BOFC_SQL_CONTAINER", "bofc-sqlserver")
CONFIG = os.environ.get("BOFC_CONFIG", "/opt/bofc-dotnet/publish/appsettings.Production.json")
UPLOADS = os.environ.get("BOFC_UPLOADS", "/opt/bofc-dotnet/uploads")
CONTAINER_BACKUP_DIR = "/var/opt/mssql/backup"


def parse_connection_string(path):
    with open(path) as fh:
        cfg = json.load(fh)
    raw = cfg["ConnectionStrings"]["Default"]
    parts = dict(
        p.split("=", 1) for p in raw.split(";") if "=" in p
    )
    # Keys are case-insensitive in a .NET connection string; normalise them.
    lowered = {k.strip().lower(): v.strip() for k, v in parts.items()}
    return {
        "database": lowered.get("database"),
        "user": lowered.get("user id") or lowered.get("uid"),
        "password": lowered.get("password") or lowered.get("pwd"),
    }


def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd)} failed: {result.stderr.strip()}")
    return result.stdout


def backup_database(conn_info, stamp, label, out_dir):
    import pymssql

    name = f"{conn_info['database']}_{stamp}"
    if label:
        name += f"_{label}"
    container_path = f"{CONTAINER_BACKUP_DIR}/{name}.bak"

    run(["docker", "exec", CONTAINER, "mkdir", "-p", CONTAINER_BACKUP_DIR])

    conn = pymssql.connect(
        server="localhost",
        user=conn_info["user"],
        password=conn_info["password"],
        database=conn_info["database"],
        autocommit=True,
        timeout=600,
        login_timeout=60,
    )
    try:
        cursor = conn.cursor()
        # CHECKSUM makes the backup verify its own pages as it writes; INIT keeps a
        # stray identically-named file from being appended to rather than replaced.
        cursor.execute(
            f"BACKUP DATABASE [{conn_info['database']}] TO DISK = %s "
            "WITH INIT, CHECKSUM, FORMAT, NAME = 'BOFC pre-deploy backup'",
            (container_path,),
        )
        # pymssql surfaces BACKUP's progress messages as result sets; draining them
        # is what actually blocks until the backup has finished writing.
        while cursor.nextset():
            pass
    finally:
        conn.close()

    staged = os.path.join(out_dir, f"{name}.bak")
    run(["docker", "cp", f"{CONTAINER}:{container_path}", staged])
    # Drop the in-container copy: /var/opt/mssql is a Docker volume on the same
    # disk, so leaving it there would silently double every backup's footprint.
    run(["docker", "exec", CONTAINER, "rm", "-f", container_path])

    compressed = staged + ".gz"
    with open(staged, "rb") as src, gzip.open(compressed, "wb", compresslevel=6) as dst:
        shutil.copyfileobj(src, dst)
    os.remove(staged)
    return compressed


def backup_uploads(stamp, label, out_dir):
    """Player photos and team logos live on disk, not in the database, so a
    database-only backup would silently lose them."""
    if not os.path.isdir(UPLOADS):
        return None
    name = f"uploads_{stamp}" + (f"_{label}" if label else "")
    path = os.path.join(out_dir, f"{name}.tar.gz")
    with tarfile.open(path, "w:gz") as tar:
        tar.add(UPLOADS, arcname="uploads")
    return path


def prune(out_dir, keep_days, keep_min):
    """Delete backups older than keep_days, but never drop below keep_min of each
    kind. The floor matters: without it, a gap in deployments longer than the
    retention window would leave no backups at all."""
    now = dt.datetime.now()
    removed = []
    for prefix, suffix in (("uploads_", ".tar.gz"), ("", ".bak.gz")):
        files = sorted(
            (
                os.path.join(out_dir, f)
                for f in os.listdir(out_dir)
                if f.endswith(suffix) and (f.startswith(prefix) if prefix else not f.startswith("uploads_"))
            ),
            key=os.path.getmtime,
            reverse=True,
        )
        for path in files[keep_min:]:
            age_days = (now - dt.datetime.fromtimestamp(os.path.getmtime(path))).days
            if age_days >= keep_days:
                os.remove(path)
                removed.append(os.path.basename(path))
    return removed


def human(size):
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024:
            return f"{size:.1f}{unit}"
        size /= 1024
    return f"{size:.1f}TB"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", default="", help="tag appended to the filename, e.g. a CI run id")
    parser.add_argument("--keep-days", type=int, default=30)
    parser.add_argument("--keep-min", type=int, default=10, help="always retain this many, regardless of age")
    parser.add_argument("--out", default="/opt/bofc-dotnet/backups")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    conn_info = parse_connection_string(CONFIG)
    if not conn_info["database"] or not conn_info["password"]:
        sys.exit(f"Could not read a usable connection string from {CONFIG}")

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    label = "".join(c for c in args.label if c.isalnum() or c in "-_")

    db_path = backup_database(conn_info, stamp, label, args.out)
    print(f"database -> {os.path.basename(db_path)} ({human(os.path.getsize(db_path))})")

    uploads_path = backup_uploads(stamp, label, args.out)
    if uploads_path:
        print(f"uploads  -> {os.path.basename(uploads_path)} ({human(os.path.getsize(uploads_path))})")

    removed = prune(args.out, args.keep_days, args.keep_min)
    print(f"pruned   -> {len(removed)} old backup(s)" + (f": {', '.join(removed)}" if removed else ""))

    total = sum(
        os.path.getsize(os.path.join(args.out, f)) for f in os.listdir(args.out)
    )
    print(f"retained -> {len(os.listdir(args.out))} file(s), {human(total)} total in {args.out}")


if __name__ == "__main__":
    main()
