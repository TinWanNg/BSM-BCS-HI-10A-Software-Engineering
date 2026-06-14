import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from crypto_utils import (
    generate_key_pair,
    encrypt,
    decrypt,
    serialize_public_key,
    deserialize_public_key,
)


def test_encrypt_decrypt_roundtrip():
    priv, pub = generate_key_pair()
    assert decrypt(encrypt("Hello!", pub), priv) == "Hello!"


def test_long_message_roundtrip():
    priv, pub = generate_key_pair()
    long_msg = "x" * 10_000
    assert decrypt(encrypt(long_msg, pub), priv) == long_msg


def test_each_encryption_is_unique():
    """AES key and nonce are random per call, so two encryptions of the same
    plaintext must produce different ciphertexts."""
    _, pub = generate_key_pair()
    assert encrypt("same", pub) != encrypt("same", pub)


def test_wrong_key_raises_exception():
    """Decrypting with a different private key must raise — this is the core
    security property of the scheme."""
    _, pub = generate_key_pair()
    priv_wrong, _ = generate_key_pair()
    ciphertext = encrypt("secret", pub)
    with pytest.raises(Exception):
        decrypt(ciphertext, priv_wrong)


def test_tampered_ciphertext_raises_exception():
    """AES-GCM is authenticated. Flipping a byte in the ciphertext must cause
    decryption to raise (integrity violation)."""
    import json, base64
    priv, pub = generate_key_pair()
    payload = json.loads(encrypt("hello", pub))
    # Flip the last byte of the ciphertext
    ct = bytearray(base64.b64decode(payload["ciphertext"]))
    ct[-1] ^= 0xFF
    payload["ciphertext"] = base64.b64encode(bytes(ct)).decode()
    with pytest.raises(Exception):
        decrypt(json.dumps(payload), priv)


def test_serialize_deserialize_public_key_roundtrip():
    _, pub = generate_key_pair()
    pem = serialize_public_key(pub)
    assert "PUBLIC KEY" in pem
    restored = deserialize_public_key(pem)
    # Key is usable after round-trip
    priv2, _ = generate_key_pair()
    _, pub2 = generate_key_pair()
    priv_orig, pub_orig = generate_key_pair()
    msg = "round-trip test"
    assert decrypt(encrypt(msg, deserialize_public_key(serialize_public_key(pub_orig))), priv_orig) == msg
