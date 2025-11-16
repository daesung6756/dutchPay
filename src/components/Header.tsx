"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import Skeleton from "@/components/ui/skeleton";
import { printWithToast } from "@/lib/dutchpayActions";
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
            onClick={() => {
              if (!printWithToast(window as any)) {
                try { window.print(); } catch (e) {}
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
    <div className={`${className} p-4`}>
      <div className="flex justify-between w-full items-end">
        <div>
          {showSkeleton ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{title}</h1>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {right ? right : showSkeleton ? (
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
