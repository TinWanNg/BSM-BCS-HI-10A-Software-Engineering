"""
Secure Messenger — CLI Client

Each session generates a fresh RSA-2048 key pair. The private key never leaves
this process. Public keys are shared via the server so peers can encrypt for us.

Usage:
    python client.py <username> [--register] [--server ws://host:port]

First time:  python client.py alice --register
Thereafter:  python client.py alice

Commands while connected:
    /msg <user> <text>   Send an encrypted direct message
    /users               List currently online users
    /help                Show this help
    /quit                Disconnect and exit
"""

import argparse
import asyncio
import getpass
import json

import websockets

import protocol as P
from crypto_utils import (
    decrypt, encrypt, generate_key_pair, serialize_public_key, deserialize_public_key
)

DEFAULT_SERVER = "ws://localhost:8765"


def _help():
    print(
        "\nCommands:\n"
        "  /msg <user> <text>   Encrypted direct message\n"
        "  /users               Online users\n"
        "  /quit                Exit\n"
    )


class MessengerClient:
    def __init__(self, username: str, private_key, server_url: str):
        self.username = username
        self._priv    = private_key
        self.ws       = None
        self.token    = ""
        self._online: list[str] = []
        self._key_cache: dict[str, object] = {}
        self._key_futs:  dict[str, asyncio.Future] = {}

    async def _send(self, **kwargs):
        if self.token:
            kwargs["token"] = self.token
        await self.ws.send(json.dumps(kwargs))

    async def _get_key(self, username: str) -> object:
        if username in self._key_cache:
            return self._key_cache[username]
        fut = asyncio.get_event_loop().create_future()
        self._key_futs[username] = fut
        await self._send(type=P.C_GET_KEY, target=username)
        return await asyncio.wait_for(fut, timeout=5.0)

    async def send_dm(self, recipient: str, text: str):
        key = await self._get_key(recipient)
        await self._send(type=P.C_MESSAGE, to=recipient, payload=encrypt(text, key))
        print(f"[you → {recipient}] {text}")

    async def receive_loop(self):
        async for raw in self.ws:
            data     = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == P.S_AUTH_OK:
                self.token = data["token"]
                print(f"\n[+] Signed in as '{self.username}'.  /help for commands.\n")

            elif msg_type == P.S_AUTH_ERROR:
                print(f"\n[!] Auth error: {data['message']}")
                await self.ws.close()
                return

            elif msg_type == P.S_USER_LIST:
                self._online = data.get("users", [])
                print(f"\r[~] Online: {', '.join(self._online) or '(none)'}")

            elif msg_type == P.S_PUBLIC_KEY:
                uname = data["username"]
                self._key_cache[uname] = deserialize_public_key(data["public_key"])
                if uname in self._key_futs and not self._key_futs[uname].done():
                    self._key_futs.pop(uname).set_result(self._key_cache[uname])

            elif msg_type == P.S_MESSAGE:
                sender = data["from"]
                try:
                    text = decrypt(data["payload"], self._priv)
                    print(f"\r[{sender}] {text}")
                except Exception:
                    print(f"\r[!] Could not decrypt message from {sender}")

            elif msg_type == P.S_NOTIFY:
                print(f"\r[~] {data['message']}")

            elif msg_type == P.S_ERROR:
                print(f"\r[!] {data['message']}")

    async def input_loop(self):
        loop = asyncio.get_event_loop()

        def _read():
            try:
                return input()
            except EOFError:
                return "/quit"

        while True:
            line = (await loop.run_in_executor(None, _read)).strip()
            if not line:
                continue

            if line == "/quit":
                print("[+] Goodbye.")
                await self.ws.close()
                return

            elif line == "/help":
                _help()

            elif line == "/users":
                print(f"[~] Online: {', '.join(self._online) or '(none)'}")

            elif line.startswith("/msg "):
                parts = line.split(" ", 2)
                if len(parts) < 3:
                    print("[!] Usage: /msg <user> <text>")
                    continue
                _, recipient, text = parts
                try:
                    await self.send_dm(recipient, text)
                except asyncio.TimeoutError:
                    print(f"[!] Timed out fetching public key for '{recipient}'")

            else:
                print("[!] Unknown command. Type /help.")


async def run(username: str, register: bool, server_url: str):
    password = getpass.getpass(f"Password for '{username}': ")

    private_key, public_key = generate_key_pair()
    print("[+] RSA-2048 key pair generated")
    print(f"[+] Connecting to {server_url} ...")

    async with websockets.connect(server_url) as ws:
        client    = MessengerClient(username, private_key, server_url)
        client.ws = ws

        await ws.send(json.dumps({
            "type":       P.C_REGISTER if register else P.C_LOGIN,
            "username":   username,
            "password":   password,
            "public_key": serialize_public_key(public_key),
        }))

        await asyncio.gather(client.receive_loop(), client.input_loop())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Secure Messenger CLI")
    parser.add_argument("username")
    parser.add_argument("--register", action="store_true",
                        help="Create a new account (first time only)")
    parser.add_argument("--server", default=DEFAULT_SERVER, metavar="URL")
    args = parser.parse_args()

    try:
        asyncio.run(run(args.username, args.register, args.server))
    except KeyboardInterrupt:
        print("\n[+] Exiting.")
