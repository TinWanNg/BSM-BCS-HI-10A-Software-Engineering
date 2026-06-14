"""
Hybrid RSA-OAEP + AES-GCM encryption.

Per-message scheme:
  1. Generate a random 256-bit AES key and 96-bit nonce.
  2. Encrypt plaintext with AES-256-GCM (authenticated — detects tampering).
  3. Encrypt the AES key with the recipient's RSA-2048 public key (OAEP/SHA-256).
  4. Bundle {enc_key, nonce, ciphertext} as JSON.
"""

import base64
import json
import os

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_key_pair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return private_key, private_key.public_key()


def serialize_public_key(public_key) -> str:
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()


def deserialize_public_key(pem_str: str):
    return serialization.load_pem_public_key(pem_str.encode())


_OAEP = padding.OAEP(
    mgf=padding.MGF1(algorithm=hashes.SHA256()),
    algorithm=hashes.SHA256(),
    label=None,
)


def encrypt(message: str, recipient_public_key) -> str:
    aes_key = os.urandom(32)
    nonce = os.urandom(12)
    ciphertext = AESGCM(aes_key).encrypt(nonce, message.encode(), None)
    enc_key = recipient_public_key.encrypt(aes_key, _OAEP)
    return json.dumps({
        "enc_key": base64.b64encode(enc_key).decode(),
        "nonce": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
    })


def decrypt(payload_json: str, private_key) -> str:
    p = json.loads(payload_json)
    aes_key = private_key.decrypt(base64.b64decode(p["enc_key"]), _OAEP)
    plaintext = AESGCM(aes_key).decrypt(
        base64.b64decode(p["nonce"]),
        base64.b64decode(p["ciphertext"]),
        None,
    )
    return plaintext.decode()
