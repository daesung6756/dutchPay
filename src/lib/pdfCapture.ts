"use client";

import useDutchPayStore from "@/store/useDutchPayStore";
import sanitizeClone from '@/lib/pdf/styleSanitizer';
import { buildIframeSrcdoc, appendHiddenIframe } from '@/lib/pdf/iframeBuilder';
import captureElementWithHtml2Canvas from '@/lib/pdf/canvasCapture';

export async function generateReceiptPDF(receiptId = 'receipt', opts?: { fixedWidth?: number }) {
  const st = useDutchPayStore.getState();
  const el = document.getElementById(receiptId);
  if (!el) {
    try { st.showToast('영수증 영역을 찾을 수 없습니다. 영수증을 표시한 뒤 다시 시도하세요.'); } catch (e) {}
    return;
  }

  let wrapper: HTMLElement | null = null;
  let clone: HTMLElement | null = null;
  try {
    const { jsPDF } = await import('jspdf');

    clone = (el as HTMLElement).cloneNode(true) as HTMLElement;
    const fixedWidth = opts && typeof opts.fixedWidth === 'number' ? Math.max(1, Math.floor(opts.fixedWidth)) : undefined;
    // If fixedWidth is provided, wrap the clone in an inner container that fixes its layout width
    let innerContainer: HTMLElement | null = null;
    if (fixedWidth) {
      innerContainer = document.createElement('div');
      innerContainer.style.width = `${fixedWidth}px`;
      innerContainer.style.boxSizing = 'border-box';
      innerContainer.appendChild(clone);
    }
    // create wrapper (keeps same-scoped CSS resets)
    wrapper = document.createElement('div');
    let debugMode = false;
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        debugMode = window.location.search.indexOf('pdf_debug=1') !== -1;
      }
    } catch (e) {}
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '99999';
    wrapper.style.background = '#ffffff';
    wrapper.style.opacity = debugMode ? '1' : '0';
    if (debugMode) {
      wrapper.style.boxShadow = '0 0 0 3px rgba(250,100,40,0.25)';
      wrapper.style.border = '2px dashed rgba(250,100,40,0.8)';
      wrapper.style.pointerEvents = 'auto';
      wrapper.style.opacity = '1';
      wrapper.style.background = '#fff';
    }
    wrapper.id = 'dutchpay-pdf-wrapper';
    wrapper.style.pointerEvents = 'none';

    try {
      const safeStyle = document.createElement('style');
      safeStyle.innerHTML = `
          #dutchpay-pdf-wrapper *::before, #dutchpay-pdf-wrapper *::after { background: transparent !important; color: inherit !important; box-shadow: none !important; border-color: currentColor !important; }
          #dutchpay-pdf-wrapper * { box-shadow: none !important; background-image: none !important; }
        `;
      wrapper.appendChild(safeStyle);
    } catch (e) {}

    // append the fixed-width container when present, otherwise append clone directly
    wrapper.appendChild(innerContainer || clone);
    try { document.body.appendChild(wrapper); } catch (e) {}

    // sanitize the clone (in-place)
    try { await sanitizeClone(clone); } catch (e) {}

    const rect = (innerContainer || clone)!.getBoundingClientRect();
    try {
      const fixedW = Math.max(1, Math.ceil(rect.width));
      const fixedH = Math.max(1, Math.ceil(rect.height));
      wrapper.style.width = `${fixedW}px`;
      wrapper.style.height = `${fixedH}px`;
      wrapper.style.overflow = 'hidden';
      wrapper.style.display = 'block';
      clone.style.width = '100%';
      clone.style.height = 'auto';
      clone.style.boxSizing = 'border-box';
      clone.style.margin = '0';
      clone.style.position = 'relative';
    } catch (e) {}
    try { console.log('[dutchpay:pdf] clone boundingRect', rect); } catch (e) {}
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    let canvas: HTMLCanvasElement | null = null;

    // Try iframe capture using builder
    try {
      const cloneHtml = (innerContainer || clone)!.outerHTML;
      const srcdoc = buildIframeSrcdoc(cloneHtml, receiptId, fixedWidth);
      const iframe = appendHiddenIframe(srcdoc, width, height);

      await new Promise<void>((resolve) => {
        let done = false;
        const onLoad = () => { if (!done) { done = true; resolve(); } };
        iframe.addEventListener('load', onLoad);
        setTimeout(() => onLoad(), 2500);
      });

      try {
        const idoc = (iframe.contentDocument || iframe.contentWindow?.document) as Document | null;
        if (idoc) {
          try {
            const imgs = Array.from(idoc.querySelectorAll('img')) as HTMLImageElement[];
            await Promise.all(imgs.map(img => new Promise<void>((res) => {
              if (!img.src) return res();
              if (img.complete) return res();
              const onEnd = () => { res(); img.removeEventListener('load', onEnd); img.removeEventListener('error', onEnd); };
              img.addEventListener('load', onEnd); img.addEventListener('error', onEnd);
            })));
          } catch (e) {}

          const target = idoc.getElementById(receiptId) as HTMLElement | null;
          if (target) {
            const trect = target.getBoundingClientRect();
            const tw = fixedWidth ? fixedWidth : Math.max(1, Math.ceil(trect.width));
            const th = Math.max(1, Math.ceil(trect.height));
            try {
              canvas = await captureElementWithHtml2Canvas(target as HTMLElement, {
                scale: 1,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: tw,
                height: th,
                windowWidth: tw,
                windowHeight: th,
                x: 0,
                y: 0,
              });
            } catch (e) {
              canvas = null;
            }
          }
        }
      } finally {
        try { iframe.remove(); } catch (e) {}
      }
    } catch (err) {
      console.warn('[dutchpay:pdf] iframe capture flow failed', err);
      canvas = null;
    }

    // Fallback: capture clone directly
    if (!canvas) {
      try {
        const captureTarget = (innerContainer || clone) as HTMLElement;
        canvas = await captureElementWithHtml2Canvas(captureTarget as HTMLElement, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff',
          width,
          height,
          windowWidth: width,
          windowHeight: height,
          x: 0,
          y: 0,
          scrollX,
          scrollY,
        });
      } catch (e) {
        throw e;
      }
    }

    if (!canvas) throw new Error('PDF capture failed - no canvas produced');
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const marginMm = 20; const marginPt = marginMm * 72 / 25.4;
    const availableWidth = Math.max(1, pdfWidth - (marginPt * 2));
    const availableHeight = Math.max(1, pdfPageHeight - (marginPt * 2));
    const imgProps: any = (pdf as any).getImageProperties ? (pdf as any).getImageProperties(imgData) : { width: canvas.width, height: canvas.height };
    const imgWidthPx = imgProps.width;
    const imgHeightPx = imgProps.height;
    const aspect = imgHeightPx / imgWidthPx;
    let renderW = availableWidth;
    let renderH = renderW * aspect;
    if (renderH > availableHeight) {
      renderH = availableHeight;
      renderW = renderH / aspect;
    }
    const offsetX = (pdfWidth - renderW) / 2;
    const offsetY = marginPt;
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderW, renderH);

    try {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      try { const { safeOpen } = await import('@/lib/safeOpen'); safeOpen(url); } catch (e) { window.open(url, '_blank'); }
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);
      try { wrapper.remove(); } catch (e) {}
      try { st.showToast('새 탭에서 PDF가 열렸습니다.'); } catch (e) {}
    } catch (e) {
      try { pdf.save('receipt.pdf'); try { st.showToast('PDF 저장을 완료했습니다.'); } catch (e) {} } catch (ee) { console.warn('pdf open/save failed', ee); }
      try { wrapper.remove(); } catch (ee) {}
    }
  } catch (err) {
    try { console.error('[dutchpay:pdf] html2canvas/jsPDF capture failed', err); } catch (e) {}
    try {
      let contentElLocal: HTMLElement | null = null;
      try {
        contentElLocal = (wrapper && wrapper.querySelector && (wrapper.querySelector(`#${receiptId}`) as HTMLElement)) || clone || document.getElementById(receiptId) as HTMLElement | null;
      } catch (e) { contentElLocal = clone || document.getElementById(receiptId) as HTMLElement | null; }
      if (contentElLocal) {
        const win = window.open('', '_blank');
        if (win) {
          const head = document.head ? document.head.cloneNode(true) : null;
          const safePrintCss = `<style>html,body{background:#fff;color:#000;margin:0;padding:20px} *{box-shadow:none !important; background-image:none !important;}</style>`;
          const html = `<!doctype html><html><head>${head ? (head as any).innerHTML : ''}${safePrintCss}</head><body>${(contentElLocal && contentElLocal.outerHTML) || ''}</body></html>`;
          try { win.document.write(html); win.document.close(); win.focus(); win.print(); try { st.showToast('브라우저 인쇄 창을 열었습니다. 프린터로 저장해 보세요.'); } catch (e) {} } catch (e) { try { st.showToast('PDF 생성에 실패했습니다. 브라우저 인쇄를 시도하세요.'); } catch (ee) {} }
          try { if (wrapper && wrapper.remove) wrapper.remove(); } catch (e) {}
        } else {
          try { st.showToast('PDF 생성에 실패했습니다. 브라우저 인쇄를 시도하세요. (팝업 차단 가능)'); } catch (e) {}
        }
      } else {
        try { st.showToast('PDF 생성에 실패했습니다. 브라우저 인쇄를 시도하세요.'); } catch (e) {}
      }
    } catch (e) { try { st.showToast('PDF 생성에 실패했습니다. 브라우저 인쇄를 시도하세요.'); } catch (ee) {} }
  }
}
