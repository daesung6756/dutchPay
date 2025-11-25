"use client";

export async function sanitizeClone(clone: HTMLElement) {
  try {
    // Preserve card-title and '기간' text, hide other .no-print
    try {
      clone.querySelectorAll('.no-print').forEach((n) => {
        try {
          const el = n as HTMLElement;
          const slot = el.getAttribute && el.getAttribute('data-slot');
          const text = (el.textContent || '').trim();
          const shouldPreserve = slot === 'card-title' || /기간/.test(text);
          if (shouldPreserve) {
            try { el.style.setProperty('display', 'block', 'important'); } catch (e) { el.style.display = 'block'; }
            return;
          }
          if (n && (n as HTMLElement).style) (n as HTMLElement).style.display = 'none';
        } catch (ee) {}
      });
    } catch (e) {}

    // Add wrapper-safe resets are applied by caller; perform color normalizations
    const all = Array.from(clone.querySelectorAll('*')) as HTMLElement[];

    const colorToRgba = (colorStr: string) => {
      try {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        const ctx = c.getContext('2d');
        if (!ctx) return null;
        try { ctx.fillStyle = colorStr; } catch (e) { return null; }
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${Number((d[3] / 255).toFixed(3))})`;
      } catch (e) { return null; }
    };

    const replaceEmbeddedColorFns = (val: string) => {
      try {
        return val.replace(/(lab|lch|color)\([^)]+\)/g, (m) => {
          const r = colorToRgba(m);
          return r || 'transparent';
        });
      } catch (e) { return val; }
    };

    for (const n of all) {
      try {
        const cs = window.getComputedStyle(n);
        if (cs) {
          if (cs.position === 'fixed' || cs.position === 'sticky') n.style.position = 'static';
          if (cs.transform && cs.transform !== 'none') n.style.transform = 'none';
          if (cs.margin) n.style.margin = '0';
        }

        n.style.boxSizing = 'border-box';

        const propsToFix = ['color','background-color','background','border-top-color','border-right-color','border-bottom-color','border-left-color','box-shadow','outline-color','fill','stroke'];
        for (const prop of propsToFix) {
          try {
            const raw = (window.getComputedStyle(n) as CSSStyleDeclaration).getPropertyValue(prop) || '';
            if (!raw) continue;
            if (/\b(?:lab|lch|color)\(/i.test(raw)) {
              if (prop === 'box-shadow') {
                const replaced = replaceEmbeddedColorFns(raw);
                if (/\b(?:lab|lch)\(/i.test(replaced)) {
                  (n.style as any).boxShadow = 'none';
                } else {
                  (n.style as any).boxShadow = replaced;
                }
              } else {
                const replaced = replaceEmbeddedColorFns(raw);
                if (/\b(?:lab|lch|color)\(/i.test(replaced)) {
                  n.style.setProperty(prop, 'transparent', 'important');
                } else {
                  n.style.setProperty(prop, replaced, 'important');
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    // Ensure title/period ancestors visible
    try {
      const maybeTitle = clone.querySelector('[data-slot="card-title"]') as HTMLElement | null;
      const maybePeriod = Array.from(clone.querySelectorAll('*')).find(n => (n.textContent || '').includes('기간')) as HTMLElement | undefined || null;
      const ensureVisible = (el: HTMLElement | null) => {
        if (!el) return;
        try {
          let cur: HTMLElement | null = el;
          while (cur && cur !== clone && cur.parentElement) {
            try {
              cur.style.setProperty('display', 'block', 'important');
              cur.style.setProperty('visibility', 'visible', 'important');
              cur.style.setProperty('opacity', '1', 'important');
              cur = cur.parentElement as HTMLElement;
            } catch (e) { break; }
          }
        } catch (e) {}
      };
      ensureVisible(maybeTitle);
      ensureVisible(maybePeriod);
    } catch (e) {}

    // Inline computed styles
    const inlineComputedStyles = (root: HTMLElement) => {
      try {
        const nodes = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
        for (const n of nodes) {
          try {
            const cs = window.getComputedStyle(n as Element);
            for (let i = 0; i < cs.length; i++) {
              const prop = cs[i];
              try {
                const val = cs.getPropertyValue(prop);
                if (val) n.style.setProperty(prop, val, 'important');
              } catch (e) {}
            }
          } catch (e) {}
        }
      } catch (e) {}
    };

    try { inlineComputedStyles(clone); } catch (e) {}

    // sanitize inline style attributes and pseudo-elements
    const sanitizeInlineStyles = (root: HTMLElement) => {
      try {
        const nodes = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
        let fixes = 0;
        for (const n of nodes) {
          try {
            const inline = n.getAttribute && n.getAttribute('style');
            if (inline && /\b(?:lab|lch|color)\(/i.test(inline)) {
              const replaced = inline.replace(/(lab|lch|color)\([^)]+\)/g, (m) => {
                const r = ((): string | null => {
                  try {
                    const c = document.createElement('canvas');
                    c.width = 1; c.height = 1;
                    const ctx = c.getContext('2d');
                    if (!ctx) return null;
                    try { ctx.fillStyle = m; } catch (e) { return null; }
                    ctx.fillRect(0, 0, 1, 1);
                    const d = ctx.getImageData(0, 0, 1, 1).data;
                    return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${Number((d[3] / 255).toFixed(3))})`;
                  } catch (e) { return null; }
                })();
                fixes++;
                return r || 'transparent';
              });
              try { n.setAttribute('style', replaced); } catch (e) { n.style.cssText = replaced; }
            }
            try {
              const before = window.getComputedStyle(n as Element, '::before');
              for (const prop of ['background','background-image','background-color','color','box-shadow']) {
                try {
                  const v = before.getPropertyValue(prop) || '';
                  if (v && /\b(?:lab|lch|color)\(/i.test(v)) {
                    n.style.setProperty(prop, 'transparent', 'important');
                    fixes++;
                  }
                } catch (e) {}
              }
            } catch (e) {}
            try {
              const after = window.getComputedStyle(n as Element, '::after');
              for (const prop of ['background','background-image','background-color','color','box-shadow']) {
                try {
                  const v = after.getPropertyValue(prop) || '';
                  if (v && /\b(?:lab|lch|color)\(/i.test(v)) {
                    n.style.setProperty(prop, 'transparent', 'important');
                    fixes++;
                  }
                } catch (e) {}
              }
            } catch (e) {}
          } catch (e) {}
        }
        try { if (fixes > 0) console.log('[dutchpay:pdf] sanitized inline styles, replacements:', fixes); } catch (e) {}
      } catch (e) {}
    };

    try { sanitizeInlineStyles(clone); } catch (e) {}

    const sanitizeAttributesAndStyles = (root: HTMLElement) => {
      try {
        let fixed = 0;
        const nodes = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
        const replaceFns = (s: string) => s.replace(/(lab|lch|color)\([^)]*\)/gi, (m) => {
          try {
            const c = document.createElement('canvas');
            c.width = 1; c.height = 1;
            const ctx = c.getContext('2d');
            if (!ctx) return 'transparent';
            try { ctx.fillStyle = m; } catch (e) { return 'transparent'; }
            ctx.fillRect(0, 0, 1, 1);
            const d = ctx.getImageData(0, 0, 1, 1).data;
            return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${Number((d[3] / 255).toFixed(3))})`;
          } catch (e) { return 'transparent'; }
        });

        for (const n of nodes) {
          try {
            for (let i = n.attributes.length - 1; i >= 0; i--) {
              try {
                const attr = n.attributes[i];
                if (!attr || !attr.value) continue;
                if (/\b(?:lab|lch|color)\(/i.test(attr.value)) {
                  const newVal = replaceFns(attr.value);
                  try { n.setAttribute(attr.name, newVal); } catch (e) { n.removeAttribute(attr.name); }
                  fixed++;
                }
              } catch (e) {}
            }

            if (n.tagName && n.tagName.toLowerCase() === 'style') {
              try {
                if (n.textContent && /\b(?:lab|lch|color)\(/i.test(n.textContent)) {
                  n.textContent = n.textContent.replace(/(lab|lch|color)\([^)]*\)/gi, 'transparent');
                  fixed++;
                }
              } catch (e) {}
            }
          } catch (e) {}
        }
        try { if (fixed > 0) console.log('[dutchpay:pdf] sanitized attributes/style tags replacements:', fixed); } catch (e) {}
      } catch (e) {}
    };

    try { sanitizeAttributesAndStyles(clone); } catch (e) {}

    const waitForImages = async (root: HTMLElement, timeout = 3000) => {
      try {
        const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
        await Promise.race([
          Promise.all(imgs.map(img => new Promise<void>((res) => {
            if (!img.src) return res();
            if (img.complete) return res();
            const onEnd = () => { res(); img.removeEventListener('load', onEnd); img.removeEventListener('error', onEnd); };
            img.addEventListener('load', onEnd); img.addEventListener('error', onEnd);
          }))),
          new Promise((res) => setTimeout(res, timeout)),
        ]);
      } catch (e) {}
    };

    try { await waitForImages(clone, 4000); } catch (e) {}
  } catch (e) {
    // swallow – sanitizer should not throw
  }
}

export default sanitizeClone;
