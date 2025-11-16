// Helper functions to centralize header actions (save, clear, print)
export function saveToLocalStorageFromWindow(w = (typeof window !== 'undefined' ? window : undefined) as any): boolean {
  try {
    if (!w) return false;
    if (w?.dutchpay?.getFormState) {
      const payload = w.dutchpay.getFormState();
      const serialized = JSON.stringify(payload);
      localStorage.setItem('dutchpay:autosave', serialized);
      const read = localStorage.getItem('dutchpay:autosave');
      if (!read) {
        if (w.dutchpay?.showToast) w.dutchpay.showToast('임시 저장에 실패했습니다. (읽기 오류)');
        return false;
      }
      try {
        const parsed = JSON.parse(read);
        const pCount = Array.isArray(parsed.participants) ? parsed.participants.length : 0;
        const titlePreview = parsed.title ? String(parsed.title).slice(0, 30) : '';
        if (w.dutchpay?.showToast) w.dutchpay.showToast(`임시 저장되었습니다. ${titlePreview ? `제목: ${titlePreview} ` : ''}참여자: ${pCount}명`);
      } catch (e) {
        if (w.dutchpay?.showToast) w.dutchpay.showToast('임시 저장되었습니다.');
      }
      return true;
    }
  } catch (e) {
    // swallow - header will fallback to dispatching events
    console.warn('saveToLocalStorageFromWindow failed', e);
  }
  return false;
}

export function clearAllFromWindow(w = (typeof window !== 'undefined' ? window : undefined) as any): boolean {
  try {
    if (!w) return false;
    if (w?.dutchpay?.resetForm) {
      const ok = confirm('전체 초기화를 실행하시겠습니까? 모든 입력과 임시 저장이 삭제됩니다.');
      if (!ok) return false;
      try { localStorage.removeItem('dutchpay:autosave'); } catch (e) {}
      try { w.dutchpay.resetForm(); } catch (e) {}
      if (w.dutchpay?.showToast) w.dutchpay.showToast('전체 초기화가 완료되었습니다.');
      return true;
    }
  } catch (e) {
    console.warn('clearAllFromWindow failed', e);
  }
  return false;
}

export function printWithToast(w = (typeof window !== 'undefined' ? window : undefined) as any): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.print();
    if (w?.dutchpay?.showToast) w.dutchpay.showToast('인쇄/저장 대화상자를 엽니다.');
    return true;
  } catch (e) {
    console.warn('printWithToast failed', e);
    try { if (w?.dutchpay?.showToast) w.dutchpay.showToast('PDF 저장을 지원하지 않습니다.'); } catch (e) {}
  }
  return false;
}

export default {
  saveToLocalStorageFromWindow,
  clearAllFromWindow,
  printWithToast,
};
