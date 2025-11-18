"use client";

import React, { useEffect, useRef } from "react";
import { encodePayload, decodePayload } from "@/lib/encoding";
import { useSearchParams, useRouter } from "next/navigation";
import Receipt from "@/components/Receipt";
import ReceiptForm from "@/components/ReceiptForm";
import useDutchPayStore from "@/store/useDutchPayStore";

export default function HomeClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const setTitle = useDutchPayStore((s) => s.setTitle);
    const setPeriodFrom = useDutchPayStore((s) => s.setPeriodFrom);
    const setPeriodTo = useDutchPayStore((s) => s.setPeriodTo);
    const setAccountBank = useDutchPayStore((s) => s.setAccountBank);
    const setAccountNumber = useDutchPayStore((s) => s.setAccountNumber);
    const setTotal = useDutchPayStore((s) => s.setTotal);
    const setDetailItems = useDutchPayStore((s) => s.setDetailItems);
    const setParticipants = useDutchPayStore((s) => s.setParticipants);
    const setShowForm = useDutchPayStore((s) => s.setShowForm);
    const setLoading = useDutchPayStore((s) => s.setLoading);
    const showToast = useDutchPayStore((s) => s.showToast);
    const toasts = useDutchPayStore((s) => s.toasts);
    const detailItems = useDutchPayStore((s) => s.detailItems);
    const total = useDutchPayStore((s) => s.total);
    const participants = useDutchPayStore((s) => s.participants);
    const showForm = useDutchPayStore((s) => s.showForm);

    const linkInputRef = useRef<HTMLInputElement | null>(null);

    // Clear any persisted or stale toasts on first mount to avoid showing toasts immediately
    useEffect(() => {
        try { useDutchPayStore.setState({ toasts: [] }); } catch (e) {}
    }, []);

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
                                data.detailItems.map((di: any, i: number) => {
                                    const rawId = di.id ?? `d${i + 1}`;
                                    const idStr = String(rawId);
                                    const id = idStr.startsWith('d') ? idStr : `d${idStr}`;
                                    return { id, title: di.title ?? "", amount: di.amount != null ? String(di.amount) : "" };
                                })
                            );
                        }
                        const parsed: any = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
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
                                    data.detailItems.map((di: any, i: number) => {
                                        const rawId = di.id ?? `d${i + 1}`;
                                        const idStr = String(rawId);
                                        const id = idStr.startsWith('d') ? idStr : `d${idStr}`;
                                        return { id, title: di.title ?? "", amount: di.amount != null ? String(di.amount) : "" };
                                    })
                                );
                            } else {
                                setDetailItems([]);
                            }
                            const parsed: any = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
                            setParticipants(parsed);
                            if (data.meta?.viewerOnly) setShowForm(false);
                        }
                    } catch (e) {
                        console.warn("failed to fetch payload by id", e);
                    }
                }

                // If no URL payload (p) and no saved id, try restoring from localStorage autosave
                try {
                    const p = searchParams.get("p");
                    const idParam = searchParams.get("id");
                    if (!p && !idParam) {
                        const raw = localStorage.getItem('dutchpay:autosave');
                        if (raw) {
                            try {
                                const data = JSON.parse(raw);
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
                                            data.detailItems.map((di: any, i: number) => {
                                                const rawId = di.id ?? `d${i + 1}`;
                                                const idStr = String(rawId);
                                                const id = idStr.startsWith('d') ? idStr : `d${idStr}`;
                                                return { id, title: di.title ?? "", amount: di.amount != null ? String(di.amount) : "" };
                                            })
                                        );
                                    }
                                    const parsed: any = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
                                    setParticipants(parsed);
                                }
                            } catch (e) {
                                console.warn('failed parsing dutchpay:autosave', e);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('restore from localStorage failed', e);
                }
            } finally {
                setLoading(false);
            }
        }

        restoreFromParams();
    }, [searchParams, setLoading, setTitle, setPeriodFrom, setPeriodTo, setAccountBank, setAccountNumber, setTotal, setDetailItems, setParticipants, setShowForm]);

    useEffect(() => {
        const t = Number(total) || 0;
        const n = participants.length;
        if (n === 0) return;
        const base = Math.floor(t / n);
        let rem = t - base * n;
        const updated = participants.map((pt: any) => {
            const extra = rem > 0 ? 1 : 0;
            if (rem > 0) rem -= 1;
            return { ...pt, share: base + extra };
        });
        setParticipants(updated);
    }, [total, participants.length, setParticipants]);

    return (
        <div className="min-h-screen bg-slate-400 p-4 sm:p-8">
            <div className="mx-auto w-full max-w-[1440px] bg-white p-4 sm:p-6 rounded-lg shadow-sm px-3 sm:px-4 box-border">

                <div className="mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">더치페이 v1.1</h1>
                        <div className="text-sm text-slate-600">URL로 공유 가능한 더치페이</div>
                    </div>
                </div>

                <div className="md:flex md:items-start md:gap-4 space-y-6 md:space-y-0 items-start">
                    <div className={showForm ? "md:w-1/2 md:mr-4 min-w-0" : "md:w-full min-w-0"}>
                        <Receipt />
                    </div>

                    {showForm && (
                        <div className="md:w-1/2 min-w-0 md:mt-0 sm:mt-2">
                            <ReceiptForm />
                        </div>
                    )}
                </div>

                <div aria-live="polite" className="fixed top-6 right-6 flex flex-col gap-2 z-50">
                    <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(-8px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes toast-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-8px) scale(0.995); } }`}</style>
                    {toasts.map((t: any) => (
                        <div key={t.id} style={{ animation: `toast-in 200ms ease, toast-out 200ms ease ${t.duration}ms forwards` }} className="min-w-40 max-w-sm bg-emerald-600 text-white text-sm px-3 py-2 rounded shadow-md drop-shadow">{t.msg}</div>
                    ))}
                </div>

            </div>
        </div>
    );
}
