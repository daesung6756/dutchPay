# dutch-pay — Project Spec (snapshot)

This file describes the current runtime and development specs for the `dutch-pay` micro-site (as of 2025-11-18).

## Overview
- Purpose: Small Next.js App Router micro-site to create and share Dutch-pay (split-the-bill) payloads via URL.
- UX: Single client-only page (`HomeClient`) showing an editable receipt form and a printable receipt view; header exposes three actions: `임시 저장`, `PDF 저장`, `전체 초기화`.

## Tech stack
- Framework: Next.js (App Router, tested on Next 16 with Turbopack)
- Language: TypeScript
- UI: Tailwind CSS and shadcn-ui (Radix primitives + custom UI components)
- State: Zustand (`src/store/useDutchPayStore.ts`)
- PDF/Print: `html2canvas` + `jspdf` (dynamically imported); fallback to `window.print()` when capture fails
- Tests: Vitest with `happy-dom` for DOM-like tests

## Important files
- `src/components/HomeClient.tsx` — client-only entry: decodes URL payloads, fetches server-stored payload by `id`, and rehydrates store from localStorage autosave when no `p` or `id` present.
- `src/components/Header.tsx` — sticky header exposing the three actions (PDF save, temporary save, clear all) with toasts.
- `src/components/ReceiptForm.tsx` — form UI for editing title, period, account, total, participants, and detail items. Also exposes `window.dutchpay.*` helpers.
- `src/components/Receipt.tsx` — printable receipt view (`#receipt` element) used for PDF/print export.
- `src/store/useDutchPayStore.ts` — Zustand store and actions (no persistent middleware; manual autosave used).
- `src/lib/encoding.ts` — encode/decode utility used to put payloads into URL `p` param.
- `src/pages/api/payload` (or App Router equivalent) — server API used to store large payloads and return an `id`.
- `src/lib/dutchpayActions.ts` — helper functions used in some places to centralize header actions; lightweight shim to interact with `window.dutchpay` when available.

## Store shape (`DutchPayState`) — key fields
- `title: string`
- `periodFrom: string`
- `periodTo: string`
- `total: number | ''`
- `participants: Array<{ id: string; name: string; share?: number }>`
- `detailItems: Array<{ id: string; title: string; amount: string }>`
- `accountBank: string`
- `accountNumber: string`
- `link: string` (generated link)
- `loading: boolean`, `showForm: boolean`, `detailOpen: boolean`, `toasts: Array<{id,msg,duration}>`
- Key actions: `setTitle`, `setPeriodFrom/To`, `setTotal`, `setParticipants`, `addParticipant`, `removeParticipant`, `updateParticipantName`, `setDetailItems`, `addDetailItem`, `updateDetailItem`, `removeDetailItem`, `setAccountBank/Number`, `resetAll`, `showToast`

## Persistence / Storage
- Manual autosave key: `localStorage['dutchpay:autosave']` — used by the header's `임시 저장` action and by `HomeClient` rehydrate logic.
- Clear-all behavior: header `전체 초기화` removes any localStorage/sessionStorage keys that include `dutchpay` or `dutch` (case-insensitive), calls `resetAll()` on the store, and removes `p`, `id`, `view` query params from the URL (via `router.replace`).

## URL sharing and encoding
- Short payloads: encoded to a compact string via `encodePayload()` and placed in `?p=<encoded>`.
- Large payloads: if encoded length exceeds threshold (WARN_LEN ~3000), form metadata (without detail items) is POSTed to `/api/payload` and returns an `id` used as `?id=<id>` in URLs.
- Viewer mode: app supports `?view=1` to render read-only view (hides form).

## PDF / Print
- Primary flow: capture `#receipt` element with `html2canvas` (scale: 2, useCORS: true) → embed PNG into `jsPDF` → output blob → open new tab with blob URL.
- Fallback: if capture fails or libraries unavailable, call `window.print()`.
- Note: for mobile browsers, opening a blank tab synchronously on user gesture then navigating it to blob URL reduces popup-blocking risk (currently best-effort behavior).

## Global window helpers (client)
- `window.dutchpay.getFormState()` — returns the current form state (title, period, total, participants, account, detailItems). Exposed by `ReceiptForm` to let header read synchronous state for autosave.
- `window.dutchpay.resetForm()` — triggers `resetAll()` via the store.
- `window.dutchpay.showToast(msg, duration)` — forwards to store `showToast`.

## Testing & dev commands
- Type-check: `npx tsc --noEmit`
- Run dev server: `npm run dev` (Next.js dev with Turbopack)
- Run tests: `npm test` or `npx vitest` (project configured with Vitest + happy-dom)

## Known behaviors / caveats
- The store no longer uses Zustand `persist` middleware — persistence is manual via `dutchpay:autosave` to avoid unexpected rehydration overwriting live edits.
- Autosave race conditions were mitigated by exposing `window.dutchpay.getFormState` and by computing totals locally on detail-item input changes.
- Detail item `id` values are normalized to start with `d` to avoid numeric key collisions in React lists.
- Some features (PDF open in new tab) may vary on mobile browsers and iOS; users may need to manually save blobs if native behavior is limited.

## Suggested next improvements
- Add an explicit, small integration test that verifies autosave -> refresh -> rehydrate behavior.
- Consider synchronously opening a new blank tab on PDF-save user gesture, then writing the blob URL into that tab to avoid popup blockers.
- If autosave still has race issues in certain browsers, change header save to read DOM input values directly (instead of store snapshot) on save.

---
Generated by developer tooling on 2025-11-18.
