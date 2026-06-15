"""
Secure Messenger — WebSocket Relay Server

What this server does:
  • Password-authenticated registration and login (PBKDF2 via auth.py)
  • Issues per-session tokens; every privileged action must include one
  • Routes encrypted direct messages between online users
  • Persists accounts to SQLite (via store.py)
  • Broadcasts the online user list whenever someone connects or disconnects

What this server deliberately does NOT do:
  • Decrypt any message payload — the server is an untrusted relay
"""

import asyncio
import json
import logging

import websockets
from websockets.server import WebSocketServerProtocol

import auth
import protocol as P
import store

logging.basicConfig(level=logging.INFO, format="%(asctime)s [SERVER] %(message)s")
log = logging.getLogger(__name__)

_sessions: dict[str, dict] = {}   # username → {ws, token}
_tokens:   dict[str, str]  = {}   # token    → username


async def _send(ws, **kwargs):
    await ws.send(json.dumps(kwargs))


async def _broadcast_user_list():
    msg = json.dumps(P.make(P.S_USER_LIST, users=list(_sessions.keys())))
    for s in _sessions.values():
        try:
            await s["ws"].send(msg)
        except Exception:
            pass


def _auth(data: dict) -> str | None:
    return _tokens.get(data.get("token"))


async def _handle_register(ws, data: dict):
    username = data.get("username", "").strip()
    password = data.get("password", "")
    pub_key  = data.get("public_key", "")

    if not username or not password or not pub_key:
        await _send(ws, type=P.S_AUTH_ERROR, message="username, password and public_key required")
        return None

    ok = store.create_user(username, auth.hash_password(password), pub_key)
    if not ok:
        await _send(ws, type=P.S_AUTH_ERROR, message="Username already taken")
        return None

    log.info("Registered: %s", username)
    return await _complete_login(ws, username)


async def _handle_login(ws, data: dict):
    username = data.get("username", "")
    password = data.get("password", "")
    pub_key  = data.get("public_key", "")

    user = store.get_user(username)
    if not user or not auth.verify_password(password, user["password_hash"]):
        await _send(ws, type=P.S_AUTH_ERROR, message="Invalid username or password")
        return None

    store.update_public_key(username, pub_key)
    log.info("Login: %s", username)
    return await _complete_login(ws, username)


async def _complete_login(ws, username: str) -> str:
    token = auth.generate_token()
    _sessions[username] = {"ws": ws, "token": token}
    _tokens[token] = username
    await _send(ws, type=P.S_AUTH_OK, username=username, token=token)
    await _broadcast_user_list()
    return username


async def handle(ws: WebSocketServerProtocol):
    username = None
    try:
        async for raw in ws:
            data     = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == P.C_REGISTER:
                result = await _handle_register(ws, data)
                if result:
                    username = result
                continue

            if msg_type == P.C_LOGIN:
                result = await _handle_login(ws, data)
                if result:
                    username = result
                continue

            caller = _auth(data)
            if not caller:
                await _send(ws, type=P.S_AUTH_ERROR, message="Not authenticated")
                continue

            if msg_type == P.C_MESSAGE:
                target  = data.get("to", "")
                payload = data.get("payload", "")
                if not target or not payload:
                    await _send(ws, type=P.S_ERROR, message="'to' and 'payload' required")
                elif target not in _sessions:
                    await _send(ws, type=P.S_ERROR, message=f"'{target}' is not online")
                else:
                    envelope = json.dumps(P.make(P.S_MESSAGE, **{"from": caller}, payload=payload))
                    await _sessions[target]["ws"].send(envelope)
                    log.info("DM: %s → %s", caller, target)

            elif msg_type == P.C_GET_KEY:
                target = data.get("target", "")
                user = store.get_user(target)
                if user:
                    await _send(ws, type=P.S_PUBLIC_KEY,
                                username=target, public_key=user["public_key"])
                else:
                    await _send(ws, type=P.S_ERROR, message=f"User '{target}' not found")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if username:
            token = _sessions.pop(username, {}).get("token")
            if token:
                _tokens.pop(token, None)
            log.info("Disconnected: %s", username)
            await _broadcast_user_list()


async def main():
    store.init_db()
    host, port = "localhost", 8765
    log.info("Secure Messenger v%s — ws://%s:%d", P.VERSION, host, port)
    async with websockets.serve(handle, host, port):
        await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    asyncio.run(main())
