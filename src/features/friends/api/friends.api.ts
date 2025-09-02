import { apiClient } from '@/features/auth/api'       // единый axios-инстанс проекта
import { z } from 'zod'
import { ZRequestsPayload } from '../model/types'

// Временные «loose»-схемы, пока не зафиксировали точные ответы
const ZUserLoose = z.object({
  id: z.number().optional(),
  userId: z.number().optional(),
  username: z.string().optional(),
  uniqueId: z.string().optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
}).catchall(z.unknown())

const ZFriendLoose = z.object({
  user: ZUserLoose.optional(),
  uniqueId: z.string().optional(),
  username: z.string().optional(),
}).transform((f) => ({
  uniqueId: f.uniqueId ?? f.user?.uniqueId,
  username: f.username ?? f.user?.username,
  raw: f,
}));

export const FriendsApi = {
  /** GET /friends — список друзей */
  async list() {
    const { data } = await apiClient.get('/friends')
    return z.array(ZFriendLoose).parse(data)
  },

  /** GET /friends/requests — входящие/исходящие заявки */
  async requests() {
    const { data } = await apiClient.get('/friends/requests')
    return ZRequestsPayload.parse(data)
  },

  /** GET /friends/search?q=USER#1234 — поиск по uniqueId */
  async search(q: string) {
    const { data } = await apiClient.get('/friends/search', { params: { q } })
    return z.array(ZUserLoose).parse(data)
  },

  /** POST /friends/request { uniqueId } — отправить инвайт */
  async sendRequest(uniqueId: string) {
    const { data } = await apiClient.post('/friends/request', { uniqueId })
    return data
  },

  /** PATCH /friends/accept — { uniqueId, requesterId } */
  async accept(uniqueId: string, requesterId: number) {
    const { data } = await apiClient.patch('/friends/accept', { uniqueId, requesterId })
    return data
  },

  /** PATCH /friends/reject — { uniqueId, requesterId } */
  async reject(uniqueId: string, requesterId: number) {
    const { data } = await apiClient.patch('/friends/reject', { uniqueId, requesterId })
    return data
  },

  /** DELETE /friends/{userId} — удалить из друзей/отменить связь */
  async remove(uniqueId: string) {
    const { data } = await apiClient.delete(`/friends/${encodeURIComponent(uniqueId)}`);
    return data as { success?: boolean; removed?: boolean };
  },
};
