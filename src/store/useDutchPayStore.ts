import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Participant = { id: string; name: string; share?: number };
type DetailItem = { id: string; title: string; amount: string };

export type DutchPayState = {
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
  detailOpen: boolean;
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
  setDetailOpen: (v: boolean) => void;

  showToast: (msg: string, duration?: number) => void;
  removeToast: (id: number) => void;

  resetAll: () => void;
};

export const useDutchPayStore = create<DutchPayState>()(
  persist<DutchPayState>((set, get) => ({
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
    detailOpen: false,
    toasts: [],


    setTitle: (v: string) => set({ title: v }),
    setPeriodFrom: (v: string) => set({ periodFrom: v }),
    setPeriodTo: (v: string) => set({ periodTo: v }),
    setTotal: (v: number | '') => set({ total: v }),
    setParticipants: (p: Participant[]) => set({ participants: p }),
    addParticipant: (p?: Partial<Participant>) =>
      set((s: DutchPayState) => ({ participants: [...s.participants, { id: `p${s.participants.length + 1}`, name: p?.name ?? '' }] })),
    removeParticipant: (id: string) => set((s: DutchPayState) => ({ participants: s.participants.filter((x: Participant) => x.id !== id).map((p: Participant, i: number) => ({ ...p, id: `p${i + 1}` })) })),
    updateParticipantName: (id: string, name: string) => set((s: DutchPayState) => ({ participants: s.participants.map((p: Participant) => (p.id === id ? { ...p, name } : p)) })),

    setDetailItems: (d: DetailItem[]) => set({ detailItems: d }),
    addDetailItem: () =>
      set((s: DutchPayState) => ({ detailItems: [...s.detailItems, { id: `d${Date.now()}`, title: '', amount: '' }] })),
    updateDetailItem: (id: string, field: 'title' | 'amount', value: string) =>
      set((s: DutchPayState) => ({ detailItems: s.detailItems.map((it: DetailItem) => (it.id === id ? { ...it, [field]: value } : it)) })),
    removeDetailItem: (id: string) => set((s: DutchPayState) => ({ detailItems: s.detailItems.filter((it: DetailItem) => it.id !== id) })),

    setAccountBank: (v: string) => set({ accountBank: v }),
    setAccountNumber: (v: string) => set({ accountNumber: v }),

    setLink: (v: string) => set({ link: v }),
    setLoading: (v: boolean) => set({ loading: v }),
    setShowForm: (v: boolean) => set({ showForm: v }),
    setDetailOpen: (v: boolean) => set({ detailOpen: v }),

    showToast: (msg: string, duration = 2000) => {
      const id = Date.now();
      set((s: DutchPayState) => ({ toasts: [...s.toasts, { id, msg, duration }] }));
      setTimeout(() => {
        const st = get() as DutchPayState;
        const t = st.toasts.find((x: { id: number }) => x.id === id);
        if (t) (get() as DutchPayState).removeToast(id);
      }, duration + 220);
    },
    removeToast: (id: number) => set((s: DutchPayState) => ({ toasts: s.toasts.filter((t: { id: number }) => t.id !== id) })),

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
        detailOpen: false,
        toasts: [],
      }),
  }),
  {
    name: 'dutchpay-store',
    // do not persist transient UI state like toasts
    partialize: (state: DutchPayState) => {
      const { toasts, ...rest } = state as any;
      return rest;
    },
  }
));

export default useDutchPayStore;
