// Legacy helpers kept as lightweight shims that use the Zustand store.
import useDutchPayStore from "@/store/useDutchPayStore";

export function saveToLocalStorageFromWindow(): boolean {
  try {
    const st = useDutchPayStore.getState();
    const payload = {
      title: st.title,
      period: { from: st.periodFrom || null, to: st.periodTo || null },
      total: st.total,
      participants: st.participants,
      detailItems: st.detailItems,
      account: st.accountNumber ? { bank: st.accountBank || null, number: st.accountNumber } : null,
      meta: { savedAt: new Date().toISOString() },
    };
    try { localStorage.setItem('dutchpay:autosave', JSON.stringify(payload)); } catch (e) { return false; }
    try { st.showToast('임시 저장되었습니다.'); } catch (e) {}
    return true;
  } catch (e) {
    console.warn('saveToLocalStorageFromWindow failed', e);
    return false;
  }
}

export function clearAllFromWindow(): boolean {
  try {
    const st = useDutchPayStore.getState();
    const ok = confirm('전체 초기화를 실행하시겠습니까? 모든 입력과 임시 저장이 삭제됩니다.');
    if (!ok) return false;
    try { localStorage.removeItem('dutchpay:autosave'); } catch (e) {}
    try { st.resetAll(); } catch (e) {}
    try { st.showToast('전체 초기화가 완료되었습니다.'); } catch (e) {}
    return true;
  } catch (e) {
    console.warn('clearAllFromWindow failed', e);
    return false;
  }
}

export function printWithToast(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.print();
    try { const st = useDutchPayStore.getState(); st.showToast('인쇄/저장 대화상자를 엽니다.'); } catch (e) {}
    return true;
  } catch (e) {
    console.warn('printWithToast failed', e);
    try { const st = useDutchPayStore.getState(); st.showToast('PDF 저장을 지원하지 않습니다.'); } catch (e) {}
  }
  return false;
}

export default {
  saveToLocalStorageFromWindow,
  clearAllFromWindow,
  printWithToast,
};
