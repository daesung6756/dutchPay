"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import Skeleton from "@/components/ui/skeleton";
import useDutchPayStore, { DutchPayState } from "@/store/useDutchPayStore";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  onSavePDF?: () => void;
  onSaveTemp?: () => void;
  onClearAll?: () => void;
};

export default function Header({
  title = "Dutch-Pay",
  right,
  className = "",
  onSavePDF,
  onSaveTemp,
  onClearAll,
}: HeaderProps) {
  const renderButtons = () => {
    const w = typeof window !== 'undefined' ? (window as any) : undefined;
    return (
      <>
        {onSavePDF ? (
          <Button size="sm" className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600" onClick={onSavePDF}>PDF 저장</Button>
        ) : (
          <Button
            size="sm"
            className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600"
            onClick={async () => {
              const st = useDutchPayStore.getState();
              const receiptId = 'receipt';
              const el = document.getElementById(receiptId);
              if (!el) {
                try { window.print(); } catch (e) {}
                try { st.showToast('인쇄/저장 대화상자를 엽니다.'); } catch (e) {}
                return;
              }

              // Try to capture the element as a PDF using html2canvas + jsPDF to avoid browser headers/footers
              try {
                // @ts-ignore - optional dynamic import; package may not be installed in dev yet
                const html2canvasMod = await import('html2canvas');
                const html2canvas = (html2canvasMod && (html2canvasMod as any).default) || html2canvasMod;
                // @ts-ignore - optional dynamic import; package may not be installed in dev yet
                const { jsPDF } = await import('jspdf');

                const canvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');

                const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgProps: any = (pdf as any).getImageProperties ? (pdf as any).getImageProperties(imgData) : { width: canvas.width, height: canvas.height };
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                // Do NOT force download. Open PDF in a new tab so user can decide what to do.
                try {
                  const blob = pdf.output('blob');
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);
                  try { st.showToast('새 탭에서 PDF가 열렸습니다. 저장은 브라우저에서 선택하세요.'); } catch (e) {}
                } catch (e) {
                  // fallback to direct save if blob/open fails
                  try { pdf.save('receipt.pdf'); try { st.showToast('PDF 저장을 완료했습니다.'); } catch (e) {} } catch (ee) { console.warn('pdf open/save failed', ee); }
                }
                return;
              } catch (err) {
                console.warn('html2canvas/jsPDF capture failed, falling back to print', err);
                // Fallback: use print with receipt-only style (browser headers may appear)
                try {
                  const styleId = 'dutchpay-print-style';
                  const existing = document.getElementById(styleId) as HTMLStyleElement | null;
                  if (existing) existing.remove();
                  const style = document.createElement('style');
                  style.id = styleId;
                  style.innerHTML = `@media print { body * { visibility: hidden !important; } #${receiptId}, #${receiptId} * { visibility: visible !important; } #${receiptId} { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; } #${receiptId} .no-print { display: none !important; visibility: hidden !important; } }`;
                  document.head.appendChild(style);
                  try { window.print(); } catch (e) { console.warn('print failed', e); }
                  setTimeout(() => { try { const s = document.getElementById(styleId); if (s) s.remove(); } catch (e) {} }, 1000);
                  try { st.showToast('영수증 영역을 인쇄합니다.'); } catch (e) {}
                } catch (e) {
                  try { window.print(); } catch (e) {}
                }
              }
            }}
          >
            PDF 저장
          </Button>
        )}

        {onSaveTemp ? (
          <Button size="sm" className="bg-green-700 border border-slate-200 text-white hover:bg-green-600" onClick={onSaveTemp}>임시 저장</Button>
        ) : (
          <Button
            size="sm"
            className="bg-green-700 border border-slate-200 text-white hover:bg-green-600"
            onClick={() => {
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
                localStorage.setItem('dutchpay:autosave', JSON.stringify(payload));
                st.showToast('임시 저장되었습니다.');
              } catch (e) {
                try { window.dispatchEvent(new CustomEvent('dutchpay:save-request')); } catch (err) {}
              }
            }}
          >
            임시 저장
          </Button>
        )}

        {onClearAll ? (
          <Button size="sm" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={onClearAll}>전체 초기화</Button>
        ) : (
          <Button
            size="sm"
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              try {
                const st = useDutchPayStore.getState();
                localStorage.removeItem('dutchpay:autosave');
                st.resetAll();
                st.showToast('전체 초기화되었습니다.');
              } catch (e) {
                try { window.dispatchEvent(new CustomEvent('dutchpay:clear-request')); } catch (err) {}
              }
            }}
          >
            전체 초기화
          </Button>
        )}
      </>
    );
  };

  const loading = useDutchPayStore((s: DutchPayState) => s.loading);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    // show skeleton until the store indicates loading=false
    setReady(!loading);
  }, [loading]);

  const showSkeleton = !onSavePDF && !onSaveTemp && !onClearAll && !ready;

  return (
    <div className={`${className} p-4 w-full sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200`}> 
      {/* Make header flexible and wrap for very small screens (down to ~280px) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between w-full items-start gap-2 sm:gap-0">
        <div className="min-w-0">
          {showSkeleton ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold truncate">{title}</h1>
            </>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center justify-end">
          {right ? (
            right
          ) : showSkeleton ? (
            <>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-28" />
            </>
          ) : (
            renderButtons()
          )}
        </div>
      </div>
    </div>
  );
}
