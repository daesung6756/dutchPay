# 배포 안내 (Vercel)

이 문서는 `dutchPay` 프로젝트를 Vercel에 배포하는 절차와 권장 환경변수, 그리고 프로덕션에서 고려해야 할 사항을 정리합니다.

## 핵심 요약
- 현재 프로젝트의 서버 API(`src/app/api/payload/route.ts`)는 로컬 파일 시스템(`.data/payloads/*.json`)에 payload를 저장합니다.
- Vercel 같은 serverless 환경에서는 컨테이너의 로컬 파일 시스템이 영속적이지 않습니다. 따라서 프로덕션에서 payload를 영구 저장하려면 외부 스토리지(예: Supabase, S3 + DB)를 사용하도록 API를 수정해야 합니다.

---

## 1) Vercel (웹 UI)로 배포하기 — 빠르게 공개하고 싶을 때

1. https://vercel.com 에서 계정으로 로그인합니다.
2. `New Project` → `Import Git Repository` 클릭
3. GitHub 계정 연동 후 `daesung6756/dutchPay` 저장소를 선택합니다.
4. Vercel이 `Next.js`를 자동 감지합니다. 기본 빌드 설정(`npm run build`)을 유지하면 됩니다.
5. (옵션) 환경변수(아래 참고)를 입력합니다: Project Settings → Environment Variables
6. `Deploy`를 클릭하면 배포가 시작되고 프로덕션 도메인이 생성됩니다.

배포 후 확인 포인트
- 메인 페이지 접속 확인
- 영수증 업로드 → 링크 생성 → 복원 흐름 동작 확인(참고: `?id=` 기반 파일 저장은 비영속성)

---

## 2) Vercel CLI로 배포하기

로컬에서 CLI를 통해 배포하려면 다음을 실행합니다 (PowerShell 예):

```powershell
# Vercel 로그인 (브라우저 인증 필요)
npx vercel login

# 첫 배포 (대화형 설정이 표시됩니다)
npx vercel

# 프로덕션으로 바로 배포
npx vercel --prod
```

환경변수는 CLI로도 추가할 수 있습니다:

```powershell
vercel env add NAME production
```

---

## 3) 권장 환경변수 목록

아래는 Vercel에 설정해두면 좋은 환경변수 예시입니다. 서비스에 따라 다르게 사용하세요.

- (Supabase 사용 시)
  - `SUPABASE_URL` = https://xxx.supabase.co
  - `SUPABASE_SERVICE_ROLE_KEY` = (서버에서만 사용하는 서비스 역할 키)
  - `NEXT_PUBLIC_SUPABASE_URL` = SUPABASE_URL (클라이언트용)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (익명 키)

- (S3 사용 시)
  - `S3_BUCKET` = bucket-name
  - `S3_REGION` = ap-northeast-2
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`

- 기타
  - `NODE_ENV` = production
  - `NEXT_PUBLIC_APP_NAME` = Dutch-Pay

> 주의: 서비스 키(예: `SUPABASE_SERVICE_ROLE_KEY`, `S3_SECRET_ACCESS_KEY`)는 절대 클라이언트에 노출하면 안 됩니다. Vercel의 Environment Variables 입력 시 `Production`에만 추가하고, 클라이언트에서 접근해야 하는 값은 `NEXT_PUBLIC_` 접두사를 사용하세요.

---

## 4) 파일 기반 저장(.data)을 바로 사용하면 안 될까?

Vercel에 배포하면 각 서버리스 함수 인스턴스의 파일 시스템이 임시적이며 배포/스케일링 과정에서 재시작될 수 있습니다. 따라서 `.data/payloads` 같은 파일 기반 저장은 프로덕션으로 적합하지 않습니다. 대안:

- 간단/저비용 프로덕트: Supabase (Postgres + Storage)
- 파일만 저장: S3 또는 Supabase Storage + 메타데이터 DB
- 자체 서버 유지(파일 시스템 영속성 필요): Docker + VPS

---

## 5) (권장) Supabase로 전환 — 요약 가이드

1. Supabase 프로젝트 생성
2. `payloads` 테이블 생성 (id, payload jsonb, created_at)
3. (선택) Supabase Storage를 사용하여 큰 이미지/파일을 저장하고, payload는 메타로 JSON에 URL만 보관
4. `src/app/api/payload/route.ts`를 수정하여 파일 시스템에 저장하지 않고 Supabase 클라이언트(`@supabase/supabase-js`)로 `insert`/`select` 하도록 구현
5. Vercel 환경변수에 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 추가

제가 Supabase 연동 코드를 작성해 드릴 수 있고, 필요한 환경변수/테이블 스키마를 자세히 제공해 드립니다.

---

## 6) 배포 후 점검 리스트

- 페이지 기본 렌더링 확인
- 링크 생성 및 복원(특히 `?p=`와 `?id=` 케이스) 확인
- 업로드된 이미지가 링크에서 잘 보이는지 확인
- (Supabase 미사용 시) 서버 재시작 후 `/api/payload?id=`로 접근해 저장 지속 여부 확인 — Vercel에서는 비영속임을 확인할 수 있습니다.

---

## 7) 추가 자료/명령 (유용한 명령)

- 로컬 빌드 테스트:
  ```bash
  npm run build
  npm start # 또는 next start
  ```
- Vercel 링크 정보 확인(배포 후): 프로젝트 대시보드에서 URL 확인

---

필요하시면 제가 다음 작업 중 하나를 대신 진행하겠습니다:
- A: Vercel UI에서 프로젝트 생성/Import 절차를 가이드하고 함께 완료
- B: 제가 로컬에서 `npx vercel`로 배포 시도를 시작하겠습니다(로그인/인증은 사용자가 브라우저에서 처리)
- C: Supabase 연동 코드(서버 API 수정)를 준비해서 PR 형태로 드리겠습니다.

원하시는 다음 작업을 알려주세요.
