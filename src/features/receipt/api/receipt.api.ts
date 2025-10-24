import { apiClient } from '@/features/auth/api';

export type ReceiptImagePayload = {
  mimeType: string;
  data: string; // base64 without data URI prefix
};

export interface ParseReceiptRequest {
  sessionName: string;
  language: string;
  image: ReceiptImagePayload;
}

export type ParsedReceiptItemKind = 'item' | 'fee' | 'discount' | string;

export interface ParsedReceiptItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  kind?: ParsedReceiptItemKind;
}

export interface ReceiptSummary {
  grandTotal: number;
  currency?: string; // ✅ Валюта в summary
  [key: string]: unknown;
}

export interface ParseReceiptResponse {
  sessionId: number;
  sessionName: string;
  language: string;
  items: ParsedReceiptItem[];
  summary?: ReceiptSummary;
}

export type ReceiptParticipant = {
  uniqueId: string;
  username: string;
};

export type ReceiptSplitMode = 'equal' | 'count';

export interface FinalizeReceiptItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  kind?: ParsedReceiptItemKind;
  splitMode: ReceiptSplitMode;
  assignedTo?: string[];
  perPersonCount?: Record<string, number>;
}

export interface FinalizeReceiptRequest {
  sessionId: number;
  sessionName: string;
  participants: ReceiptParticipant[];
  items: FinalizeReceiptItemPayload[];
  currency?: string; // ✅ Добавьте валюту в запрос
}

export interface FinalizeTotalsByParticipant {
  uniqueId: string;
  username: string;
  amountOwed: number;
}

export interface FinalizeTotalsByItem {
  itemId: string;
  name: string;
  total: number;
}

export interface ReceiptAllocation {
  itemId: string;
  participantId: string;
  shareAmount: number;
  shareUnits?: number;
  shareRatio?: number;
}

export interface FinalizeReceiptResponse {
  sessionId: number;
  sessionName: string;
  status: string;
  createdAt: string;
  totals: {
    grandTotal: number;
    currency?: string; // ✅ Добавьте валюту в ответ
    byParticipant?: FinalizeTotalsByParticipant[];
    byItem?: FinalizeTotalsByItem[];
  };
  allocations?: ReceiptAllocation[];
}

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error('Unexpected error');
};

export const ReceiptApi = {
  async parse(payload: ParseReceiptRequest): Promise<ParseReceiptResponse> {
    try {
      // console.log('[API] POST /sessions/scan');
      // console.log('[API] Request data:', JSON.stringify(payload, null, 2));

      const { data } = await apiClient.post<ParseReceiptResponse>('/sessions/scan', payload);

      console.log('[API] Response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('[API] Error (parse):', error);
      throw normalizeError(error);
    }
  },

  async finalize(payload: FinalizeReceiptRequest): Promise<FinalizeReceiptResponse> {
    try {
      console.log('[API] POST /sessions/finalize');
      console.log('[API] Request data:', JSON.stringify(payload, null, 2));

      const { data } = await apiClient.post<FinalizeReceiptResponse>('/sessions/finalize', payload);

      console.log('[API] Response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('[API] Error (finalize):', error);
      throw normalizeError(error);
    }
  },
};

