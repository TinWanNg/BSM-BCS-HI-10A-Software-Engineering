# 13c — Secure Messenger (Distributed)

A distributed, end-to-end encrypted (E2EE) command-line messenger.  
Built with Python, WebSockets, RSA-2048, AES-256-GCM, and SQLite.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         relay server                            │
│   auth.py  ·  store.py (SQLite)  ·  protocol.py                 │
│   • authenticates users (PBKDF2 passwords + session tokens)     │
│   • routes ciphertext — never decrypts anything                 │
│   • manages room membership                                     │
└───────────────┬─────────────────────────┬───────────────────────┘
                │ WebSocket               │ WebSocket
      ┌─────────┴──────────┐   ┌──────────┴──────────┐
      │   client: alice    │   │    client: bob       │
      │  rooms.py (fanout) │   │  rooms.py (fanout)   │
      │  crypto_utils.py   │   │  crypto_utils.py     │
      │  RSA-2048 key pair │   │  RSA-2048 key pair   │
      └────────────────────┘   └──────────────────────┘
```

**Key property:** the relay server is *untrusted*.  
It sees only ciphertext and public keys — compromising the server reveals nothing about message content.

---

## Modules

| Module | Layer | Responsibility |
|---|---|---|
| `protocol.py` | shared | Wire-protocol constants (`C_*` / `S_*`) and `make()` message builder |
| `auth.py` | server | PBKDF2-SHA256 password hashing (260k iterations) + random session tokens |
| `store.py` | server | SQLite: users, rooms, room membership |
| `server.py` | server | WebSocket relay: auth, message routing, room broadcasts |
| `client.py` | client | Interactive CLI: register/login, direct messages, room chat |
| `rooms.py` | client | Membership cache, per-member public-key cache, fanout encryption |
| `crypto_utils.py` | shared | RSA-OAEP + AES-256-GCM hybrid encrypt/decrypt |

---

## Features

### Password authentication

Passwords are hashed with PBKDF2-SHA256 (260 000 iterations, 32-byte random salt) before storage in SQLite. On login the server issues a random 64-byte hex session token; every subsequent message must include it.

### End-to-end encrypted direct messages

Uses hybrid RSA-OAEP + AES-GCM:

1. Generate a random 256-bit AES key and 96-bit nonce per message.
2. Encrypt plaintext with **AES-256-GCM** (authenticated — detects tampering).
3. Encrypt the AES key with the recipient's **RSA-2048** public key (OAEP/SHA-256).
4. Bundle `{enc_key, nonce, ciphertext}` as JSON and send to the server.
5. Recipient decrypts the AES key with their private key, then decrypts the message.

### Group rooms with fanout encryption

Each room message is encrypted **individually** for every member using their own public key. The sender produces one ciphertext per member and sends them all to the server in a single message. The server delivers each ciphertext only to its intended recipient — no shared group key is needed.

---

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Terminal 1 — start the server
python server.py

# Terminal 2 — register Alice (first time only)
python client.py alice --register

# Terminal 3 — register Bob
python client.py bob --register

# Subsequent logins (no --register)
python client.py alice
```

### Direct messages

Send an encrypted message directly to another online user:

```
/msg bob Hey, this is end-to-end encrypted!
```

Bob's terminal will show:
```
[alice] Hey, this is end-to-end encrypted!
```

---


## Testing

Install dependencies then run all tests from the `13c_distributed/` folder:

```bash
pip install -r requirements.txt
python -m pytest
```

### Test files

| File | What it tests | Approach |
|---|---|---|
| `tests/test_crypto.py` | Encrypt/decrypt, tampered ciphertext, wrong key | Unit |
| `tests/test_auth.py` | Password hashing, verification, token format, invalid input | Unit |
| `tests/test_store.py` | SQLite CRUD, duplicate user rejection | Unit — isolated temp DB per test |
| `tests/test_mock_server.py` | Client receive loop, key fetching, DM send | **Mock** — no real server or network |

### Exception tests

Two examples of tests that verify the system raises on invalid input:

```python
# test_crypto.py — wrong private key must be rejected
def test_wrong_key_raises_exception():
    _, pub = generate_key_pair()
    priv_wrong, _ = generate_key_pair()
    with pytest.raises(Exception):
        decrypt(encrypt("secret", pub), priv_wrong)

# test_auth.py — malformed stored hash must raise, not silently return False
def test_invalid_hash_format_raises_exception():
    with pytest.raises(Exception):
        verify_password("pass", "no_dollar_sign_here")
```

### Mock

`test_mock_server.py` uses a `MockWebSocket` class that replaces the real WebSocket transport. This lets us test all client-side logic — token handling, message decryption, key fetching — without starting a server or touching the network:

```python
class MockWebSocket:
    async def push(self, **kwargs):   # inject a fake server message
        await self._inbox.put(kwargs)
    def __aiter__(self): return self
    async def __anext__(self):        # async for in receive_loop works transparently
        item = await self._inbox.get()
        if item is None: raise StopAsyncIteration
        return json.dumps(item)
```

---

## Build (Gradle)

The project uses **Gradle 9** as its build system. Gradle is not Python-native — it normally builds Java/Kotlin projects — so all tasks use `Exec` to shell out to Python. This is intentional: it shows how a general-purpose build tool can manage any language.

### Tasks

| Command | What it does |
|---|---|
| `gradle build` | Full build: lint → test → docs |
| `gradle test` | Run all 28 pytest tests |
| `gradle lint` | Check style with flake8 |
| `gradle docs` | Generate HTML docs into `docs/html/` with pdoc |
| `gradle clean` | Delete `docs/html/` and all `__pycache__` |
| `gradle installDeps` | `pip install -r requirements.txt` |

```bash
# One command to do everything:
gradle build
```

### Failure & fix -- lint errors in source code
```
./client.py:28:101: E501 line too long (106 > 100 characters)
./client.py:152:11: F541 f-string is missing placeholders
./server.py:132:101: E501 line too long (104 > 100 characters)
```
`F541` was a genuine bug — `f"[+] RSA-2048 key pair generated"` had an `f` prefix but no `{}` inside. Fixed the long lines and removed the useless `f`. The `E221` (column alignment) errors were intentional style choices, so those were suppressed in `.flake8` with a comment explaining why.

---

## Metrics

**radon** provides two distinct metrics: cyclomatic complexity and maintainability index.

Run with `gradle metrics` or directly:
```bash
python -m radon cc *.py -s -a   # metric 1: cyclomatic complexity per function
python -m radon mi *.py -s      # metric 2: maintainability index per file
```

### Metric 1 — Cyclomatic Complexity [here](docs/metrics/complexity.txt)

Counts the number of independent paths through a function (every `if`, `elif`, `for`, `while` adds 1). Higher = harder to test.

Average across all 31 blocks: A (2.74)  ✅

`server.py:handle` and `client.py:receive_loop` are C/B because they are message dispatchers — every `if msg_type ==` adds one point. The rest of the codebase is A.

### Metric 2 — Maintainability Index [here](docs/metrics/maintainability.txt)

A composite score (0–100) derived from complexity, lines of code, and comment ratio. Higher = easier to maintain.

`server.py` and `client.py` receive two lower scores (54, 52), reflecting the same dispatch functions flagged above — long but not unmaintainable.