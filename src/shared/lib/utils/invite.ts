// src/shared/lib/utils/invite.ts
export type InviteKind = 'friend' | 'group';

export function parseInviteFromScan(raw: string): { kind: InviteKind; token: string } | null {
  try {
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) return null;
    const u = new URL(raw);
    const token = u.searchParams.get('token');
    if (!token) return null;

    const path = u.pathname;
    if (path.startsWith('/friends/join')) return { kind: 'friend', token };
    if (path.startsWith('/groups/join')) return { kind: 'group', token };
    return null;
  } catch {
    return null;
  }
}
