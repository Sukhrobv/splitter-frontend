import { z } from 'zod';

export const ZUserPublic = z.object({
  id: z.number(),
  username: z.string().optional(),
  uniqueId: z.string().optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
});
export type UserPublic = z.infer<typeof ZUserPublic>;

export const ZIncomingRequest = z.object({
  id: z.number(),
  from: z.object({
    id: z.number(),
    email: z.string().email().optional(),
    username: z.string().optional(),
    uniqueId: z.string().optional()
  })
}).catchall(z.unknown());

export type IncomingRequest = z.infer<typeof ZIncomingRequest>;

// Пакет для всего ответа /friends/requests
export const ZRequestsPayload = z.object({
  incoming: z.array(ZIncomingRequest).optional(),
  outgoing: z.array(z.unknown()).optional() // форму outgoing уточним позже
}).catchall(z.unknown());

export type RequestsPayload = z.infer<typeof ZRequestsPayload>;
