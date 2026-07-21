import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

_pool = pooling.MySQLConnectionPool(
    pool_name="testosteronium_pool",
    pool_size=5,
    host=os.getenv("MYSQL_HOST", "localhost"),
    port=int(os.getenv("MYSQL_PORT", 3306)),
    user=os.getenv("MYSQL_USER", "root"),
    password=os.getenv("MYSQL_PASSWORD", ""),
    database=os.getenv("MYSQL_DB", "testosteronium"),
)


def get_conn():
    """Grab a connection from the pool. Caller is responsible for closing it
    (use it in a `with` block or call .close() when done — closing returns
    it to the pool rather than actually disconnecting)."""
    return _pool.get_connection()


def query(sql, params=None, fetch=True):
    """Run a query and optionally fetch results as a list of dicts."""
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        if fetch:
            rows = cur.fetchall()
        else:
            conn.commit()
            rows = cur.lastrowid
        cur.close()
        return rows
    finally:
        conn.close()