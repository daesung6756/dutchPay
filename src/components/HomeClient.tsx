"use client";

import React, { useEffect, useState, useRef } from "react";
import { encodePayload, decodePayload } from "@/lib/encoding";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Select } from "@/components/ui";
import DatePicker from "@/components/DatePicker";
import { SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import useDutchPayStore, { DutchPayState } from "@/store/useDutchPayStore";

type Participant = { id: string; name: string; share?: number };
type DetailItem = { id: string; title: string; amount: string };

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const title = useDutchPayStore((s: DutchPayState) => s.title);
  const setTitle = useDutchPayStore((s: DutchPayState) => s.setTitle);
  const periodFrom = useDutchPayStore((s: DutchPayState) => s.periodFrom);
  const setPeriodFrom = useDutchPayStore((s: DutchPayState) => s.setPeriodFrom);
  const periodTo = useDutchPayStore((s: DutchPayState) => s.periodTo);
  const setPeriodTo = useDutchPayStore((s: DutchPayState) => s.setPeriodTo);
  const total = useDutchPayStore((s: DutchPayState) => s.total);
  const setTotal = useDutchPayStore((s: DutchPayState) => s.setTotal);
  const participants = useDutchPayStore((s: DutchPayState) => s.participants);
  const setParticipants = useDutchPayStore((s: DutchPayState) => s.setParticipants);
  const link = useDutchPayStore((s: DutchPayState) => s.link);
  const setLink = useDutchPayStore((s: DutchPayState) => s.setLink);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const showForm = useDutchPayStore((s: DutchPayState) => s.showForm);
  const setShowForm = useDutchPayStore((s: DutchPayState) => s.setShowForm);
  const accountBank = useDutchPayStore((s: DutchPayState) => s.accountBank);
  const setAccountBank = useDutchPayStore((s: DutchPayState) => s.setAccountBank);
  const accountNumber = useDutchPayStore((s: DutchPayState) => s.accountNumber);
  const setAccountNumber = useDutchPayStore((s: DutchPayState) => s.setAccountNumber);
  const [accountError, setAccountError] = useState<string | null>(null);
  const detailOpen = useDutchPayStore((s: DutchPayState) => s.detailOpen);
  const setDetailOpen = useDutchPayStore((s: DutchPayState) => s.setDetailOpen);
  const detailItems = useDutchPayStore((s: DutchPayState) => s.detailItems);
  const setDetailItems = useDutchPayStore((s: DutchPayState) => s.setDetailItems);
  const loading = useDutchPayStore((s: DutchPayState) => s.loading);
  const setLoading = useDutchPayStore((s: DutchPayState) => s.setLoading);
  const toasts = useDutchPayStore((s: DutchPayState) => s.toasts);
  const showToast = useDutchPayStore((s: DutchPayState) => s.showToast);

  function getAccountString() {
    if (!accountNumber) return "";
    return `${accountNumber}`;
  }

  async function copyAccount() {
    const txt = getAccountString();
    if (!txt) {
      showToast("복사할 계좌 정보가 없습니다.");
      return;
    }
    try {
      await navigator.clipboard.writeText(txt);
      showToast("계좌번호가 복사되었습니다.");
    } catch (e) {
      console.warn("clipboard write failed", e);
      showToast("복사에 실패했습니다.");
    }
  }

  // legacy window-based API removed — store is used for global interactions

  // Clear any persisted or stale toasts on first mount to avoid showing toasts immediately
  useEffect(() => {
    try {
      useDutchPayStore.setState({ toasts: [] });
    } catch (e) {}
  }, []);

  function validateAccountNumber(num: string): boolean {
    if (!num) return true;
    const ok = /^\d+$/.test(num);
    setAccountError(ok ? null : "계좌번호는 숫자만 입력하세요.");
    return ok;
  }

  useEffect(() => {
    async function restoreFromParams() {
      setLoading(true);
      try {
        const p = searchParams.get("p");
        const viewParam = searchParams.get("view");
        if (viewParam === "1") setShowForm(false);

        if (p) {
          const data = decodePayload(p);
          if (data) {
            setTitle(data.title ?? "");
            setPeriodFrom(data.period?.from ?? "");
            setPeriodTo(data.period?.to ?? "");
            const acc = data.account ?? data.meta?.account;
            if (acc) {
              if (typeof acc === "string") {
                setAccountNumber(acc);
              } else if (typeof acc === "object") {
                setAccountBank(acc.bank ?? "");
                setAccountNumber(acc.number ?? acc.num ?? acc.account ?? "");
              }
            }
            setTotal((data.total ?? "") as number | "");
            if (Array.isArray(data.detailItems)) {
              setDetailItems(
                data.detailItems.map((di: any, i: number) => ({ id: di.id ?? `d${i + 1}`, title: di.title ?? "", amount: di.amount != null ? String(di.amount) : "" }))
              );
            }
            const parsed: Participant[] = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
            setParticipants(parsed);
            if (data.meta?.viewerOnly) setShowForm(false);
          }
        }

        const id = searchParams.get("id");
        if (id) {
          try {
            const res = await fetch(`/api/payload?id=${encodeURIComponent(id)}`);
            if (res.ok) {
              const data = await res.json();
              setTitle(data.title ?? "");
              setPeriodFrom(data.period?.from ?? "");
              setPeriodTo(data.period?.to ?? "");
              const acc2 = data.account ?? data.meta?.account;
              if (acc2) {
                if (typeof acc2 === "string") {
                  setAccountNumber(acc2);
                } else if (typeof acc2 === "object") {
                  setAccountBank(acc2.bank ?? "");
                  setAccountNumber(acc2.number ?? acc2.num ?? acc2.account ?? "");
                }
              }
              setTotal((data.total ?? "") as number | "");
              if (Array.isArray(data.detailItems)) {
                setDetailItems(
                  data.detailItems.map((di: any, i: number) => ({ id: di.id ?? `d${i + 1}`, title: di.title ?? "", amount: di.amount != null ? String(di.amount) : "" }))
                );
              } else {
                setDetailItems([]);
              }
              const parsed: Participant[] = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
              setParticipants(parsed);
              if (data.meta?.viewerOnly) setShowForm(false);
            }
          } catch (e) {
            console.warn("failed to fetch payload by id", e);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    restoreFromParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const t = Number(total) || 0;
    const n = participants.length;
    if (n === 0) return;
    const base = Math.floor(t / n);
    let rem = t - base * n;
    const updated = participants.map((pt: Participant) => {
      const extra = rem > 0 ? 1 : 0;
      if (rem > 0) rem -= 1;
      return { ...pt, share: base + extra };
    });
    setParticipants(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, participants.length]);

  function addParticipant() {
    const cur = useDutchPayStore.getState().participants;
    setParticipants([...cur, { id: `p${cur.length + 1}`, name: "" }]);
  }
  function removeParticipant(id: string) {
    const cur = useDutchPayStore.getState().participants;
    const next = cur.filter((p: Participant) => p.id !== id).map((p: Participant, i: number) => ({ ...p, id: `p${i + 1}`}));
    setParticipants(next);
  }
  function updateParticipantName(id: string, name: string) {
    const cur = useDutchPayStore.getState().participants;
    setParticipants(cur.map((p: Participant) => (p.id === id ? { ...p, name } : p)));
  }
  function addToTotal(amount: number) {
    const cur = Number(total) || 0;
    setTotal(cur + amount);
    try { showToast(`${amount.toLocaleString()}원 추가됨`); } catch (e) {}
  }
  function resetTotal() { setTotal(""); }
  function toggleDetails(open?: boolean) { if (typeof open === "boolean") setDetailOpen(open); else { const cur = useDutchPayStore.getState().detailOpen; setDetailOpen(!cur); } }
  function addDetailItem() { const id = `d${Date.now()}`; const cur = useDutchPayStore.getState().detailItems; setDetailItems([...cur, { id, title: "", amount: "" }]); setDetailOpen(true); }
  function updateDetailItem(id: string, field: "title" | "amount", value: string) { if (field === 'amount') { const digits = value.replace(/\D/g, ''); const cur = useDutchPayStore.getState().detailItems; setDetailItems(cur.map((it: DetailItem) => it.id === id ? { ...it, amount: digits } : it)); } else { const cur = useDutchPayStore.getState().detailItems; setDetailItems(cur.map((it: DetailItem) => it.id === id ? { ...it, title: value } : it)); } }
  function removeDetailItem(id: string) { const cur = useDutchPayStore.getState().detailItems; setDetailItems(cur.filter((it: DetailItem) => it.id !== id)); }

  function resetAll() {
    setTitle(""); setTotal(""); setPeriodFrom(""); setPeriodTo(""); setAccountBank(""); setAccountNumber(""); setParticipants([]); setLink("");
    try { router.replace(location.pathname); } catch (e) {}
  }

  useEffect(() => {
    if (!detailItems || detailItems.length === 0) return;
    const hasAmount = detailItems.some((it: DetailItem) => it.amount !== "" && !isNaN(Number(it.amount)));
    if (!hasAmount) return;
    const sum = detailItems.reduce((s: number, it: DetailItem) => s + (typeof it.amount === 'number' ? it.amount as number : (it.amount === '' ? 0 : Number(it.amount))), 0);
    setTotal(sum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailItems]);

  function createLink() {
    (async () => {
      const totalNum = Number(total) || 0;
      const n = participants.length;
      let computedParticipants: Array<{ id: string; name: string; share?: number }> = participants.map((p: Participant) => ({ id: p.id, name: p.name }));
      if (n > 0) {
        const base = Math.floor(totalNum / n);
        let rem = totalNum - base * n;
        computedParticipants = participants.map((p: Participant) => {
          const extra = rem > 0 ? 1 : 0;
          if (rem > 0) rem -= 1;
          return { id: p.id, name: p.name, share: base + extra };
        });
      }

      const payloadBase: any = {
        title: title || "제목",
        total: totalNum,
        period: { from: periodFrom || null, to: periodTo || null },
        currency: "KRW",
        participants: computedParticipants,
        detailItems: detailItems.map((d: DetailItem) => ({ id: d.id, title: d.title, amount: d.amount === '' ? 0 : Number(d.amount) }))
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
            setTimeout(() => { try { linkInputRef.current?.focus(); linkInputRef.current?.select(); } catch (e) {} }, 50);
            try { router.replace(`${location.pathname}?id=${encodeURIComponent(id)}`); } catch (e) {}
            return;
          }
        } catch (e) { console.warn('server store failed, falling back to data-url', e); }
      }

      const url = `${location.protocol}//${location.host}${location.pathname}?p=${encoded}`;
      setLink(url);
      setTimeout(() => { try { linkInputRef.current?.focus(); linkInputRef.current?.select(); } catch (e) {} }, 50);
      if (encoded.length > BLOCK_LEN) {
        const proceed = confirm(`생성된 링크가 매우 깁니다(${encoded.length} chars). 이 링크는 일부 환경에서 열리지 않을 수 있습니다. 계속해서 링크를 생성하시겠습니까?`);
        if (!proceed) return; alert('링크가 매우 깁니다. 복사해서 새 탭에서 여시길 권장합니다.'); return;
      }
      if (encoded.length > WARN_LEN) alert('생성된 링크가 큽니다. 다른 브라우저나 환경에서 열 때 잘리지 않는지 확인하세요.' );
      try { router.replace(`${location.pathname}?p=${encoded}`); } catch (e) { console.warn('router.replace failed', e); }
    })();
  }

  async function copyLink() {
    if (!link) return;
    let viewerLink = link;
    try { const url = new URL(link); if (!url.searchParams.get('view')) url.searchParams.set('view', '1'); viewerLink = url.toString(); } catch (e) { viewerLink = link.includes('?') ? `${link}&view=1` : `${link}?view=1`; }
    try { await navigator.clipboard.writeText(viewerLink); showToast('뷰어 모드 링크가 복사되었습니다.'); } catch (e) { console.warn('clipboard write failed', e); alert('링크 복사에 실패했습니다.'); }
  }

  function formatDateWithWeekday(dateStr: string): string {
    if (!dateStr) return ""; try { const d = new Date(dateStr); if (isNaN(d.getTime())) return dateStr; const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d); return `${dateStr} (${weekday})`; } catch (e) { return dateStr; }
  }

  return (
    <div className="min-h-screen bg-slate-400 p-4 sm:p-8">
        <div className="mx-auto w-full max-w-[1440px] bg-white p-4 sm:p-6 rounded-lg shadow-sm px-3 sm:px-4 min-w-[280px]">

            <div className="mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">더치페이</h1>
                    <div className="text-sm text-slate-600">URL로 공유 가능한 더치페이</div>
                </div>
            </div>

            <div className="md:flex md:items-start md:gap-4 space-y-10 md:space-y-0 items-start">
                <div className={showForm ? "md:w-1/2 md:mr-4 min-w-0" : "md:w-full min-w-0"}>
                      <Card id="receipt">
                        <CardHeader>
                        <CardTitle className="mb-2 border-b border-dashed border-slate-200 pb-2 no-print">{title || "더치페이"}</CardTitle>
                        {(periodFrom || periodTo) && (
                          <div className="mt-1 text-sm text-slate-600 border-b border-dashed border-slate-200 pb-4 no-print">기간: {formatDateWithWeekday(periodFrom)}{periodFrom && periodTo ? ' – ' : ''}{formatDateWithWeekday(periodTo)}</div>
                        )}
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm text-slate-600 border-b border-dashed border-slate-200 pb-4">
                                        <span>총액: </span>
                                        <span>
                                            <span className="text-2xl font-bold text-slate-800">{Number(total || 0).toLocaleString()}</span>
                                            <span>원</span>
                                        </span>
                                    </div>

                                    {detailItems.length > 0 && (
                                    <div className="mt-3 border-b border-dashed border-slate-200 pb-4">
                                        <div className="text-xs text-slate-500 mb-1">세부 항목</div>
                                            <div className="space-y-1">
                                                {detailItems.map((di: DetailItem) => (
                                                <div key={di.id} className="flex items-center justify-between text-sm">
                                                    <div className="truncate text-slate-700 mr-2">{di.title || '항목'}</div>
                                                    <div className="text-slate-600">{(typeof di.amount === 'number' ? di.amount : (di.amount === '' ? 0 : Number(di.amount))).toLocaleString()}원</div>
                                                </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 space-y-1 border-b border-dashed border-slate-200 pb-4">
                                        {participants.map((p: Participant) => (
                                            <div key={p.id} className="flex justify-between text-sm">
                                                <div className="font-medium">{p.name || "참여자"}</div>
                                                <div className="text-slate-600">{typeof p.share === "number" ? `${p.share.toLocaleString()}원` : "-"}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {(accountBank || accountNumber) && (
                                        <div className="mt-3 flex justify-between items-center border-b border-dashed border-slate-200 pb-4">
                                            <div className="mt-1 text-sm text-slate-600">
                                                <div className="mb-1">은행: {accountBank ? accountBank + ' ' : ''} </div>
                                                <div>계좌 번호: {accountNumber}</div>
                                            </div>
                                            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300" onClick={copyAccount}>계좌 복사</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
                {showForm && (
                    <div className="md:w-1/2 min-w-0 md:mt-0 sm:mt-2">
                        <Card>
                            <CardContent>
                                <div className="space-y-4 space-x-2">
                                    <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                                        <Label className="block mb-2 font-semibold">제목</Label>
                                        <Input value={title} placeholder="제목을 입력하세요" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
                                    </div>

                                    <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                                        <Label className="block mb-2 font-semibold">기간</Label>
                                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                                            <div className="flex-1"><DatePicker id="period-from" value={periodFrom} onChange={(s) => setPeriodFrom(s)} /></div>
                                            <div className="flex-1"><DatePicker id="period-to" value={periodTo} onChange={(s) => setPeriodTo(s)} /></div>
                                        </div>
                                    </div>

                                    <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                                        <Label className="block mb-2 font-semibold">계좌 정보</Label>
                                        <div className="flex items-start gap-2">
                                            <div className="flex gap-2 flex-1">
                                                <Select value={accountBank} onValueChange={(v: string) => setAccountBank(v === "none" ? "" : v)}>
                                                    <SelectTrigger className="min-w-[120px]"><SelectValue placeholder="은행 선택" /></SelectTrigger>
                                                    <SelectContent>
                                                    <SelectItem value="none">은행 선택</SelectItem>
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
                                                <Input placeholder="계좌번호 - 숫자만 입력" inputMode="numeric" value={accountNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const digits = e.target.value.replace(/\D/g, ''); setAccountNumber(digits); validateAccountNumber(digits); }} />
                                            </div>
                                        </div>

                                        {accountError && <div className="mt-1 text-xs text-red-600">{accountError}</div>}
                                    </div>

                                    <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0">
                                        <Label className="block mb-2 font-semibold">총액 (숫자)</Label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <Input className="flex-1" type="number" placeholder="총액 입력하거나 세부 항목 입력" value={total as any} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const digits = e.target.value.replace(/\D/g, '');
                                            if (detailItems.length > 0) {
                                                const proceed = confirm('세부 항목이 초기화됩니다. 계속하시겠습니까?');
                                                if (!proceed) return; setDetailItems([]); setDetailOpen(false); showToast('세부 항목이 초기화되었습니다. 총액으로 대체됩니다.');
                                            }
                                            setTotal(digits === '' ? '' : Number(digits));
                                            }} />
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <button type="button" className="text-sm text-slate-700 flex items-center gap-2" onClick={() => toggleDetails()}>
                                            <span className="text-lg">{detailOpen ? '▴' : '▾'}</span>
                                            <span>세부 항목</span>
                                            </button>
                                            <div><Button size="sm" className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600" onClick={addDetailItem}>항목 추가</Button></div>
                                        </div>

                                        {detailOpen && (
                                            <div className="mt-3 space-y-2">
                                            {detailItems.length === 0 && (<div className="text-sm text-slate-500">아직 항목이 없습니다. '항목 추가'를 눌러 항목을 추가하세요.</div>)}
                                            {detailItems.map((it: DetailItem) => (
                                                <div key={it.id} className="flex items-center gap-2">
                                                <Input className="w-full sm:w-80" placeholder="제목" value={it.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDetailItem(it.id, 'title', e.target.value)} />
                                                <Input className="w-full sm:w-40" placeholder="금액" inputMode="numeric" value={it.amount as any} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDetailItem(it.id, 'amount', e.target.value)} />
                                                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => removeDetailItem(it.id)}>삭제</Button>
                                                </div>
                                            ))}
                                            </div>
                                        )}

                                        <div className="pb-4 border-b border-dashed border-slate-200 last:border-0 mr-0">
                                            <div className="flex justify-between items-center">
                                            <Label className="block font-semibold">참여자</Label>
                                            <div><Button size="sm" className="bg-slate-700 border border-slate-200 text-white hover:bg-slate-600" onClick={addParticipant}>참여자 추가</Button></div>
                                            </div>
                                            <div className="space-y-2 mt-2">
                                            {participants.map((pt: Participant) => (
                                                <div key={pt.id} className="flex items-center gap-2">
                                                <Input className="flex-1" value={pt.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateParticipantName(pt.id, e.target.value)} placeholder="이름" />
                                                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => removeParticipant(pt.id)}>삭제</Button>
                                                </div>
                                            ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pb-4 border-b border-dashed border-slate-200 last:border-0 items-center gap-3">
                                            <Button onClick={createLink} className="bg-blue-700 text-white hover:bg-blue-600">링크 생성</Button>
                                        </div>

                                        {link && (
                                            <div className="mt-4">
                                            <Label className="font-semibold">생성된 링크</Label>
                                            <div className="mt-2 flex gap-2">
                                                <Input ref={linkInputRef} className="flex-1" value={link} readOnly />
                                                <Button onClick={copyLink}>복사</Button>
                                            </div>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            

                <div aria-live="polite" className="fixed top-6 right-6 flex flex-col gap-2 z-50">
                    <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(-8px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes toast-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-8px) scale(0.995); } }`}</style>
                    {toasts.map((t: { id: number; msg: string; duration: number }) => (
                        <div key={t.id} style={{ animation: `toast-in 200ms ease, toast-out 200ms ease ${t.duration}ms forwards` }} className="min-w-40 max-w-sm bg-emerald-600 text-white text-sm px-3 py-2 rounded shadow-md drop-shadow">{t.msg}</div>
                    ))}
                </div>
                
            </div>
        </div>
    </div>
  );
}
