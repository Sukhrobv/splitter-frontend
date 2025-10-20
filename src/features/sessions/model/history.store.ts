import { create } from 'zustand';

import {
  SessionHistorySession,
  SessionsHistoryApi,
  SessionHistoryLatestResponse,
} from '@/features/sessions/api/history.api';

type State = {
  sessions: SessionHistorySession[];
  count: number;
  limit?: number;
  loading: boolean;
  initialized: boolean;
  error?: string;
};

type Actions = {
  fetchHistory: (limit?: number) => Promise<SessionHistoryLatestResponse | undefined>;
  getSession: (sessionId: string | number) => SessionHistorySession | undefined;
  clearError: () => void;
};

export const useSessionsHistoryStore = create<State & Actions>((set, get) => ({
  sessions: [],
  count: 0,
  limit: undefined,
  loading: false,
  initialized: false,
  error: undefined,

  async fetchHistory(requestedLimit) {
    const { loading, limit } = get();
    const targetLimit = requestedLimit ?? limit;
    if (loading) return undefined;

    set({ loading: true, error: undefined });
    try {
      const response = await SessionsHistoryApi.listLatest(targetLimit);
      const resolvedLimit = response.limit ?? targetLimit ?? 0;
      set({
        sessions: response.sessions ?? [],
        count: response.count ?? response.sessions?.length ?? 0,
        limit: resolvedLimit,
        initialized: true,
      });
      return response;
    } catch (error: any) {
      set({
        error: error?.message ?? 'Failed to load sessions history',
        limit: targetLimit,
        initialized: true,
      });
      return undefined;
    } finally {
      set({ loading: false });
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
}));
