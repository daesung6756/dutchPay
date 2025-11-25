"use client";

export function buildIframeSrcdoc(cloneHtml: string, receiptId: string, fixedWidth?: number) {
  const replaceLabFns = (s: string) => s ? s.replace(/(lab|lch|color)\([^)]*\)/gi, 'transparent') : s;

  let headContent = '';
  try {
    try { headContent += `<base href="${location.href}">`; } catch (e) {}
    try {
      const links = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      links.forEach(l => {
        try {
          const href = l.href; if (!href) return;
          headContent += `<link rel="stylesheet" href="${href}"${l.crossOrigin ? ` crossorigin="${l.crossOrigin}"` : ''}${l.media ? ` media="${l.media}"` : ''}>`;
        } catch (e) {}
      });
    } catch (e) {}
    try {
      const styles = Array.from(document.head.querySelectorAll('style')) as HTMLStyleElement[];
      styles.forEach(s => {
        try { const txt = s.textContent || ''; headContent += `<style>${replaceLabFns(txt)}</style>`; } catch (e) {}
      });
    } catch (e) {}
  } catch (e) {}

  const safePrintCss = `<style>html,body{background:#fff;color:#000;margin:0;padding:0} #${receiptId}{box-sizing:border-box;}</style>`;
  const content = fixedWidth ? `<div style="width:${fixedWidth}px;box-sizing:border-box">${cloneHtml}</div>` : cloneHtml;
  return `<!doctype html><html><head>${headContent}${safePrintCss}</head><body>${content}</body></html>`;
}

export function appendHiddenIframe(srcdoc: string, width: number, height: number) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '0px';
  iframe.style.top = '0px';
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.id = 'dutchpay-receipt-iframe';
  iframe.srcdoc = srcdoc;
  document.body.appendChild(iframe);
  return iframe;
}
