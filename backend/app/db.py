"""
Postgres connection pool (Supabase). Opened/closed via main.py's lifespan
context manager -- see FastAPI's lifespan pattern, which replaces the
deprecated @app.on_event("startup") used previously.
"""

import os

from psycopg_pool import AsyncConnectionPool

DATABASE_URL = os.environ["DATABASE_URL"]

pool = AsyncConnectionPool(DATABASE_URL, min_size=0, max_size=5, open=False)
