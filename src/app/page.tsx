"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from "react";
import { encodePayload, decodePayload } from "@/lib/encoding";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui";

type Participant = { id: string; name: string; share?: number };

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState<string>("");
  const [periodFrom, setPeriodFrom] = useState<string>("");
  const [periodTo, setPeriodTo] = useState<string>("");
  const [total, setTotal] = useState<number | "">("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [link, setLink] = useState<string>("");
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);
  const [receiptMetas, setReceiptMetas] = useState<Array<{ name: string; origSize: number | null; compSize: number | null }>>([]);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const periodFromRef = useRef<HTMLInputElement | null>(null);
  const periodToRef = useRef<HTMLInputElement | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [now, setNow] = useState<string>("");
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; duration: number }>>([]);
  const toastId = useRef(0);
  const MAX_IMAGES = 3;

  function showToast(msg: string, duration = 2000) {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, duration }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration + 220); // allow exit animation time
  }

  useEffect(() => {
    async function restoreFromParams() {
      const p = searchParams.get("p");
      if (p) {
        const data = decodePayload(p);
        if (data) {
          setTitle(data.title ?? "");
          setPeriodFrom(data.period?.from ?? "");
          setPeriodTo(data.period?.to ?? "");
          setTotal((data.total ?? "") as number | "");
          const parsed: Participant[] = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
          setParticipants(parsed);
          // restore receipts if present in payload (data URLs or remote URLs)
          if (Array.isArray(data.receipts) && data.receipts.length > 0) {
            const receipts = data.receipts as string[];
            setReceiptUrls(receipts);
            // create metas for restored receipts (origSize unknown)
            const metas = receipts.map((r: string, i: number) => {
              // attempt to estimate size for data URLs
              let compSize: number | null = null;
              try {
                const idx = r.indexOf(",");
                if (idx >= 0) {
                  const b64 = r.slice(idx + 1);
                  compSize = Math.ceil((b64.length * 3) / 4);
                }
              } catch (e) {
                compSize = null;
              }
              return { name: `receipt-${i + 1}`, origSize: null, compSize };
            });
            setReceiptMetas(metas);
            // we can't recreate File objects for decoded data URLs, so clear receiptFiles
            setReceiptFiles([]);
          }
        }
      }

      const id = searchParams.get('id');
      if (id) {
        try {
          const res = await fetch(`/api/payload?id=${encodeURIComponent(id)}`);
          if (res.ok) {
            const data = await res.json();
            setTitle(data.title ?? "");
            setPeriodFrom(data.period?.from ?? "");
            setPeriodTo(data.period?.to ?? "");
            setTotal((data.total ?? "") as number | "");
            const parsed: Participant[] = (data.participants ?? []).map((pt: any, i: number) => ({ id: pt.id ?? `p${i + 1}`, name: pt.name ?? `참여자 ${i + 1}` }));
            setParticipants(parsed);
            if (Array.isArray(data.receipts) && data.receipts.length > 0) {
              setReceiptUrls(data.receipts as string[]);
              const metas = (data.receipts as string[]).map((r: string, i: number) => {
                let compSize: number | null = null;
                try {
                  const idx = r.indexOf(',');
                  if (idx >= 0) {
                    const b64 = r.slice(idx + 1);
                    compSize = Math.ceil((b64.length * 3) / 4);
                  }
                } catch (e) {
                  compSize = null;
                }
                return { name: `receipt-${i + 1}`, origSize: null, compSize };
              });
              setReceiptMetas(metas);
              setReceiptFiles([]);
            }
          }
        } catch (e) {
          console.warn('failed to fetch payload by id', e);
        }
      }
    }

    restoreFromParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Set current timestamp on client to avoid SSR/client hydration mismatch
  useEffect(() => {
    setNow(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    const t = Number(total) || 0;
    const n = participants.length;
    if (n === 0) return;
    const base = Math.floor(t / n);
    let rem = t - base * n;
    const updated = participants.map((pt) => {
      const extra = rem > 0 ? 1 : 0;
      if (rem > 0) rem -= 1;
      return { ...pt, share: base + extra };
    });
    setParticipants(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, participants.length]);

  function addParticipant() {
    setParticipants((prev) => [...prev, { id: `p${prev.length + 1}`, name: "" }]);
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, id: `p${i + 1}`})));
  }

  function updateParticipantName(id: string, name: string) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  function addToTotal(amount: number) {
    setTotal((prev) => {
      const cur = Number(prev) || 0;
      return cur + amount;
    });
    try {
      showToast(`${amount.toLocaleString()}원 추가됨`);
    } catch (e) {}
  }

  function resetTotal() {
    setTotal("");
  }

  function resetAll() {
    setTitle("");
    setTotal("");
    setPeriodFrom("");
    setPeriodTo("");
    setParticipants([]);
    setLink("");
    if (receiptUrls.length > 0) {
      receiptUrls.forEach((u) => {
        if (u && u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      setReceiptUrls([]);
      setReceiptFiles([]);
      setReceiptMetas([]);
    }
    try {
      router.replace(location.pathname);
    } catch (e) {
      // ignore
    }
  }

  function onReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    (async () => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      // Enforce maximum number of images
      const currently = receiptFiles.length;
      if (currently >= MAX_IMAGES) {
        alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
        if (receiptInputRef.current) receiptInputRef.current.value = "";
        return;
      }
      const allowedSlots = MAX_IMAGES - currently;
      let acceptedFiles = files.slice(0, allowedSlots);
      if (acceptedFiles.length < files.length) {
        alert(`업로드할 수 있는 최대 이미지 수(${MAX_IMAGES})를 초과하여 일부만 처리합니다.`);
      }

      // Compress each file via Canvas API (no external deps)
      const MAX_W = 600;
      const MAX_H = 600;
      const QUALITY = 0.5; // jpeg quality

      const compressedResults: { file: File; url: string }[] = [];

      await Promise.all(
        acceptedFiles.map(async (f) => {
          try {
            const blob = await compressImageFile(f, MAX_W, MAX_H, QUALITY);
            const newFile = new File([blob], f.name, { type: "image/jpeg" });
            const url = URL.createObjectURL(newFile);
            compressedResults.push({ file: newFile, url });
          } catch (err) {
            // fallback: use original
            const url = URL.createObjectURL(f);
            compressedResults.push({ file: f, url });
          }
        })
      );

      setReceiptFiles((prev) => [...prev, ...compressedResults.map((r) => r.file)]);
      setReceiptUrls((prev) => [...prev, ...compressedResults.map((r) => r.url)]);
      setReceiptMetas((prev) => [
        ...prev,
        ...compressedResults.map((r, idx) => ({ name: r.file.name, origSize: acceptedFiles[idx]?.size ?? null, compSize: r.file.size ?? null }))
      ]);

      // clear input so same file can be selected again if needed
      if (receiptInputRef.current) receiptInputRef.current.value = "";
    })();
  }

  // Compress an image File using Canvas API and return a JPEG Blob
  function compressImageFile(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.76): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          let { width, height } = img;
          const ratio = Math.min(1, Math.min(maxWidth / width, maxHeight / height));
          const w = Math.max(1, Math.round(width * ratio));
          const h = Math.max(1, Math.round(height * ratio));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context not available");
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) resolve(blob);
              else reject(new Error("Compression failed: no blob"));
            },
            "image/jpeg",
            quality
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  // helper: convert a File to a data URL (base64). Used when embedding images into the share link.
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  function removeReceiptAt(index: number) {
    setReceiptUrls((prev) => {
      const url = prev[index];
      if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
    setReceiptMetas((prev) => prev.filter((_, i) => i !== index));
  }
  
  function createLink() {
    (async () => {
      // Convert selected File objects to data URLs to embed in the link.
      // But first check sizes and warn the user if files are large.
      const MAX_FILE_SIZE = 200 * 1024; // 200 KB
      const oversized = receiptFiles.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        const list = oversized.map((f) => `${f.name} (${Math.round(f.size / 1024)}KB)`).join(", ");
        const proceed = confirm(
          `선택한 이미지 중 ${oversized.length}개가 ${Math.round(MAX_FILE_SIZE / 1024)}KB보다 큽니다: ${list}.\n` +
            `큰 이미지는 링크에 포함되지 않거나 링크가 매우 길어질 수 있습니다. 계속 생성하시겠습니까?`
        );
        if (!proceed) return; // user cancelled
      }

      const validFiles = receiptFiles; // we'll recompress to smaller size below
      let receipts: string[] = [];
      try {
        // further compress to smaller dimensions/quality to reduce encoded length
        const TARGET_W = 600;
        const TARGET_H = 600;
        const TARGET_Q = 0.5;
        const compressedDataUrls = await Promise.all(
          validFiles.map(async (f) => {
            try {
              const blob = await compressImageFile(f, TARGET_W, TARGET_H, TARGET_Q);
              return await fileToDataUrl(new File([blob], f.name, { type: 'image/jpeg' }));
            } catch (e) {
              console.warn('compress failed for', f.name, e);
              return await fileToDataUrl(f);
            }
          })
        );
        receipts = compressedDataUrls;
      } catch (e) {
        console.warn("Failed to convert some receipt files to data URLs", e);
      }

      const payload: any = {
        title: title || "제목",
        total: Number(total) || 0,
        period: { from: periodFrom || null, to: periodTo || null },
        currency: "KRW",
        participants: participants.map(({ id, name, share }) => ({ id, name, share }))
      };

      if (receipts.length > 0) payload.receipts = receipts;
      if (oversized.length > 0) alert(`${oversized.length}개의 큰 이미지는 링크에 포함되지 않았습니다.`);

      const encoded = encodePayload(payload);
      // Length thresholds
      const WARN_LEN = 3000; // warn user
      const BLOCK_LEN = 8000; // require explicit confirm

      // If payload is large, try to store it on the server and share a short id instead
      if (encoded.length > WARN_LEN) {
        try {
          const res = await fetch('/api/payload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const json = await res.json();
            const id = json.id;
            const url = `${location.protocol}//${location.host}${location.pathname}?id=${encodeURIComponent(id)}`;
            setLink(url);
            // focus and select the created link in the input
            setTimeout(() => {
              try {
                linkInputRef.current?.focus();
                linkInputRef.current?.select();
              } catch (e) {}
            }, 50);
            try {
              router.replace(`${location.pathname}?id=${encodeURIComponent(id)}`);
            } catch (e) {
              // ignore router replace errors
            }
            return;
          }
        } catch (e) {
          console.warn('server store failed, falling back to data-url', e);
        }
      }

      const url = `${location.protocol}//${location.host}${location.pathname}?p=${encoded}`;
      setLink(url);
      // focus and select the created link in the input
      setTimeout(() => {
        try {
          linkInputRef.current?.focus();
          linkInputRef.current?.select();
        } catch (e) {}
      }, 50);
      if (encoded.length > BLOCK_LEN) {
        const proceed = confirm(
          `생성된 링크가 매우 깁니다(${encoded.length} chars). 이 링크는 일부 환경에서 열리지 않을 수 있습니다. 계속해서 링크를 생성하시겠습니까?`
        );
        if (!proceed) return;
        alert('링크가 매우 깁니다. 복사해서 새 탭에서 여시길 권장합니다.');
        return; // don't auto-navigate
      }
      if (encoded.length > WARN_LEN) {
        alert('생성된 링크가 큽니다. 다른 브라우저나 환경에서 열 때 잘리지 않는지 확인하세요.');
      }
      try {
        // safe to navigate for moderate sizes
        router.replace(`${location.pathname}?p=${encoded}`);
      } catch (e) {
        console.warn('router.replace failed', e);
      }
    })();
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    alert("링크가 복사되었습니다.");
  }

  function formatBytes(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

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

  function getKoreanWeekday(dateStr: string): string {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return `(${new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(d)})`;
    } catch (e) {
      return "";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-[1440px] bg-white p-6 rounded-lg shadow-sm px-4">
        <h1 className="text-2xl font-semibold mb-2">Dutch-Pay</h1>
        <p className="text-sm text-slate-600 mb-4">폼에 입력한 더치페이 데이터를 URL에 인코딩하여 공유합니다.</p>

        <div className="md:flex md:items-start md:gap-6 space-y-10 md:space-y-0">
          <div className="md:w-2/3 md:mr-6 min-w-0">
            <Card>
                <CardHeader>
                <CardTitle>{title || "더치페이"}</CardTitle>
                <CardDescription>{now}</CardDescription>
                  {/* period is shown with receipts, not in the header */}
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-start">
                  {receiptUrls.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {receiptUrls.map((u, i) => (
                        <div key={u} className="relative">
                          <img src={u} alt={`receipt-${i}`} className="w-28 h-28 object-contain rounded-md border cursor-pointer" onClick={() => { setViewerUrl(u); setViewerOpen(true); }} />
                          <div className="mt-1 text-xs text-slate-500">
                            {receiptMetas[i] ? `${formatBytes(receiptMetas[i].origSize)} → ${formatBytes(receiptMetas[i].compSize)}` : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">총액: {Number(total || 0).toLocaleString()}원</div>
                    <div className="mt-3 space-y-1">
                      {participants.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <div className="font-medium">{p.name || "참여자"}</div>
                          <div className="text-slate-600">{typeof p.share === "number" ? `${p.share.toLocaleString()}원` : "-"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:w-1/3 min-w-0 sm:mt-2">
            <div className="space-y-4 space-x-2">
              <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                <Label className="block mb-1">제목</Label>
                  <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
                <div className="mt-3">
                  <Label className="block mb-1">기간</Label>
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 min-w-0">
                      <div
                        className="w-full cursor-pointer"
                        role="button"
                        aria-label="기간 시작일 선택"
                        onClick={() => {
                          try {
                            if (periodFromRef.current) {
                              (periodFromRef.current as any).showPicker ? (periodFromRef.current as any).showPicker() : periodFromRef.current.focus();
                            }
                          } catch (e) {}
                        }}
                      >
                        <Input
                          ref={periodFromRef}
                          type="date"
                          value={periodFrom}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodFrom(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="w-full cursor-pointer"
                        role="button"
                        aria-label="기간 종료일 선택"
                        onClick={() => {
                          try {
                            if (periodToRef.current) {
                              (periodToRef.current as any).showPicker ? (periodToRef.current as any).showPicker() : periodToRef.current.focus();
                            }
                          } catch (e) {}
                        }}
                      >
                        <Input
                          ref={periodToRef}
                          type="date"
                          value={periodTo}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodTo(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                <Label className="font-semibold">총액 (숫자)</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input className="flex-1" type="number" value={total as any} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotal(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                    <Button size="sm" onClick={() => addToTotal(10)}>10원</Button>
                    <Button size="sm" onClick={() => addToTotal(50)}>50원</Button>
                    <Button size="sm" onClick={() => addToTotal(100)}>100원</Button>
                    <Button size="sm" onClick={() => addToTotal(500)}>500원</Button>
                    <Button size="sm" onClick={() => addToTotal(1000)}>천원</Button>
                    <Button size="sm" onClick={() => addToTotal(5000)}>5천원</Button>
                    <Button size="sm" onClick={() => addToTotal(10000)}>만원</Button>
                    <Button size="sm" onClick={() => addToTotal(50000)}>5만원</Button>
                    <Button size="sm" onClick={() => addToTotal(100000)}>10만원</Button>
                    <Button size="sm" variant="danger" onClick={resetTotal}>초기화</Button>
                  </div>
              </div>

              <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                <div className="flex justify-between">
                  <Label className="font-semibold">참여자</Label>
                  <div className="mt-2">
                    <Button onClick={addParticipant}>참여자 추가</Button>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  {participants.map((pt) => (
                    <div key={pt.id} className="flex items-center gap-2">
                      <Input className="flex-1" value={pt.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateParticipantName(pt.id, e.target.value)} placeholder="이름" />
                      <div className="w-28 text-sm text-slate-600">
                        {typeof pt.share === "number" ? `${pt.share.toLocaleString()}원` : "-"}
                      </div>
                      <Button variant="ghost" onClick={() => removeParticipant(pt.id)}>삭제</Button>
                    </div>
                  ))}
                </div>
                
              </div>

              <div className="pb-4 border-b border-dashed border-slate-200 last:border-0">
                <Label className="font-semibold">영수증 이미지</Label>
                <div className="mt-2">
                  <input ref={receiptInputRef} type="file" accept="image/*" multiple onChange={onReceiptChange} className="hidden" />
                  <div className="inline-flex items-center gap-3">
                    <Button size="sm" onClick={() => receiptInputRef.current?.click()}>영수증 업로드</Button>
                    {receiptFiles.length > 0 && (
                      <div className="text-sm text-slate-600">{receiptFiles.length}개 선택</div>
                    )}
                  </div>

                  {(periodFrom || periodTo) && (
                    <div className="mt-3">
                      <div className="text-sm text-slate-500">기간: {periodFrom ? formatDateWithWeekday(periodFrom) : "—"}{periodFrom && periodTo ? ` ~ ${formatDateWithWeekday(periodTo)}` : periodTo && !periodFrom ? ` ~ ${formatDateWithWeekday(periodTo)}` : ""}</div>
                      <div className="text-xs text-slate-500 mt-1">기간을 선택하면 링크를 통해 다른 사용자도 확인할 수 있습니다.</div>
                    </div>
                  )}

                  {receiptUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {receiptUrls.map((u, i) => (
                        <div key={u} className="relative">
                          <img src={u} alt={`receipt-${i}`} className="w-full h-24 object-cover rounded-md border cursor-pointer" onClick={() => { setViewerUrl(u); setViewerOpen(true); }} />
                          <button
                            type="button"
                            aria-label="삭제"
                            onClick={() => removeReceiptAt(i)}
                            className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs"
                          >
                            삭제
                          </button>
                          <div className="mt-1 text-xs text-slate-500">
                            {receiptMetas[i] ? `${formatBytes(receiptMetas[i].origSize)} → ${formatBytes(receiptMetas[i].compSize)}` : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex pb-4 border-b border-dashed border-slate-200 last:border-0">
                <Button onClick={createLink}>링크 생성</Button>
                <div className="ml-3">
                  <Button variant="ghost" onClick={resetAll}>전체 초기화</Button>
                </div>
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
        </div>
                    {viewerUrl && (
                    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                      <DialogContent className="max-w-3xl">
                          <DialogTitle className="sr-only">영수증 미리보기</DialogTitle>
                          <div className="w-full">
                            <img src={viewerUrl} alt="receipt-viewer" className="w-full h-auto object-contain" />
                          </div>
                          <DialogClose />
                        </DialogContent>
                    </Dialog>
                  )}
                    {/* Toast container (top-right) */}
                    <div aria-live="polite" className="fixed top-6 right-6 flex flex-col gap-2 z-50">
                      <style>{`
                        @keyframes toast-in { from { opacity: 0; transform: translateY(-8px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
                        @keyframes toast-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-8px) scale(0.995); } }
                      `}</style>
                      {toasts.map((t) => (
                        <div
                          key={t.id}
                          style={{ animation: `toast-in 200ms ease, toast-out 200ms ease ${t.duration}ms forwards` }}
                          className="min-w-40 max-w-sm bg-emerald-600 text-white text-sm px-3 py-2 rounded shadow-md drop-shadow"
                        >
                          {t.msg}
                        </div>
                      ))}
                    </div>
      </div>
    </div>
  );
}
