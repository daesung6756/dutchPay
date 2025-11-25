import pako from 'pako';

export function base64UrlEncode(str: string) {
  // Browser: use TextEncoder + chunked btoa to handle large strings and UTF-8 safely
  if (typeof window !== 'undefined' && typeof window.btoa === 'function' && typeof TextEncoder !== 'undefined') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    // convert bytes to binary string in chunks to avoid apply-size limits
    let binary = '';
    const chunkSize = 0x8000; // 32KB
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // Node fallback
  return Buffer.from(str, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(b64url: string) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // Browser: atob -> binary string -> Uint8Array -> TextDecoder
  if (typeof window !== 'undefined' && typeof window.atob === 'function' && typeof TextDecoder !== 'undefined') {
    const binary = window.atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
  // Node fallback
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function base64UrlEncodeBytes(bytes: Uint8Array) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    // convert bytes to binary string
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecodeToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    const binary = window.atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const buf = Buffer.from(b64, 'base64');
  return new Uint8Array(buf);
}

export function encodePayload(obj: unknown) {
  const json = JSON.stringify(obj);
  try {
    // pako.gzip returns Uint8Array
    const compressed = pako.gzip(json);
    const compressedB64 = base64UrlEncodeBytes(compressed);
    const rawB64 = base64UrlEncode(json);
    // If compressed is actually shorter, return with a 'z.' prefix to mark gzip
    if ((compressedB64.length + 2) < rawB64.length) {
      return `z.${compressedB64}`;
    }
  } catch (e) {
    // compression failed; fall back to raw
  }
  return base64UrlEncode(json);
}

export function decodePayload(encoded: string) {
  try {
    if (!encoded) return null;
    // support our prefixed gzip format: 'z.'
    if (encoded.startsWith('z.')) {
      const body = encoded.slice(2);
      try {
        const bytes = base64UrlDecodeToBytes(body);
        const out = pako.ungzip(bytes, { to: 'string' }) as string;
        return JSON.parse(out);
      } catch (e) {
        return null;
      }
    }

    // first try legacy text -> json
    try {
      const json = base64UrlDecode(encoded);
      return JSON.parse(json);
    } catch (e) {
      // fallback: maybe the payload was a raw compressed base64 without prefix
      try {
        const bytes = base64UrlDecodeToBytes(encoded);
        const out = pako.ungzip(bytes, { to: 'string' }) as string;
        return JSON.parse(out);
      } catch (e2) {
        return null;
      }
    }
  } catch (e) {
    return null;
  }
}

export default { encodePayload, decodePayload };
