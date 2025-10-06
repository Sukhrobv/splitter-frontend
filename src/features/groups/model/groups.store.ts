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
  clearCurrent: () => void;
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
      const countsFromGroups = groups.reduce<Record<number, number>>((acc, group) => {
        if (Array.isArray(group.members)) {
          acc[group.id] = group.members.length;
        } else if (typeof group.counts?.members === 'number') {
          acc[group.id] = group.counts.members;
        }
        return acc;
      }, {});
      set(state => ({
        groups,
        counts: { ...state.counts, ...countsFromGroups },
      }));
      const needsHydrate = groups.some(group => !Array.isArray(group.members));
      if (needsHydrate) {
        get().hydrateCounts().catch(() => {});
      }
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load groups' });
    } finally {
      set({ loading: false });
    }
  },

  async hydrateCounts() {
    const { groups } = get();
    const targets = (groups ?? []).filter(group => !Array.isArray(group.members));
    if (!targets.length) return;
    const results = await Promise.allSettled(targets.map(group => GroupsApi.details(group.id)));
    const map: Record<number, number> = {};
    const updatedGroups = [...groups];
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const groupId = targets[idx].id;
        map[groupId] = result.value?.members?.length ?? 0;
        const index = updatedGroups.findIndex(g => g.id === groupId);
        if (index !== -1) {
          updatedGroups[index] = { ...updatedGroups[index], members: result.value.members };
        }
      }
    });
    set(state => ({
      counts: { ...state.counts, ...map },
      groups: updatedGroups,
    }));
  },

  async openGroup(groupId) {
    set({ loading: true, error: undefined });
    try {
      const current = await GroupsApi.details(groupId);
      set(state => ({
        current,
        counts: { ...state.counts, [groupId]: current.members?.length ?? 0 },
        groups: state.groups.map(group =>
          group.id === groupId ? { ...group, members: current.members } : group
        ),
      }));
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

  clearCurrent() {
    set({ current: undefined });
  },
}));

