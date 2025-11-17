// 테스트: encoding.test.ts
// 목적: URL에 안전한 base64 문자열로 페이로드를 직렬화/역직렬화하는 인코딩 유틸리티에 대한 단위 테스트입니다.
// 이 테스트들은 일반 문자열과 JSON 페이로드에 대해 인코딩/디코딩 라운드트립을 검증하고,
// 잘못된 입력에 대해 `null`을 반환하는지 확인합니다.

import { describe, it, expect } from 'vitest';
import { base64UrlEncode, base64UrlDecode, encodePayload, decodePayload } from '../lib/encoding';

describe('encoding', () => {
  it('base64UrlEncode/base64UrlDecode roundtrip', () => {
    const s = 'hello こんにちは \u{1F600}';
    const enc = base64UrlEncode(s);
    const dec = base64UrlDecode(enc);
    expect(dec).toBe(s);
  });

  it('encodePayload/decodePayload roundtrip', () => {
    const obj = { a: 1, b: '테스트', c: [1,2,3], nested: { ok: true } };
    const enc = encodePayload(obj);
    const dec = decodePayload(enc);
    expect(dec).toEqual(obj);
  });

  it('decodePayload returns null for invalid input', () => {
    const dec = decodePayload('not-a-valid-encoded-string');
    expect(dec).toBeNull();
  });
});
