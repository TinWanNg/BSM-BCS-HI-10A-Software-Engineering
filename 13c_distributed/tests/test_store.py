"""
Unit tests for store — SQLite persistence.

Each test gets its own isolated in-memory database via a pytest fixture,
so tests never interfere with each other or with messenger.db on disk.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import store


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """Point store at a fresh temp database for every test."""
    monkeypatch.setattr(store, "DB_PATH", str(tmp_path / "test.db"))
    if hasattr(store._local, "db"):
        store._local.db.close()
        del store._local.db
    store.init_db()


def test_create_user_succeeds():
    assert store.create_user("alice", "hash1", "pub1") is True


def test_create_duplicate_user_fails():
    store.create_user("alice", "hash1", "pub1")
    assert store.create_user("alice", "hash2", "pub2") is False


def test_get_user_returns_correct_data():
    store.create_user("bob", "hash_b", "pub_b")
    user = store.get_user("bob")
    assert user["username"] == "bob"
    assert user["password_hash"] == "hash_b"
    assert user["public_key"] == "pub_b"


def test_get_unknown_user_returns_none():
    assert store.get_user("nobody") is None


def test_update_public_key():
    store.create_user("carol", "hash_c", "old_key")
    store.update_public_key("carol", "new_key")
    assert store.get_user("carol")["public_key"] == "new_key"
