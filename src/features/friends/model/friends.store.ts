import { create } from 'zustand';
import { FriendsApi } from '../api/friends.api';

type State = {
  friends: any[];
  requestsRaw: any | null;
  loading: boolean;
  error?: string;
};

type Actions = {
  fetchAll: () => Promise<void>;
  search: (q: string) => Promise<any[]>;
  send: (uniqueId: string) => Promise<void>;
  remove: (userId: number) => Promise<void>;
};

export const useFriendsStore = create<State & Actions>((set, get) => ({
  friends: [],
  requestsRaw: null,
  loading: false,

  async fetchAll() {
    set({ loading: true, error: undefined });
    try {
      const [friends, requestsRaw] = await Promise.all([
        FriendsApi.list(),
        FriendsApi.requests()
      ]);
      set({ friends, requestsRaw });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load' });
    } finally {
      set({ loading: false });
    }
  },

  async search(q) {
    return FriendsApi.search(q);
  },

  async send(uniqueId) {
    await FriendsApi.sendRequest(uniqueId);
    await get().fetchAll();
  },

  async remove(userId) {
    await FriendsApi.remove(userId);
    await get().fetchAll();
  }
}));
