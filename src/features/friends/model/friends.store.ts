// src/features/friends/model/friends.store.ts
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
  remove: (uniqueId: string) => Promise<void>; // <-- меняем тип
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
        FriendsApi.requests(),
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

  async remove(uniqueId) {
    await FriendsApi.remove(uniqueId); // <-- передаем строку
    await get().fetchAll(); // обновляем список после удаления
  },
}));
