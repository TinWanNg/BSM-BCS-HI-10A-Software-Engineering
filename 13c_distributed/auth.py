"""
User authentication: PBKDF2-SHA256 password hashing and session tokens.

PBKDF2 with 260 000 iterations matches OWASP 2023 recommendations for SHA-256.
A random salt per user prevents precomputation attacks (rainbow tables).
Session tokens are 32-byte cryptographically random values — not JWTs, which
would require a shared secret or asymmetric key on the server.
"""

import hashlib
import hmac
import os
import secrets

_ITERATIONS = 260_000
_HASH = "sha256"
_SALT_LEN = 32
_TOKEN_LEN = 32


def hash_password(password: str) -> str:
    """Return 'salt_hex$dk_hex' suitable for storage in the database."""
    salt = os.urandom(_SALT_LEN)
    dk = hashlib.pbkdf2_hmac(_HASH, password.encode(), salt, _ITERATIONS)
    return salt.hex() + "$" + dk.hex()


def verify_password(password: str, stored_hash: str) -> bool:
    salt_hex, dk_hex = stored_hash.split("$", 1)
    salt = bytes.fromhex(salt_hex)
    dk_expected = bytes.fromhex(dk_hex)
    dk_candidate = hashlib.pbkdf2_hmac(_HASH, password.encode(), salt, _ITERATIONS)
    return hmac.compare_digest(dk_candidate, dk_expected)


def generate_token() -> str:
    return secrets.token_hex(_TOKEN_LEN)
