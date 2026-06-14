"""
Wire protocol shared by server and client.

All messages are JSON objects with a "type" field.
Constants are grouped by direction: C_ (client→server), S_ (server→client).
"""

VERSION = "2.0"

# ── Client → Server ──────────────────────────────────────────────────────────
C_REGISTER = "register"   # create account
C_LOGIN    = "login"      # authenticate
C_MESSAGE  = "message"    # encrypted direct message
C_GET_KEY  = "get_key"    # fetch a user's public key

# ── Server → Client ──────────────────────────────────────────────────────────
S_AUTH_OK    = "auth_ok"
S_AUTH_ERROR = "auth_error"
S_USER_LIST  = "user_list"   # broadcast on any connect/disconnect
S_PUBLIC_KEY = "public_key"
S_MESSAGE    = "message"
S_NOTIFY     = "notify"
S_ERROR      = "error"


def make(type_: str, **kwargs) -> dict:
    return {"type": type_, **kwargs}
