import os
import psycopg
from psycopg.rows import dict_row
from contextlib import contextmanager

DB_PASSWORD = os.getenv("DB_PASSWORD", "password123")  # Default password
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://admin:{DB_PASSWORD}@localhost:5432/ecommerce"
)

@contextmanager
def get_db():
    """Get database connection"""
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()  # Fixed: removed the 'if'
        raise
    finally:
        conn.close()

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute a query and return results"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
            if fetch_one:
                return cur.fetchone()
            if fetch_all:
                return cur.fetchall()
            return None