# Dutch-pay 기술 스펙 (한글)

작성일: 2025-11-18

이 문서는 `dutch-pay` 마이크로사이트의 현재 기술 사양을 한국어로 정리한 문서입니다. 주요 구성, 동작, 저장소 키, API, 테스트 및 운영 관련 주의사항을 포함합니다.

## 1. 목적 요약
- 목적: 사용자가 더치페이(분할 결제) 정보를 입력하고 URL로 공유하거나 PDF로 저장할 수 있는 경량 웹 앱.
- 사용자 흐름: 폼 입력  링크 생성(또는 서버에 저장한 id)  다른 사용자들이 링크로 결과 보기  인쇄/저장.
- 중요 버튼: `임시 저장`, `PDF 저장`, `전체 초기화` (헤더에 노출)

## 2. 기술 스택
- 프레임워크: Next.js (App Router, 현재 코드베이스는 Next 16/Turbopack에서 개발 및 테스트됨)
- 언어: TypeScript
- UI/스타일: Tailwind CSS, shadcn-ui(내부 Radix 기반 컴포넌트)
- 상태관리: Zustand (`src/store/useDutchPayStore.ts`)
- PDF 캡처: `html2canvas` + `jspdf` (동적 import)
- 테스트: Vitest (+ happy-dom)

## 3. 주요 컴포넌트 및 파일
- `src/components/HomeClient.tsx`  클라이언트 전용 진입점
  - URL 파라미터(`p`, `id`, `view`) 복원
  - 서버에서 `id`로 페이로드 조회
  - 로컬 autosave(`localStorage['dutchpay:autosave']`) 복원(단, `p`나 `id`가 없을 때만)
- `src/components/Header.tsx`  상단 액션(임시 저장, PDF 저장, 전체 초기화)
- `src/components/ReceiptForm.tsx`  입력 폼 (제목, 기간, 계좌, 총액, 참여자, 세부 항목)
  - `window.dutchpay.getFormState` / `resetForm` / `showToast` 노출
  - 세부 항목 금액 입력은 숫자만 허용하고 입력 즉시 총액 갱신
- `src/components/Receipt.tsx`  인쇄/캡처 대상(요소 id=`receipt`)
- `src/store/useDutchPayStore.ts`  Zustand 스토어 (상태 + 액션)
- `src/lib/encoding.ts`  URL 인코딩/디코딩 유틸
- `src/pages/api/payload` (혹은 App Router의 API route)  큰 페이로드를 서버에 저장하고 `id`를 반환

## 4. 상태(스토어) 구조 요약
- `title: string`
- `periodFrom: string`, `periodTo: string`
- `total: number | ''` (총액, 숫자 또는 빈 문자열)
- `participants: Array<{ id: string; name: string; share?: number }>`
- `detailItems: Array<{ id: string; title: string; amount: string }>` (amount는 문자열로 관리되나 실제 계산 시 숫자로 변환)
- `accountBank: string`, `accountNumber: string`
- `link: string` (생성된 공유 링크)
- UI 제어 필드: `loading`, `showForm`, `detailOpen`, `toasts`
- 주요 액션: `setTitle`, `setPeriodFrom/To`, `setTotal`, `setParticipants`, `addParticipant`, `removeParticipant`, `updateParticipantName`, `setDetailItems`, `addDetailItem`, `updateDetailItem`, `removeDetailItem`, `resetAll`, `showToast`

## 5. 저장/복원 정책
- 로컬 autosave 키: `dutchpay:autosave` (localStorage)
  - 헤더의 `임시 저장`은 현재 폼/스토어 상태를 이 키로 직렬화하여 저장.
  - `HomeClient`는 URL에 `p` 또는 `id`가 없을 때 이 키를 읽어 스토어를 복원.
- 전체 초기화 동작
  - 스토어 `resetAll()` 호출
  - localStorage/sessionStorage에서 키에 `dutch` 또는 `dutchpay`가 포함된 항목 제거(대소문자 구분 없음)
  - URL 쿼리(`p`, `id`, `view`) 제거(라우터 replace)

## 6. 링크 생성 및 인코딩
- 짧은 페이로드: `encodePayload()`로 JSON  압축/인코딩(내부 유틸)  `?p=<encoded>`
- 큰 페이로드: 인코딩 길이가 WARN_LEN(약 3000) 이상일 경우, 상세 항목을 제외한 메타를 서버(`/api/payload`)에 POST하여 `id` 반환  `?id=<id>` 사용
- 뷰어 모드: `?view=1` (폼 숨김)
- 주의: 브라우저 및 환경별 URL 길이 제한(권장 2000자 이하) 준수

## 7. PDF / 인쇄 전략
- 기본: `html2canvas`로 `#receipt` 캡처  `jsPDF`로 PDF 생성  `pdf.output('blob')`  Blob URL을 새 탭에서 열기
- 폴백: 캡처 실패 시 `window.print()` 호출
- 모바일 주의: 팝업 차단/Blob 동작 상이(가능하면 사용자 제스처 내에서 새 탭을 미리 열어 blob URL을 쓰는 패턴 권장)

## 8. 클라이언트 전역 API
- `window.dutchpay.getFormState()`  동기적으로 폼 상태 얻기 (헤더가 임시 저장 시 안전하게 사용)
- `window.dutchpay.resetForm()`  폼 초기화 실행
- `window.dutchpay.showToast(msg, duration)`  토스트 표시

## 9. 입력 유효성 및 UX 규칙
- 세부 항목 `amount`는 숫자만 입력되도록 정규화(입력 이벤트에서 비숫자 제거)
- `ReceiptForm`에서 금액 변경 시 로컬에서 합계를 계산하여 `setTotal(sum)` 즉시 호출
- 세부 항목 `id`는 문자열(예: `d<timestamp>`)로 관리하여 React key 중복/숫자 충돌 방지

## 10. 개발/운영 명령
- 개발 서버: `npm run dev`
- 타입 검사: `npx tsc --noEmit`
- 테스트: `npx vitest` (설정에 따라 `npm test`)

## 11. 알려진 문제 및 권장 개선사항
- 자동 재하이드레이션(persist middleware)을 제거하여 의도치 않은 덮어쓰기를 방지  대신 수동 autosave/restore 사용
- 여전히 특정 환경에서 autosave/저장 race가 발생하면, 헤더의 임시 저장을 DOM에서 직접 읽도록 변경 권장
- PDF 새 탭 열기는 일부 모바일 브라우저에서 신뢰성이 낮음  사용자 제스처로 새 탭을 즉시 연 뒤 blob을 쓰는 방법 권장
- 통합 E2E 테스트 추가 권장: autosave  새로고침  복원 흐름 검증

## 12. 추가 제안(선택)
- 서버에 저장된 링크에 TTL(만료) 기능 추가
- 사용자 인증(선택)으로 개인별 저장소 제공
- PDF 템플릿/스타일 개선 및 인쇄 미리보기 옵션 추가

---
원하시면 이 파일을 커밋하고 원격에 푸시해 드리겠습니다.
