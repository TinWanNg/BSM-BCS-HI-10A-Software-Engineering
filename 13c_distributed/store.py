"""
SQLite persistence layer.

One table:
  users — registered accounts (username, password hash, current public key)

Thread safety: each thread gets its own connection via threading.local so
asyncio tasks running on the same OS thread share one connection safely.
"""

import os
import sqlite3
import threading
from typing import Optional

DB_PATH = os.environ.get("MESSENGER_DB", "messenger.db")

_local = threading.local()


def _conn() -> sqlite3.Connection:
    if not hasattr(_local, "db"):
        _local.db = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.db.row_factory = sqlite3.Row
    return _local.db


def init_db():
    db = _conn()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            username      TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            public_key    TEXT NOT NULL
        );
    """)
    db.commit()


def create_user(username: str, password_hash: str, public_key: str) -> bool:
    """Return True on success, False if username is already taken."""
    try:
        db = _conn()
        db.execute(
            "INSERT INTO users (username, password_hash, public_key) VALUES (?,?,?)",
            (username, password_hash, public_key),
        )
        db.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def get_user(username: str) -> Optional[sqlite3.Row]:
    return _conn().execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()


def update_public_key(username: str, public_key: str):
    db = _conn()
    db.execute("UPDATE users SET public_key=? WHERE username=?", (public_key, username))
    db.commit()
