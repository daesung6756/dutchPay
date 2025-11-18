"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import Skeleton from "@/components/ui/skeleton";
import useDutchPayStore, { DutchPayState } from "@/store/useDutchPayStore";
import { useRouter } from 'next/navigation';

type HeaderProps = {
  title?: string;
  right?: React.ReactNode;
  className?: string;
  onSavePDF?: () => void;
  onSaveTemp?: () => void;
  onClearAll?: () => void;
};

export default function Header({
  title,
  right,
  className = "",
  onSavePDF,
  onSaveTemp,
  onClearAll,
}: HeaderProps) {
  const router = useRouter();

  const loading = useDutchPayStore((s: DutchPayState) => s.loading);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    setReady(!loading);
  }, [loading]);

  const handleSavePDF = async () => {
    const st = useDutchPayStore.getState();
    const receiptId = 'receipt';
    const el = document.getElementById(receiptId);
    if (!el) {
      try { window.print(); } catch (e) {}
      try { st.showToast('영수증 영역을 인쇄합니다.'); } catch (e) {}
      return;
    }

    try {
      const html2canvasMod = await import('html2canvas');
      const html2canvas = (html2canvasMod && (html2canvasMod as any).default) || html2canvasMod;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps: any = (pdf as any).getImageProperties ? (pdf as any).getImageProperties(imgData) : { width: canvas.width, height: canvas.height };
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      try {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
          try { const { safeOpen } = await import('@/lib/safeOpen'); safeOpen(url); } catch (e) { window.open(url, '_blank'); }
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);
        try { st.showToast('새 탭에서 PDF가 열렸습니다.'); } catch (e) {}
      } catch (e) {
        try { pdf.save('receipt.pdf'); try { st.showToast('PDF 저장을 완료했습니다.'); } catch (e) {} } catch (ee) { console.warn('pdf open/save failed', ee); }
      }
    } catch (err) {
      console.warn('html2canvas/jsPDF capture failed, falling back to print', err);
      try { window.print(); } catch (e) { console.warn('print failed', e); }
    }
  };

  const handleSaveTemp = () => {
    // defer to avoid racing with in-flight input updates
    setTimeout(() => {
      const st = useDutchPayStore.getState();
      try {
        const payload: any = {
          title: typeof st.title === 'string' ? st.title : '',
          period: { from: st.periodFrom || null, to: st.periodTo || null },
          total: typeof st.total === 'number' ? st.total : (st.total === '' ? 0 : Number(st.total || 0)),
          participants: Array.isArray(st.participants) ? st.participants.map((p: any) => ({ id: p.id, name: p.name })) : [],
          detailItems: Array.isArray(st.detailItems) ? st.detailItems.map((d: any) => ({ id: d.id, title: d.title, amount: d.amount })) : [],
          account: st.accountNumber ? { bank: st.accountBank || null, number: st.accountNumber } : null,
          meta: { savedAt: new Date().toISOString() },
        };

        console.log('[dutchpay] autosave payload:', payload);
        localStorage.setItem('dutchpay:autosave', JSON.stringify(payload));
        console.log('[dutchpay] autosave written');
        try { const raw = localStorage.getItem('dutchpay:autosave'); console.log('[dutchpay] autosave readback:', raw); } catch (e) {}
        st.showToast('임시 저장되었습니다.');
      } catch (err) {
        console.error('[dutchpay] localStorage write failed', err);
        st.showToast('임시 저장에 실패했습니다. 브라우저 설정을 확인하세요.');
      }
    }, 0);
  };

  const handleClearAll = () => {
    try {
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
      setTimeout(removeMatchingKeys, 50);

      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          let changed = false;
          ['p','id','view'].forEach(k => { if (url.searchParams.has(k)) { url.searchParams.delete(k); changed = true; } });
          if (changed) router.replace(url.pathname + url.search + url.hash);
        }
      } catch (e) {}

      useDutchPayStore.getState().showToast('전체 초기화되었습니다.');
    } catch (e) {
      try { window.dispatchEvent(new CustomEvent('dutchpay:clear-request')); } catch (err) {}
    }
  };

  const showSkeleton = !onSavePDF && !onSaveTemp && !onClearAll && !ready;

  const renderButtons = () => (
    <>
      <span className="hidden sm:inline-flex">
        <Button size="sm" className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600" onClick={onSavePDF ?? handleSavePDF}>{'PDF 저장'}</Button>
      </span>
      <Button size="sm" className="bg-green-700 border border-slate-200 text-white hover:bg-green-600" onClick={onSaveTemp ?? handleSaveTemp}>{'임시 저장'}</Button>
      <Button size="sm" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={onClearAll ?? handleClearAll}>{'전체 초기화'}</Button>
    </>
  );

  return (
    <div className={`${className} p-4 w-full sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200`}> 
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between w-full items-start gap-2 sm:gap-0">
        <div className="min-w-0">
          {showSkeleton ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
            </div>
          ) : (
            <h1 className="text-2xl font-semibold truncate">{title}</h1>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center justify-end w-full">
          {right ? right : (showSkeleton ? <><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-28" /></> : renderButtons())}
        </div>
      </div>
    </div>
  );
}
