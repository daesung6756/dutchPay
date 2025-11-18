"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import useDutchPayStore from "@/store/useDutchPayStore";

export default function Receipt() {
  const title = useDutchPayStore((s) => s.title);
  const periodFrom = useDutchPayStore((s) => s.periodFrom);
  const periodTo = useDutchPayStore((s) => s.periodTo);
  const total = useDutchPayStore((s) => s.total);
  const detailItems = useDutchPayStore((s) => s.detailItems);
  const participants = useDutchPayStore((s) => s.participants);
  const accountBank = useDutchPayStore((s) => s.accountBank);
  const accountNumber = useDutchPayStore((s) => s.accountNumber);
  const showToast = useDutchPayStore((s) => s.showToast);

  function formatDateWithWeekday(dateStr: string): string {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d);
      return `${dateStr} (${weekday})`;
    } catch (e) {
      return dateStr;
    }
  }

  function maskLastChar(name?: string) {
    if (!name) return name || '';
    try {
      const s = String(name);
      let last = -1;
      for (let i = s.length - 1; i >= 0; i--) {
        if (s[i] !== ' ' && s[i] !== '\t' && s[i] !== '\n') { last = i; break; }
      }
      if (last === -1) return s;
      if (last === 0) return '*' + s.slice(1);
      return s.slice(0, last) + '*' + s.slice(last + 1);
    } catch (e) {
      return name || '';
    }
  }

  async function copyAccount() {
    const txt = accountNumber ? `${accountNumber}` : "";
    if (!txt) {
      showToast('복사할 계좌 정보가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(txt);
      showToast('계좌번호가 복사되었습니다.');
    } catch (e) {
      console.warn("clipboard write failed", e);
      showToast('복사에 실패했습니다.');
    }
  }

  return (
    <div className="min-w-0">
      <Card id="receipt">
          <CardHeader>
          <CardTitle className="mb-2 border-b border-dashed border-slate-200 pb-2 no-print">{title || '더치페이'}</CardTitle>
          {(periodFrom || periodTo) && (
            <div className="mt-1 text-sm text-slate-600 border-b border-dashed border-slate-200 pb-4 no-print">기간: {formatDateWithWeekday(periodFrom)}{periodFrom && periodTo ? ' – ' : ''}{formatDateWithWeekday(periodTo)}</div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-slate-600 border-b border-dashed border-slate-200 pb-4">
                <span>{'총액'}: </span>
                <span>
                  <span className="text-2xl font-bold text-slate-800">{Number(total || 0).toLocaleString()}</span>
                  <span>{'원'}</span>
                </span>
              </div>

              {detailItems.length > 0 && (
                <div className="mt-3 border-b border-dashed border-slate-200 pb-4">
                  <div className="text-xs text-slate-500 mb-1">{'세부 항목'}</div>
                  <div className="space-y-1">
                    {detailItems.map((di) => (
                      <div key={di.id} className="flex items-center justify-between text-sm">
                          <div className="truncate text-slate-700 mr-2">{di.title || '항목'}</div>
                          <div className="text-slate-600">
                            <span className="text-lg font-normal text-slate-800">{(typeof di.amount === 'number' ? di.amount : (di.amount === '' ? 0 : Number(di.amount))).toLocaleString()}</span>
                            <span className="ml-1">원</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 space-y-1 border-b border-dashed border-slate-200 pb-4">
                {participants.map((p) => {
                  const shareNum = typeof p.share === 'number' ? p.share : 0;
                  const ded = typeof p.deduction === 'number' ? p.deduction : (p.deduction === '' || p.deduction == null ? 0 : Number(p.deduction));
                  const finalAmount = Math.max(0, shareNum - (Number.isFinite(ded) ? ded : 0));
                  return (
                    <div key={p.id} className="flex justify-between text-sm items-center">
                      <div className="font-medium">{maskLastChar(p.name) || '참여자'}</div>
                        <div className="text-slate-600 flex items-center gap-2">
                        {ded > 0 && (
                          <span className="text-red-600">차감금액: <span className="text-red-600 font-normal">{ded.toLocaleString()}</span><span className="ml-1">원</span></span>
                        )}
                        <span className="text-lg font-normal text-slate-800">{finalAmount.toLocaleString()}</span>
                        <span className="ml-1">원</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(accountBank || accountNumber) && (
                <div className="mt-3 flex justify-between items-center border-b border-dashed border-slate-200 pb-4">
                    <div className="mt-1 text-sm text-slate-600">
                    <div className="mb-1">{'은행'}: {accountBank ? accountBank + ' ' : ''} </div>
                    <div>{'계좌 번호'}: {accountNumber}</div>
                  </div>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300" onClick={copyAccount}>{'계좌 복사'}</Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
