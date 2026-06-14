"""
Unit tests for auth.

Written WITH AI — Claude generated these tests from the prompt:
  "Write pytest unit tests for auth.py covering correct password verification,
   wrong password rejection, hash uniqueness, token format, and exception
   behaviour when an invalid stored hash is passed."

This demonstrates how AI can rapidly generate comprehensive test coverage
including edge cases and exception tests that are easy to miss manually.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from auth import hash_password, verify_password, generate_token


def test_correct_password_verifies():
    h = hash_password("mysecret")
    assert verify_password("mysecret", h) is True


def test_wrong_password_rejected():
    h = hash_password("mysecret")
    assert verify_password("wrong", h) is False


def test_empty_password_is_distinct_from_any_other():
    h = hash_password("")
    assert verify_password("", h) is True
    assert verify_password(" ", h) is False


def test_same_password_produces_different_hashes():
    """PBKDF2 uses a random salt per call — hashes must differ."""
    h1 = hash_password("password")
    h2 = hash_password("password")
    assert h1 != h2


def test_hash_contains_salt_and_dk():
    """Stored format must be 'salt_hex$dk_hex' so verify_password can re-derive."""
    h = hash_password("pass")
    parts = h.split("$")
    assert len(parts) == 2
    salt_hex, dk_hex = parts
    assert len(bytes.fromhex(salt_hex)) == 32
    assert len(bytes.fromhex(dk_hex)) == 32


def test_invalid_hash_format_raises_exception():
    """Passing a malformed stored hash must raise rather than silently return False."""
    with pytest.raises(Exception):
        verify_password("pass", "no_dollar_sign_here")


def test_token_is_unique():
    assert generate_token() != generate_token()


def test_token_length():
    token = generate_token()
    assert isinstance(token, str)
    assert len(token) == 64  # 32 bytes as hex
