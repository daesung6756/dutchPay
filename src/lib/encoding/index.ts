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

export function encodePayload(obj: unknown) {
  const json = JSON.stringify(obj);
  return base64UrlEncode(json);
}

export function decodePayload(encoded: string) {
  try {
    const json = base64UrlDecode(encoded);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export default { encodePayload, decodePayload };
