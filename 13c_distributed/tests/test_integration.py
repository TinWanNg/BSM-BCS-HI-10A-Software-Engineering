"""
Integration tests — real server + WebSocket clients.

Spins up the server in a background task, runs scenarios, then tears down.
"""

import sys
import os
import asyncio
import json
import subprocess
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import websockets

import protocol as P
import store
from crypto_utils import (
    generate_key_pair,
    encrypt,
    decrypt,
    serialize_public_key,
    deserialize_public_key,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def server(tmp_path_factory):
    """Start the server subprocess once for all integration tests."""
    db = tmp_path_factory.mktemp("db") / "test.db"
    env = os.environ.copy()
    env["MESSENGER_DB"] = str(db)
    proc = subprocess.Popen(
        [sys.executable, "server.py"],
        cwd=os.path.join(os.path.dirname(__file__), ".."),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
    )
    time.sleep(1)
    yield proc
    proc.terminate()


async def _drain(ws, timeout=0.2):
    msgs = []
    while True:
        try:
            msgs.append(json.loads(await asyncio.wait_for(ws.recv(), timeout=timeout)))
        except asyncio.TimeoutError:
            break
    return msgs


async def _register(ws, username, password, pub_pem):
    await ws.send(json.dumps({
        "type": P.C_REGISTER, "username": username,
        "password": password, "public_key": pub_pem,
    }))
    await asyncio.sleep(0.3)
    msgs = await _drain(ws)
    ok = next((m for m in msgs if m["type"] == P.S_AUTH_OK), None)
    assert ok, f"Register failed: {msgs}"
    return ok["token"]


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_and_login(server):
    priv, pub = generate_key_pair()
    pub_pem = serialize_public_key(pub)

    async with websockets.connect("ws://localhost:8765") as ws:
        tok = await _register(ws, "u_reg", "pass123", pub_pem)
        assert isinstance(tok, str) and len(tok) == 64

    # Login with same credentials
    priv2, pub2 = generate_key_pair()
    async with websockets.connect("ws://localhost:8765") as ws:
        await ws.send(json.dumps({
            "type": P.C_LOGIN, "username": "u_reg",
            "password": "pass123", "public_key": serialize_public_key(pub2),
        }))
        await asyncio.sleep(0.3)
        msgs = await _drain(ws)
        ok = next((m for m in msgs if m["type"] == P.S_AUTH_OK), None)
        assert ok is not None


@pytest.mark.asyncio
async def test_wrong_password_rejected(server):
    priv, pub = generate_key_pair()
    async with websockets.connect("ws://localhost:8765") as ws:
        await _register(ws, "u_badpw", "correct", serialize_public_key(pub))

    async with websockets.connect("ws://localhost:8765") as ws:
        await ws.send(json.dumps({
            "type": P.C_LOGIN, "username": "u_badpw",
            "password": "wrong", "public_key": serialize_public_key(pub),
        }))
        await asyncio.sleep(0.2)
        msgs = await _drain(ws)
        assert any(m["type"] == P.S_AUTH_ERROR for m in msgs)


@pytest.mark.asyncio
async def test_encrypted_direct_message(server):
    priv_a, pub_a = generate_key_pair()
    priv_b, pub_b = generate_key_pair()

    async with (
        websockets.connect("ws://localhost:8765") as wa,
        websockets.connect("ws://localhost:8765") as wb,
    ):
        tok_a = await _register(wa, "u_alice", "pass", serialize_public_key(pub_a))
        tok_b = await _register(wb, "u_bob",   "pass", serialize_public_key(pub_b))

        # Alice fetches Bob's public key
        await wa.send(json.dumps({"type": P.C_GET_KEY, "target": "u_bob", "token": tok_a}))
        await asyncio.sleep(0.2)
        msgs = await _drain(wa)
        key_msg = next(m for m in msgs if m["type"] == P.S_PUBLIC_KEY)
        bob_pub = deserialize_public_key(key_msg["public_key"])

        # Alice sends encrypted message
        secret = "Hello Bob, only you can read this"
        await wa.send(json.dumps({
            "type": P.C_MESSAGE, "to": "u_bob",
            "payload": encrypt(secret, bob_pub), "token": tok_a,
        }))
        await asyncio.sleep(0.2)
        msgs = await _drain(wb)
        incoming = next(m for m in msgs if m["type"] == P.S_MESSAGE)

        assert decrypt(incoming["payload"], priv_b) == secret
        assert incoming["from"] == "u_alice"


@pytest.mark.asyncio
async def test_message_to_offline_user_returns_error(server):
    priv, pub = generate_key_pair()
    async with websockets.connect("ws://localhost:8765") as ws:
        tok = await _register(ws, "u_sender", "pass", serialize_public_key(pub))
        await ws.send(json.dumps({
            "type": P.C_MESSAGE, "to": "nobody_online",
            "payload": "x", "token": tok,
        }))
        await asyncio.sleep(0.2)
        msgs = await _drain(ws)
        assert any(m["type"] == P.S_ERROR for m in msgs)


@pytest.mark.asyncio
async def test_unauthenticated_message_rejected(server):
    async with websockets.connect("ws://localhost:8765") as ws:
        await ws.send(json.dumps({
            "type": P.C_MESSAGE, "to": "someone",
            "payload": "x", "token": "invalid_token",
        }))
        await asyncio.sleep(0.2)
        msgs = await _drain(ws)
        assert any(m["type"] == P.S_AUTH_ERROR for m in msgs)
