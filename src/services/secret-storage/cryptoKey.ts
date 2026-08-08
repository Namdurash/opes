/**
 * OPES-42 — crypto-secure encryption-key generation for the secret store.
 *
 * The raw key is 32 bytes drawn from the platform's cryptographically secure RNG
 * (`crypto.getRandomValues`) — never `Math.random` (D-003). The raw byte length is
 * fixed at 32 and measured before encoding. Keychain and MMKV both want a string,
 * so the raw bytes are base64-encoded with a small hand-rolled encoder in this file
 * (D-013 — the project has no Buffer polyfill / `btoa`, and no base64 dependency is
 * added).
 */

const KEY_BYTE_LENGTH = 32;

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

interface CryptoLike {
  getRandomValues<T extends Uint8Array>(array: T): T;
}

export interface GeneratedKey {
  raw: Uint8Array;
  base64: string;
}

// Bitwise ops are intentional here: this is a hand-rolled base64 encoder (D-013).
/* eslint-disable no-bitwise */
const toBase64 = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const hasB1 = i + 1 < bytes.length;
    const hasB2 = i + 2 < bytes.length;
    const b1 = hasB1 ? bytes[i + 1] : 0;
    const b2 = hasB2 ? bytes[i + 2] : 0;

    out += BASE64_ALPHABET[b0 >> 2];
    out += BASE64_ALPHABET[((b0 & 0b11) << 4) | (b1 >> 4)];
    out += hasB1 ? BASE64_ALPHABET[((b1 & 0b1111) << 2) | (b2 >> 6)] : '=';
    out += hasB2 ? BASE64_ALPHABET[b2 & 0b111111] : '=';
  }
  return out;
};
/* eslint-enable no-bitwise */

const cryptoSource = (globalThis as { crypto?: CryptoLike }).crypto;

/**
 * Generate a fresh 32-byte encryption key from a crypto-secure source and its
 * base64 encoding. The raw `Uint8Array` is exactly 32 bytes (AC-007) and no draw
 * ever touches `Math.random` (AC-008).
 */
export const generateKey = (): GeneratedKey => {
  if (!cryptoSource?.getRandomValues) {
    throw new Error('No cryptographically secure random source is available.');
  }
  const raw = cryptoSource.getRandomValues(new Uint8Array(KEY_BYTE_LENGTH));
  return { raw, base64: toBase64(raw) };
};
