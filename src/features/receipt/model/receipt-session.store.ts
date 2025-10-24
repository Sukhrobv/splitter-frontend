import { create } from 'zustand';
import type {
  FinalizeReceiptResponse,
  FinalizeReceiptItemPayload,
  ParseReceiptRequest,
  ParseReceiptResponse,
  ReceiptParticipant,
  ReceiptSummary,
  ReceiptSplitMode,
} from '@/features/receipt/api/receipt.api';
import { ReceiptApi } from '@/features/receipt/api/receipt.api';

export type CapturedReceiptImage = {
  uri?: string;
  mimeType: string;
  base64: string;
  width?: number;
  height?: number;
};

export interface ReceiptSplitItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  kind?: string;
  splitMode: ReceiptSplitMode;
  assignedTo: string[];
  perPersonCount: Record<string, number>;
}

export interface ReceiptSessionMeta {
  sessionId: number;
  sessionName: string;
  language: string;
  summary?: ReceiptSummary;
}

interface ReceiptSessionStore {
  capture?: CapturedReceiptImage;
  parsing: boolean;
  parseError?: string;
  session?: ReceiptSessionMeta;
  items: ReceiptSplitItem[];
  participants: ReceiptParticipant[];
  currency: string; // ✅ Добавлено поле для валюты
  finalizing: boolean;
  finalizeError?: string;
  finalized?: FinalizeReceiptResponse;

  setCapture: (capture?: CapturedReceiptImage) => void;
  clearCapture: () => void;
  setSessionName: (sessionName: string) => void;
  setParticipants: (participants: ReceiptParticipant[]) => void;
  setCurrency: (currency: string) => void; // ✅ Добавлен метод
  updateItem: (itemId: string, updater: (prev: ReceiptSplitItem) => ReceiptSplitItem) => void;
  setItems: (items: ReceiptSplitItem[]) => void;

  parseReceipt: (payload: ParseReceiptRequest) => Promise<ParseReceiptResponse>;
  finalizeSession: () => Promise<FinalizeReceiptResponse>;
  reset: () => void;
}

const INITIAL_STATE: Pick<ReceiptSessionStore,
  'capture' | 'parsing' | 'parseError' | 'session' | 'items' | 'participants' | 'currency' | 'finalizing' | 'finalizeError' | 'finalized'
> = {
  capture: undefined,
  parsing: false,
  parseError: undefined,
  session: undefined,
  items: [],
  participants: [],
  currency: 'UZS', // ✅ Значение по умолчанию
  finalizing: false,
  finalizeError: undefined,
  finalized: undefined,
};

export const useReceiptSessionStore = create<ReceiptSessionStore>((set, get) => ({
  ...INITIAL_STATE,

  setCapture: (capture) => set({ capture }),
  clearCapture: () => set({ capture: undefined }),

  setSessionName: (sessionName) => {
    set((state) => {
      if (!state.session) return {};
      return { session: { ...state.session, sessionName } };
    });
  },

  setParticipants: (participants) => set({ participants }),

  setCurrency: (currency) => set({ currency }), // ✅ Новый метод

  updateItem: (itemId, updater) => {
    set((state) => ({
      items: state.items.map((item) => item.id === itemId ? updater(item) : item),
    }));
  },

  setItems: (items) => set({ items }),

  parseReceipt: async (payload) => {
    set({ parsing: true, parseError: undefined });
    try {
      const response = await ReceiptApi.parse(payload);
      const splitItems: ReceiptSplitItem[] = response.items.map((item) => ({
        id: item.id,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        kind: item.kind,
        splitMode: item.quantity > 1 ? 'count' : 'equal',
        assignedTo: [],
        perPersonCount: {},
      }));

      // ✅ Извлекаем валюту из ответа API
      const detectedCurrency = response.summary?.currency || 'UZS';

      set({
        parsing: false,
        parseError: undefined,
        session: {
          sessionId: response.sessionId,
          sessionName: response.sessionName,
          language: response.language,
          summary: response.summary,
        },
        items: splitItems,
        participants: [],
        currency: detectedCurrency, // ✅ Сохраняем валюту
        finalized: undefined,
        finalizeError: undefined,
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse receipt';
      set({ parsing: false, parseError: message });
      throw error;
    }
  },

  finalizeSession: async () => {
    const { session, participants, items, currency } = get();
    if (!session) throw new Error('No session to finalize');
    if (participants.length === 0) throw new Error('Add at least one participant');

    const payloadItems: FinalizeReceiptItemPayload[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
      kind: item.kind,
      splitMode: item.splitMode,
      assignedTo: item.splitMode === 'equal' ? item.assignedTo : undefined,
      perPersonCount: item.splitMode === 'count' ? item.perPersonCount : undefined,
    }));

    set({ finalizing: true, finalizeError: undefined });
    try {
      const response = await ReceiptApi.finalize({
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        participants,
        items: payloadItems,
        currency,
      });

       if (response.totals?.currency) {
      set({ currency: response.totals.currency });
    }

      set({ finalizing: false, finalized: response, finalizeError: undefined });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize session';
      set({ finalizing: false, finalizeError: message });
      throw error;
    }
  },

  reset: () => set({ ...INITIAL_STATE }),
}));