// 테스트: clear.test.tsx
// 목적: 앱의 '전체 초기화' 로직이 메모리상의 Zustand 스토어를 올바르게 초기화(reset)하고,
// 'dutchpay' 또는 'dutch'를 포함하는 퍼시스트된 스토리지 키들을 제거하는지 검증합니다.
// 이 테스트는 Header의 초기화 핸들러 로직을 렌더링 없이 모방하여 실행되며,
// React/testing-library의 peer dependency 문제를 회피하기 위해 컴포넌트 렌더링을 사용하지 않습니다.

import { describe, it, expect, beforeEach } from 'vitest';
import useDutchPayStore from '../store/useDutchPayStore';

describe('Clear-all logic (storage + store)', () => {
  beforeEach(() => {
    try { useDutchPayStore.setState({ toasts: [] }); } catch (e) {}
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  });

  it('resets the store and removes dutchpay-related storage keys', async () => {
    // seed storage and store
    localStorage.setItem('dutchpay:autosave', JSON.stringify({ title: 'X' }));
    localStorage.setItem('dutchpay-store', JSON.stringify({ some: 'value' }));
    localStorage.setItem('other-key', 'keep');

    useDutchPayStore.setState({ title: 'Hello', participants: [{ id: 'p1', name: 'A' }], total: 123, detailItems: [{ id: 'd1', title: 'i', amount: '10' }] } as any);

    // mimic header clear handler logic
    const st = useDutchPayStore.getState();
    st.resetAll();

    const removeMatchingKeys = () => {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (!key) continue;
          const lk = key.toLowerCase();
          if (lk.includes('dutchpay') || lk.includes('dutch')) {
            try { localStorage.removeItem(key); } catch (e) {}
          }
        }
      } catch (e) {}
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (!key) continue;
          const lk = key.toLowerCase();
          if (lk.includes('dutchpay') || lk.includes('dutch')) {
            try { sessionStorage.removeItem(key); } catch (e) {}
          }
        }
      } catch (e) {}
    };

    removeMatchingKeys();
    // simulate the delayed repeat used in the header implementation
    await new Promise((r) => setTimeout(r, 60));
    removeMatchingKeys();

    // assertions
    expect(localStorage.getItem('dutchpay:autosave')).toBeNull();
    expect(localStorage.getItem('dutchpay-store')).toBeNull();

    const s = useDutchPayStore.getState();
    expect(s.title).toBe('');
    expect(s.participants.length).toBe(0);
    expect(s.total).toBe('');
    expect(s.detailItems.length).toBe(0);
  });
});
