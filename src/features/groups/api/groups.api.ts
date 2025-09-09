import { apiClient } from '@/features/auth/api';

const enc = encodeURIComponent;

export type Group = {
  id: number;
  name: string;
  ownerId?: number;
};

export type GroupMember = {
  uniqueId: string;
  username?: string;
  displayName?: string;
  id?: number; // backend may include numeric id
  role?: 'owner' | 'member';
};

export type GroupDetails = {
  group: Group;
  members: GroupMember[];
  role: 'owner' | 'member'; // current user's role
};

export const GroupsApi = {
  async list(): Promise<Group[]> {
    const { data } = await apiClient.get('/groups');
    return data;
  },

  async create(name: string): Promise<Group> {
    const { data } = await apiClient.post('/groups', { name });
    return data;
  },

  async rename(groupId: number, name: string): Promise<Group> {
    const { data } = await apiClient.patch(`/groups/${groupId}`, { name });
    return data;
  },

  async remove(groupId: number): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`/groups/${groupId}`);
    return data;
  },

  async details(groupId: number): Promise<GroupDetails> {
    const { data } = await apiClient.get(`/groups/${groupId}`);
    return data;
  },

  async addMember(groupId: number, uniqueId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/groups/${groupId}/members`, { uniqueId });
    return data;
  },

  async removeMember(groupId: number, uniqueId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`/groups/${groupId}/members/${enc(uniqueId)}`);
    return data;
  },

  async promote(groupId: number, uniqueId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.patch(`/groups/${groupId}/members/${enc(uniqueId)}/promote`);
    return data;
  },

  async createInvite(groupId: string | number, expiresInSeconds: number) {
    const gid = String(groupId);
    const { data } = await apiClient.post(`/groups/${gid}/invite`, { expiresInSeconds });
    return data as { token: string; url: string; expiresAt: string };
  },

  /** POST /groups/join { token } -> 200 */
  async joinByToken(token: string) {
    const { data } = await apiClient.post('/groups/join', { token });
    return data;
  },
};
