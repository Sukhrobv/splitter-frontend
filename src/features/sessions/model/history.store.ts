import { create } from 'zustand';

import {
  SessionsHistoryApi,
  SessionHistoryEntry,
  SessionHistoryEntryRaw,
  SessionHistoryResponseRaw,
  SessionHistoryPayload,
} from '@/features/sessions/api/history.api';

type State = {
  sessions: SessionHistoryEntry[];
  count: number;
  limit?: number;
  loading: boolean;
  initialized: boolean;
  error?: string;
  lastFetchedAt?: number | null; // <= когда последний раз загрузили
};

type Actions = {
  fetchHistory: (limit?: number, all?: boolean) => Promise<SessionHistoryResponseRaw | undefined>;
  /** Принудительное обновление, игнорируя давность */
  forceRefresh: (limit?: number, all?: boolean) => Promise<SessionHistoryResponseRaw | undefined>;
  /** Обновить, только если данные «протухли» */
  refreshIfStale: (maxAgeMs?: number, limit?: number, all?: boolean) => Promise<void>;
  getSession: (sessionId: string | number) => SessionHistoryEntry | undefined;
  clearError: () => void;
  reset: () => void;
};

const initialState: State = {
  sessions: [],
  count: 0,
  limit: undefined,
  loading: false,
  initialized: false,
  error: undefined,
  lastFetchedAt: null,
};

const normalizeEntry = (raw: SessionHistoryEntryRaw): SessionHistoryEntry => {
  const p: SessionHistoryPayload | undefined = raw.payload;

  const participants =
    p?.totals?.byParticipant?.map(bp => ({
      uniqueId: bp.uniqueId,
      username: bp.username,
      avatarUrl: bp.avatarUrl ?? null,
    })) ?? [];

  const finalizedAt = raw.finalizedAt || p?.finalizedAt;
  const createdAt = p?.createdAt;

  const grandTotal =
    typeof raw.grandTotal === 'number' ? raw.grandTotal : p?.totals?.grandTotal ?? 0;

  return {
    sessionId: raw.sessionId ?? p?.sessionId ?? 0,
    sessionName: raw.sessionName || p?.sessionName || 'Bill',
    finalizedAt,
    createdAt,
    grandTotal,
    participantUniqueIds: raw.participantUniqueIds ?? [],
    totals: p?.totals,
    allocations: p?.allocations ?? [],
    participants,
    isCreator: raw.isCreator,
    payload: p!,
  };
};

export const useSessionsHistoryStore = create<State & Actions>((set, get) => ({
  ...initialState,

  async fetchHistory(requestedLimit, all = false) {
    const { loading } = get();

    if (loading) {
      console.warn('History fetch already in progress');
      return undefined;
    }

    set({ loading: true, error: undefined });

    try {
      const response = await SessionsHistoryApi.listLatest({
        limit: requestedLimit,
        all,
      });

      const normalized = (response.entries ?? []).map(normalizeEntry);

      set({
        sessions: normalized,
        count: response.count ?? 0,
        limit: response.limit,
        initialized: true,
        loading: false,
        lastFetchedAt: Date.now(),
      });

      return response;
    } catch (error: any) {
      const errorMessage =
        error?.message === 'Request cancelled'
          ? 'Request was cancelled'
          : error?.message ?? 'Failed to load sessions history';

      set({
        error: errorMessage,
        limit: requestedLimit,
        initialized: true,
        loading: false,
      });

      console.error('Failed to fetch history:', error);
      return undefined;
    }
  },

  async forceRefresh(limit, all = false) {
    // просто делегируем в fetchHistory (можно было бы игнорировать loading, но у нас уже защита есть)
    return get().fetchHistory(limit, all);
  },

  async refreshIfStale(maxAgeMs = 15_000, limit, all = false) {
    const { lastFetchedAt, initialized } = get();

    // если ни разу не грузили — грузим
    if (!initialized || !lastFetchedAt) {
      await get().fetchHistory(limit, all);
      return;
    }

    // если данных нет — грузим
    if (get().sessions.length === 0) {
      await get().fetchHistory(limit, all);
      return;
    }

    // если «протухли» — грузим
    const age = Date.now() - lastFetchedAt;
    if (age > maxAgeMs) {
      await get().fetchHistory(limit, all);
    }
  },

  getSession(sessionId) {
    const idNumber = typeof sessionId === 'number' ? sessionId : Number(sessionId);
    if (Number.isNaN(idNumber)) return undefined;
    return get().sessions.find(session => session.sessionId === idNumber);
  },

  clearError() {
    set({ error: undefined });
  },

  reset() {
    set(initialState);
  },
}));
