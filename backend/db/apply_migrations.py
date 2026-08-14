"""
Idempotent migration runner -- no Supabase CLI dependency.

Usage:
    DATABASE_URL=postgresql://... python3 backend/db/apply_migrations.py

Applies any backend/db/migrations/*.sql file not yet recorded in the
schema_migrations table, in filename order, each inside its own transaction.
Safe to rerun -- already-applied migrations are skipped.
"""

import os
import sys
from pathlib import Path

import psycopg

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"


def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is not set", file=sys.stderr)
        sys.exit(1)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        print(f"No migration files found in {MIGRATIONS_DIR}")
        return

    with psycopg.connect(database_url, autocommit=False) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists schema_migrations (
                  filename    text primary key,
                  applied_at  timestamptz not null default now()
                );
                """
            )
        conn.commit()

        with conn.cursor() as cur:
            cur.execute("select filename from schema_migrations")
            applied = {row[0] for row in cur.fetchall()}

        for path in migration_files:
            if path.name in applied:
                print(f"skip  {path.name} (already applied)")
                continue

            print(f"apply {path.name}")
            sql = path.read_text()
            with conn.cursor() as cur:
                cur.execute(sql)
                cur.execute(
                    "insert into schema_migrations (filename) values (%s)",
                    (path.name,),
                )
            conn.commit()

    print("Done.")


if __name__ == "__main__":
    main()
