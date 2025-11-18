"use client";

import React from "react";
import { Button, Input, Label, Card, CardContent, Select } from "@/components/ui";
import { SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/DatePicker";
import useDutchPayStore from "@/store/useDutchPayStore";
import { encodePayload } from "@/lib/encoding";
import { Twitter, Facebook, Copy } from 'lucide-react';

export default function ReceiptForm() {
  const title = useDutchPayStore((s) => s.title);
  const setTitle = useDutchPayStore((s) => s.setTitle);
  const periodFrom = useDutchPayStore((s) => s.periodFrom);
  const setPeriodFrom = useDutchPayStore((s) => s.setPeriodFrom);
  const periodTo = useDutchPayStore((s) => s.periodTo);
  const setPeriodTo = useDutchPayStore((s) => s.setPeriodTo);
  const total = useDutchPayStore((s) => s.total);
  const setTotal = useDutchPayStore((s) => s.setTotal);
  const participants = useDutchPayStore((s) => s.participants);
  const addParticipant = useDutchPayStore((s) => s.addParticipant);
  const removeParticipant = useDutchPayStore((s) => s.removeParticipant);
  const updateParticipantName = useDutchPayStore((s) => s.updateParticipantName);
  const updateParticipantDeduction = useDutchPayStore((s) => s.updateParticipantDeduction);
  const accountBank = useDutchPayStore((s) => s.accountBank);
  const setAccountBank = useDutchPayStore((s) => s.setAccountBank);
  const accountNumber = useDutchPayStore((s) => s.accountNumber);
  const setAccountNumber = useDutchPayStore((s) => s.setAccountNumber);
  const detailItems = useDutchPayStore((s) => s.detailItems);
  const addDetailItem = useDutchPayStore((s) => s.addDetailItem);
  const updateDetailItem = useDutchPayStore((s) => s.updateDetailItem);
  const removeDetailItem = useDutchPayStore((s) => s.removeDetailItem);
  const setDetailItems = useDutchPayStore((s) => s.setDetailItems);
  const setLink = useDutchPayStore((s) => s.setLink);
  const link = useDutchPayStore((s) => s.link);
  const linkInputRef = React.useRef<HTMLInputElement | null>(null);
  const showToast = useDutchPayStore((s) => s.showToast);

  // expose lightweight window API so header actions can synchronously read/reset the form
  React.useEffect(() => {
    try {
      const w = window as any;
      if (!w.dutchpay) w.dutchpay = {};
      w.dutchpay.getFormState = () => ({
        title,
        periodFrom,
        periodTo,
        total,
        participants,
        accountBank,
        accountNumber,
        detailItems,
      });
      w.dutchpay.resetForm = () => {
        try {
          useDutchPayStore.getState().resetAll();
        } catch (e) {}
      };
      w.dutchpay.showToast = (msg: string, duration = 2000) => {
        try { showToast(msg, duration); } catch (e) {}
      };
      return () => {
        try {
          if (w.dutchpay) {
            delete w.dutchpay.getFormState;
            delete w.dutchpay.resetForm;
            delete w.dutchpay.showToast;
          }
        } catch (e) {}
      };
    } catch (e) {
      // ignore in non-browser envs
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, periodFrom, periodTo, total, participants, accountBank, accountNumber, detailItems]);

  // 자동 합계: 세부 항목이 있을 때 세부 항목의 금액 합계를 총액으로 반영
  React.useEffect(() => {
    try {
      if (detailItems && detailItems.length > 0) {
        const sum = detailItems.reduce((acc: number, it: any) => {
          const n = typeof it.amount === 'number' ? it.amount : (it.amount === '' ? 0 : Number(it.amount || 0));
          return acc + (Number.isNaN(n) ? 0 : n);
        }, 0);
        if (sum !== (typeof total === 'number' ? total : (total === '' ? 0 : Number(total)))) {
          setTotal(sum);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [detailItems]);


  function validateAccountNumber(num: string): boolean {
    if (!num) return true;
    const ok = /^\d+$/.test(num);
    return ok;
  }

  function addParticipantClicked() { addParticipant(); }

  function addDetailItemClicked() { addDetailItem(); }

  async function createLink() {
    const totalNum = Number(total) || 0;
    const n = participants.length;
    let computedParticipants = participants.map((p) => ({ id: p.id, name: p.name }));
    if (n > 0) {
      const base = Math.floor(totalNum / n);
      let rem = totalNum - base * n;
      computedParticipants = participants.map((p) => {
        const extra = rem > 0 ? 1 : 0;
        if (rem > 0) rem -= 1;
        return { id: p.id, name: p.name, share: base + extra };
      });
    }

    const payloadBase: any = {
      title: title || '제목',
      total: totalNum,
      period: { from: periodFrom || null, to: periodTo || null },
      currency: "KRW",
      participants: computedParticipants,
      detailItems: detailItems.map((d: any) => ({ id: d.id, title: d.title, amount: d.amount === '' ? 0 : Number(d.amount) })),
    };

    if (accountBank || accountNumber) payloadBase.account = { bank: accountBank || null, number: accountNumber || null };

    const encoded = encodePayload(payloadBase);
    const WARN_LEN = 3000; const BLOCK_LEN = 8000;

    if (encoded.length > WARN_LEN) {
      try {
        const serverPayload = { ...payloadBase }; delete serverPayload.detailItems;
        const res = await fetch('/api/payload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serverPayload) });
                    if (res.ok) {
                      const json = await res.json(); const id = json.id;
                      const url = `${location.protocol}//${location.host}${location.pathname}?id=${encodeURIComponent(id)}`;
                      setLink(url);
                      // focus/select the generated link input
                      setTimeout(() => { try { linkInputRef.current?.select(); } catch (e) {} }, 80);
                      return;
                    }
      } catch (e) { console.warn('server store failed, falling back to data-url', e); }
    }

    const url = `${location.protocol}//${location.host}${location.pathname}?p=${encoded}`;
    setLink(url);
    // focus/select the generated link input
    setTimeout(() => { try { linkInputRef.current?.select(); } catch (e) {} }, 80);
    if (encoded.length > BLOCK_LEN) {
      const confirmMsg = `생성된 링크가 매우 깁니다(${encoded.length} chars). 이 링크는 일부 환경에서 열리지 않을 수 있습니다. 계속해서 링크를 생성하시겠습니까?`;
      const proceed = confirm(confirmMsg);
      if (!proceed) {
        return;
      }
      alert('링크가 매우 깁니다. 복사해서 새 탭에서 여시길 권장합니다.');
      return;
    }
    if (encoded.length > WARN_LEN) alert('생성된 링크가 큽니다. 다른 브라우저나 환경에서 열 때 잘리지 않는지 확인하세요.');
  }

  async function copyLink() {
    let base = link || (window.location && window.location.href) || '';
    if (!base) return;
    let viewerLink = base;
    try {
      const url = new URL(base);
      if (!url.searchParams.get('view')) url.searchParams.set('view', '1');
      viewerLink = url.toString();
    } catch (e) {
      viewerLink = base.includes('?') ? `${base}&view=1` : `${base}?view=1`;
    }
    try { await navigator.clipboard.writeText(viewerLink); showToast('뷰어 모드 링크가 복사되었습니다.'); } catch (e) { console.warn('clipboard write failed', e); alert('링크 복사에 실패했습니다.'); }
  }

  return (
    <div className=" min-w-0 md:mt-0 sm:mt-2">
      <style>{`@media (max-width: 320px) { .hide-320 { display: none; } }`}</style>
      <Card>
        <CardContent>
          <div className="space-y-4 space-x-2">
            <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0">
                <Label className="block mb-2 font-semibold">제목</Label>
                <Input value={title} placeholder={'제목을 입력하세요'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
            </div>

            <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0">
                <Label className="block mb-2 font-semibold">기간</Label>
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1"><DatePicker id="period-from" value={periodFrom} onChange={(s) => setPeriodFrom(s)} /></div>
                    <div className="flex-1"><DatePicker id="period-to" value={periodTo} onChange={(s) => setPeriodTo(s)} /></div>
                </div>
            </div>

            <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0">
                <Label className="block mb-2 font-semibold">계좌 정보</Label>
                <div className="flex items-start gap-2">
                    <div className="flex gap-2 flex-1">
                    <Select value={accountBank} onValueChange={(v: string) => setAccountBank(v === "none" ? "" : v)}>
                        <SelectTrigger className="min-w-max"><SelectValue placeholder={'계좌 정보'} /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">계좌 정보</SelectItem>
                        <SelectItem value="국민은행">국민은행</SelectItem>
                        <SelectItem value="신한은행">신한은행</SelectItem>
                        <SelectItem value="우리은행">우리은행</SelectItem>
                        <SelectItem value="하나은행">하나은행</SelectItem>
                        <SelectItem value="기업은행">기업은행</SelectItem>
                        <SelectItem value="농협">농협</SelectItem>
                        <SelectItem value="카카오뱅크">카카오뱅크</SelectItem>
                        <SelectItem value="케이뱅크">케이뱅크</SelectItem>
                        <SelectItem value="토스뱅크">토스뱅크</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input placeholder={'계좌번호 - 숫자만 입력'} inputMode="numeric" value={accountNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const digits = e.target.value.replace(/\D/g, ''); setAccountNumber(digits); validateAccountNumber(digits); }} />
                    </div>
                </div>
            </div>

            <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0">
              <Label className="block mb-2 font-semibold">총액 (숫자)</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input className="flex-1" type="number" placeholder={'총액 (숫자)'} value={total as any} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  if (detailItems.length > 0) {
                    const proceed = confirm('세부 항목이 초기화됩니다. 계속하시겠습니까?');
                    if (!proceed) return; setDetailItems([]); showToast('세부 항목이 초기화되었습니다. 총액으로 대체됩니다.');
                  }
                  setTotal(digits === '' ? '' : Number(digits));
                }} />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="text-lg">▾</span>
                    <span>{'세부 항목'}</span>
                </div>
                <div><Button size="sm" className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600" onClick={addDetailItemClicked}>항목 추가</Button></div>
              </div>

              {detailItems.length === 0 && (
                <div className="text-sm text-slate-500">'항목 추가'를 눌러 항목을 추가하세요.<br/>세부 항목이 없을 시에는 총액 필드에 작성.<br/>두가지를 동시 사용 불가능</div>
              )}
              {detailItems.map((it: any) => (
                <div key={it.id} className="flex items-center gap-2 mt-2 w-full">
                  <Input className="w-full sm:w-80 flex-1" placeholder={'제목'} value={it.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDetailItem(it.id, 'title', e.target.value)} />
                  <Input
                    className="w-full sm:w-40 flex-1"
                    placeholder={'금액'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={String(it.amount ?? '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const raw = e.target.value || '';
                      const digits = raw.replace(/\D/g, '');
                      updateDetailItem(it.id, 'amount', digits === '' ? '' : digits);

                      try {
                        // compute new sum locally and set immediately to avoid race
                        const newItems = detailItems.map((di: any) => (di.id === it.id ? { ...di, amount: digits === '' ? '' : digits } : di));
                        const sum = newItems.reduce((acc: number, it2: any) => {
                          const n = typeof it2.amount === 'number' ? it2.amount : (it2.amount === '' ? 0 : Number(it2.amount || 0));
                          return acc + (Number.isNaN(n) ? 0 : n);
                        }, 0);
                        setTotal(sum);
                      } catch (e) {
                        // ignore
                      }
                    }}
                  />
                  <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => removeDetailItem(it.id)}>{'삭제'}</Button>
                </div>
              ))}
              </div>

              <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0 mt-4">
                <div className="flex justify-between items-center">
                  <Label className="block font-semibold">참여자</Label>
                  <div><Button size="sm" className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600" onClick={addParticipantClicked}>{'참여자 추가'}</Button></div>
                </div>
                <div className="space-y-2 mt-2">
                  {participants.map((pt) => (
                    <div key={pt.id} className="flex items-center gap-2">
                      <Input className="flex-1" value={pt.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateParticipantName(pt.id, e.target.value)} placeholder={'이름'} />
                      <Input className="w-28" placeholder={'차감금액'} inputMode="numeric" value={pt.deduction ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const digits = e.target.value.replace(/\D/g, ''); updateParticipantDeduction(pt.id, digits === '' ? '' : Number(digits)); }} />
                      <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => removeParticipant(pt.id)}>{'삭제'}</Button>
                    </div>
                  ))}
                </div>
              </div>
                  
                <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0 mt-4">
                    <div className="flex justify-end pb-4 border-b border-dashed border-slate-200 last:border-0 items-center gap-3 mt-4">
                        <Button onClick={createLink} className="bg-blue-700 text-white hover:bg-blue-600">링크 생성</Button>
                    </div>

                    <div className="mt-4">
                      {link ? (
                        <div className="w-full text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-full max-w-xl">
                              <input ref={linkInputRef} readOnly value={link || ''} className="w-full border rounded px-2 py-1 text-sm" aria-label="generated-link" />
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Twitter */}
                              <button type="button" aria-label="트위터로 공유" onClick={async () => { if (!link) { alert('링크가 생성되어야 공유할 수 있습니다.'); return; } const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent((title || '더치페이') + ' — ')}&url=${encodeURIComponent(link)}`; try { const { safeOpen } = await import('@/lib/safeOpen'); safeOpen(tw); } catch (e) { window.open(tw, '_blank'); } }} className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300">
                                <Twitter className="w-5 h-5" />
                              </button>

                              {/* Facebook */}
                              <button type="button" aria-label="페이스북으로 공유" onClick={async () => { if (!link) { alert('링크가 생성되어야 공유할 수 있습니다.'); return; } const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`; try { const { safeOpen } = await import('@/lib/safeOpen'); safeOpen(fb); } catch (e) { window.open(fb, '_blank'); } }} className="w-10 h-10 flex items-center justify-center rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300">
                                <Facebook className="w-5 h-5" />
                              </button>

                              <button type="button" aria-label="링크 복사" onClick={copyLink} className="flex items-center gap-2 h-10 px-3 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300">
                                <Copy className="w-4 h-4" />
                                <span className="hide-320">{'링크 복사'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">링크 생성 후에 이곳에 표시됩니다.</div>
                      )}
                    </div>
                </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
