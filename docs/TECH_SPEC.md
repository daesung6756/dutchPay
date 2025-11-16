# Technical Specification — Dutch-Pay 마이크로사이트

## 개요
- 목적: React + Next.js 14 기반의 'URL에 데이터를 저장하는' 더치페이 마이크로사이트 구현을 위한 기술 사양서.
- 주요 목표: 클라이언트 중심의 경량 서비스(서버 없음 또는 최소 서버)로 빠른 공유·참여·정산 플로우를 제공.

## 스택
- 프레임워크: `Next.js 14` (App Router 권장)
- 라이브러리: `React` (최신), `TypeScript`
- 스타일: `Tailwind CSS`
- UI 컴포넌트: `shadcn/ui` (Radix 기반 컴포넌트 + Tailwind 유틸)
- 번들/빌드: Next 14 기본 빌드 (Vercel 최적화)
- 테스트: `vitest`(단위), `playwright` 또는 `cypress`(E2E)
- 린트/포맷: `ESLint`, `Prettier`, `TypeScript` 설정

## 아키텍처 개요
- 클라이언트 중심(Zero-backend or Minimal-backend)
  - 데이터는 가능한 한 URL(또는 short link)에 인코딩해서 보관하고 공유함.
  - 서버는 선택적: 긴 데이터 저장, 링크 단축, 민감정보 저장(권한부여) 용도일 때만 사용.
- 라우팅
  - `/` : 홈(분할 생성 UI)
  - `/r` : 결과 페이지(쿼리 또는 해시로 인코딩된 데이터 표시)
  - `/r/:encoded` (선택적) : path param으로 인코딩 데이터 전달
  - `/api/shorten` (선택적, 서버) : 긴 인코딩 → short id 반환

## 데이터 모델 (클라이언트 측)
- 기본 구조(예시)

```json
{
  "title": "저녁식사",
  "currency": "KRW",
  "items": [
    {"id":"1","name":"철수","amount":12000,"note":"치킨"},
    {"id":"2","name":"영희","amount":8000,"note":"맥주"}
  ],
  "createdAt":"2025-11-16T12:00:00Z"
}
```

- 필드 규칙
  - `name`: 별칭 허용, PII 금지(가이드라인 준수)
  - `amount`: 정수(원 단위 권장)
  - `note`: 최대 100자, PII 필터 적용

## URL 인코딩 규격
- 목표: 사람이 복사/붙여넣기 가능한 짧은 URL 또는 path를 제공
- 권장 인코딩 파이프라인
  1. JSON 직렬화
  2. UTF-8 바이트로 변환
  3. gzip 또는 deflate 압축
  4. base64url 인코딩 (URL 안전)

- 파라미터 위치
  - 쿼리: `/r?d=<base64url>` — 간단 테스트 및 길이 한계가 낮음
  - path: `/r/<base64url>` — UX 상 깔끔하지만 일부 서버/호스팅에서 길이 제한 존재

- 길이/제한
  - 브라우저·플랫폼별 URL 길이 제한을 고려(권장: 2000자 이하). 긴 데이터는 서버에 저장 후 short id 사용.

## 인코딩/디코딩 예시 (pseudo)
- 인코딩

```ts
function encodePayload(obj: any): string {
  const json = JSON.stringify(obj);
  const compressed = gzipCompress(json); // client-side lib (pako 등)
  return base64urlEncode(compressed);
}
```

- 디코딩

```ts
function decodePayload(encoded: string): any {
  const compressed = base64urlDecode(encoded);
  const json = gzipDecompress(compressed);
  return JSON.parse(json);
}
```

## AI 통합(선택)
- 목적: 자동 요약 생성, 초대 메시지 템플릿 생성 등
- 위치: 프론트엔드에서 최소 정보(항목 요약)로 호출하거나, 비용/보안 상 서버에서 호출
- 안전성: `AI_GUIDELINES.md` 준수(PII 금지, 프롬프트 템플릿 버전 관리, 메타데이터만 로깅)

## 보안·프라이버시
- 절대 금지: URL에 민감한 PII(주민번호, 전체 카드번호 등) 저장 금지.
- PII 필터: 클라이언트 입력에 정규식 기반 PII 검사 적용(예시가이드 문서 참조).
- XSS/CSP: 사용자 입력을 DOM에 주입 시 항상 이스케이프; Content-Security-Policy 적용 권장.
- CORS: API 사용 시 최소 권한 정책 적용.

## 성능 및 비용
- 클라이언트 압축(예: pako)으로 네트워크 전송 최소화.
- AI 호출 비용 절감을 위해 클라이언트에서 사전 집계/유효성 검사 수행.

## 배포
- 정적 호스팅 권장: Vercel, Netlify
- 환경 변수: (옵션) `AI_API_KEY`, `SHORTENER_API_URL`, `SENTRY_DSN` 등
- CI: GitHub Actions로 lint/test/build 파이프라인 구성

## 개발/테스트 체크리스트
- TypeScript 엄격 모드 적용
- ESLint/Prettier 통합
- 유닛 테스트: 핵심 로직(인코딩/디코딩, PII 필터)
- E2E 테스트: 전체 생성 → 공유 → 열람 플로우
- 접근성(A11y) 체크: keyboard nav, screen reader 친화성

## 운영 고려사항
- 링크 만료 정책: 필요 시 short link 만료 기능 제공
- 에러 모니터링: Sentry 등으로 로깅(PII 필터링 적용)

## 부록: 구현 라이브러리 제안
- gzip/deflate: `pako`
- base64url: 작은 유틸함수 또는 `base64url` 패키지
- querystring: Next built-in URLSearchParams
- shortener (optional): 간단한 serverless 함수 returning id -> data map

---
참고: 이 사양서는 MVP 개발을 위한 제안서입니다. 세부 설계(컴포넌트 구조, API 계약 등)는 PRD/UX 문서와 함께 순차 작성합니다.
