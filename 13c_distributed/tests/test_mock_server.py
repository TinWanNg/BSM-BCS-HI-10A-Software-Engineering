"""
Mock-based tests for client-side message handling.

Instead of connecting to a real server, we inject a MockWebSocket that
captures outgoing messages and lets us push incoming messages directly.
This tests the MessengerClient receive/send logic in isolation — no network,
no server process, no timing dependencies.

This satisfies the "Mock" requirement: the mock replaces the WebSocket
transport layer, which is the only external dependency of the client.
"""

import sys
import os
import asyncio
import json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import protocol as P
from crypto_utils import generate_key_pair, encrypt, serialize_public_key
from client import MessengerClient


class MockWebSocket:
    """Simulates a WebSocket connection without any network I/O.

    Supports both `async for` iteration (used by receive_loop) and direct
    `send` calls (used by _send). Messages are injected via `push`.
    """

    def __init__(self):
        self.sent: list[dict] = []
        self._inbox: asyncio.Queue = asyncio.Queue()
        self._closed = False

    async def send(self, raw: str):
        self.sent.append(json.loads(raw))

    async def push(self, **kwargs):
        """Inject a server-side message into the client's receive queue."""
        await self._inbox.put(kwargs)

    async def close(self):
        self._closed = True
        await self._inbox.put(None)  # unblock __anext__

    def __aiter__(self):
        return self

    async def __anext__(self):
        item = await self._inbox.get()
        if item is None:
            raise StopAsyncIteration
        return json.dumps(item)

    def last_sent(self) -> dict:
        return self.sent[-1]


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_ok_sets_token():
    priv, _ = generate_key_pair()
    mock_ws = MockWebSocket()
    client = MessengerClient("alice", priv, "ws://mock")
    client.ws = mock_ws

    await mock_ws.push(type=P.S_AUTH_OK, username="alice", token="abc123")
    # Run receive_loop for just one message then cancel
    task = asyncio.create_task(client.receive_loop())
    await asyncio.sleep(0.05)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

    assert client.token == "abc123"


@pytest.mark.asyncio
async def test_incoming_message_is_decrypted():
    priv, pub = generate_key_pair()
    mock_ws = MockWebSocket()
    client = MessengerClient("bob", priv, "ws://mock")
    client.ws = mock_ws
    client.token = "tok"

    plaintext = "Hello Bob!"
    payload = encrypt(plaintext, pub)
    await mock_ws.push(type=P.S_AUTH_OK, username="bob", token="tok")
    await mock_ws.push(**{"type": P.S_MESSAGE, "from": "alice", "payload": payload})

    received = []
    original_print = __builtins__["print"] if isinstance(__builtins__, dict) else print

    import builtins
    printed = []
    builtins.print = lambda *a, **kw: printed.append(" ".join(str(x) for x in a))

    task = asyncio.create_task(client.receive_loop())
    await asyncio.sleep(0.1)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    finally:
        builtins.print = original_print

    assert any(plaintext in line for line in printed)


@pytest.mark.asyncio
async def test_send_dm_fetches_key_then_encrypts():
    priv_a, pub_a = generate_key_pair()
    priv_b, pub_b = generate_key_pair()
    mock_ws = MockWebSocket()
    client = MessengerClient("alice", priv_a, "ws://mock")
    client.ws = mock_ws
    client.token = "tok_a"

    # Simulate server responding with Bob's public key
    async def inject_key():
        await asyncio.sleep(0.05)
        await mock_ws.push(
            type=P.S_PUBLIC_KEY,
            username="bob",
            public_key=serialize_public_key(pub_b),
        )

    asyncio.create_task(inject_key())
    recv_task = asyncio.create_task(client.receive_loop())

    await client.send_dm("bob", "Secret message")
    recv_task.cancel()
    try:
        await recv_task
    except asyncio.CancelledError:
        pass

    # Client should have sent: get_key then message
    types = [m["type"] for m in mock_ws.sent]
    assert P.C_GET_KEY in types
    assert P.C_MESSAGE in types

    # The encrypted payload must be decryptable by Bob's private key
    msg = next(m for m in mock_ws.sent if m["type"] == P.C_MESSAGE)
    from crypto_utils import decrypt
    assert decrypt(msg["payload"], priv_b) == "Secret message"


@pytest.mark.asyncio
async def test_user_list_is_updated():
    priv, _ = generate_key_pair()
    mock_ws = MockWebSocket()
    client = MessengerClient("alice", priv, "ws://mock")
    client.ws = mock_ws

    await mock_ws.push(type=P.S_USER_LIST, users=["alice", "bob", "carol"])

    task = asyncio.create_task(client.receive_loop())
    await asyncio.sleep(0.05)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

    assert client._online == ["alice", "bob", "carol"]
