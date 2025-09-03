import { create } from 'zustand';
import { GroupsApi, Group, GroupDetails } from '../api/groups.api';

type State = {
  groups: Group[];
  current?: GroupDetails;
  counts: Record<number, number>;
  loading: boolean;
  error?: string;
};

type Actions = {
  fetchGroups: () => Promise<void>;
  hydrateCounts: () => Promise<void>;
  openGroup: (groupId: number) => Promise<void>;
  createGroup: (name: string) => Promise<Group>;
  renameGroup: (groupId: number, name: string) => Promise<void>;
  deleteGroup: (groupId: number) => Promise<void>;
  addMember: (groupId: number, uniqueId: string) => Promise<void>;
  removeMember: (groupId: number, uniqueId: string) => Promise<void>;
};

export const useGroupsStore = create<State & Actions>((set, get) => ({
  groups: [],
  current: undefined,
  counts: {},
  loading: false,

  async fetchGroups() {
    set({ loading: true, error: undefined });
    try {
      const groups = await GroupsApi.list();
      set({ groups });
      // не блокируем UI: подтянем counts отдельно
      get().hydrateCounts().catch(() => {});
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load groups' });
    } finally {
      set({ loading: false });
    }
  },

  async hydrateCounts() {
    const { groups } = get();
    if (!groups?.length) return;
    const results = await Promise.allSettled(groups.map(g => GroupsApi.details(g.id)));
    const map: Record<number, number> = {};
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        const g = groups[idx];
        map[g.id] = r.value?.members?.length ?? 0;
      }
    });
    set(s => ({ counts: { ...s.counts, ...map } }));
  },

  async openGroup(groupId) {
    set({ loading: true, error: undefined });
    try {
      const current = await GroupsApi.details(groupId);
      set({ current });
      // обновим счётчик
      set(s => ({ counts: { ...s.counts, [groupId]: current.members?.length ?? 0 } }));
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load group' });
    } finally {
      set({ loading: false });
    }
  },

  async createGroup(name) {
    const g = await GroupsApi.create(name);
    await get().fetchGroups();
    return g;
  },

  async renameGroup(groupId, name) {
    await GroupsApi.rename(groupId, name);
    await get().openGroup(groupId);
    await get().fetchGroups();
  },

  async deleteGroup(groupId) {
    await GroupsApi.remove(groupId);
    set({ current: undefined });
    await get().fetchGroups();
  },

  async addMember(groupId, uniqueId) {
    await GroupsApi.addMember(groupId, uniqueId);
    await get().openGroup(groupId);
  },

  async removeMember(groupId, uniqueId) {
    await GroupsApi.removeMember(groupId, uniqueId);
    await get().openGroup(groupId);
  },
}));
