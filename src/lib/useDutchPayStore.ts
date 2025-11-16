import create from 'zustand';
import { persist } from 'zustand/middleware';

type Participant = { id: string; name: string; share?: number };
type DetailItem = { id: string; title: string; amount: string };

type DutchPayState = {
  title: string;
  periodFrom: string;
  periodTo: string;
  total: number | '';
  participants: Participant[];
  detailItems: DetailItem[];
  accountBank: string;
  accountNumber: string;
  link: string;
  loading: boolean;
  showForm: boolean;
  toasts: Array<{ id: number; msg: string; duration: number }>;

  // actions
  setTitle: (v: string) => void;
  setPeriodFrom: (v: string) => void;
  setPeriodTo: (v: string) => void;
  setTotal: (v: number | '') => void;
  setParticipants: (p: Participant[]) => void;
  addParticipant: (p?: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  updateParticipantName: (id: string, name: string) => void;

  setDetailItems: (d: DetailItem[]) => void;
  addDetailItem: () => void;
  updateDetailItem: (id: string, field: 'title' | 'amount', value: string) => void;
  removeDetailItem: (id: string) => void;

  setAccountBank: (v: string) => void;
  setAccountNumber: (v: string) => void;

  setLink: (v: string) => void;
  setLoading: (v: boolean) => void;
  setShowForm: (v: boolean) => void;

  showToast: (msg: string, duration?: number) => void;
  removeToast: (id: number) => void;

  resetAll: () => void;
};

export const useDutchPayStore = create<DutchPayState>()(
  persist((set, get) => ({
    title: '',
    periodFrom: '',
    periodTo: '',
    total: '',
    participants: [],
    detailItems: [],
    accountBank: '',
    accountNumber: '',
    link: '',
    loading: true,
    showForm: true,
    toasts: [],

    setTitle: (v) => set({ title: v }),
    setPeriodFrom: (v) => set({ periodFrom: v }),
    setPeriodTo: (v) => set({ periodTo: v }),
    setTotal: (v) => set({ total: v }),
    setParticipants: (p) => set({ participants: p }),
    addParticipant: (p) =>
      set((s) => ({ participants: [...s.participants, { id: `p${s.participants.length + 1}`, name: p?.name ?? '' }] })),
    removeParticipant: (id) => set((s) => ({ participants: s.participants.filter((x) => x.id !== id).map((p, i) => ({ ...p, id: `p${i + 1}` })) })),
    updateParticipantName: (id, name) => set((s) => ({ participants: s.participants.map((p) => (p.id === id ? { ...p, name } : p)) })),

    setDetailItems: (d) => set({ detailItems: d }),
    addDetailItem: () =>
      set((s) => ({ detailItems: [...s.detailItems, { id: `d${Date.now()}`, title: '', amount: '' }] })),
    updateDetailItem: (id, field, value) =>
      set((s) => ({ detailItems: s.detailItems.map((it) => (it.id === id ? { ...it, [field]: value } : it)) })),
    removeDetailItem: (id) => set((s) => ({ detailItems: s.detailItems.filter((it) => it.id !== id) })),

    setAccountBank: (v) => set({ accountBank: v }),
    setAccountNumber: (v) => set({ accountNumber: v }),

    setLink: (v) => set({ link: v }),
    setLoading: (v) => set({ loading: v }),
    setShowForm: (v) => set({ showForm: v }),

    showToast: (msg, duration = 2000) => {
      const id = Date.now();
      set((s) => ({ toasts: [...s.toasts, { id, msg, duration }] }));
      setTimeout(() => {
        const t = get().toasts.find((x) => x.id === id);
        if (t) get().removeToast(id);
      }, duration + 220);
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    resetAll: () =>
      set({
        title: '',
        periodFrom: '',
        periodTo: '',
        total: '',
        participants: [],
        detailItems: [],
        accountBank: '',
        accountNumber: '',
        link: '',
        loading: false,
        showForm: true,
        toasts: [],
      }),
  }),
  {
    name: 'dutchpay-store',
  })
);

export default useDutchPayStore;
