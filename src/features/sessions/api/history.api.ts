import { apiClient } from '@/features/auth/api';

export interface SessionHistoryParticipant {
  uniqueId: string;
  username: string;
  avatarUrl?: string | null;
}

export interface SessionHistoryTotalsByParticipant {
  uniqueId: string;
  username: string;
  amountOwed: number;
  avatarUrl?: string | null;
}

export interface SessionHistoryItem {
  itemId: string;
  name: string;
  total: number;
}

export interface SessionHistoryTotals {
  grandTotal: number;
  myTotal?: number;
  byParticipant?: SessionHistoryTotalsByParticipant[];
  byItem?: SessionHistoryItem[];
}

export interface SessionHistoryAllocation {
  itemId: string;
  participantId: string;
  shareAmount: number;
  shareUnits?: number;
  shareRatio?: number;
}

export interface SessionHistorySession {
  sessionId: number;
  sessionName: string;
  createdAt: string;
  status: string;
  ownerId: string;
  ownerName: string;
  totals: SessionHistoryTotals;
  participants: SessionHistoryParticipant[];
  allocations?: SessionHistoryAllocation[];
  currency?: string;
}

export interface SessionHistoryLatestResponse {
  limit: number;
  count: number;
  sessions: SessionHistorySession[];
}

const HISTORY_LATEST_ENDPOINT = '/sessions/history/latest';
const MAX_LIMIT = 100;

export const SessionsHistoryApi = {
  async listLatest(limit?: number): Promise<SessionHistoryLatestResponse> {
    const finalLimit =
      typeof limit === 'number' && Number.isFinite(limit)
        ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)))
        : undefined;

    const { data } = await apiClient.get<SessionHistoryLatestResponse>(HISTORY_LATEST_ENDPOINT, {
      params: finalLimit ? { limit: finalLimit } : undefined,
      headers: { Accept: 'application/json' },
    });
    return data;
  },
};
