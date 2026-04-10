const lastSeenMap = new Map<string, number>();

const ONLINE_WINDOW_MS = 45_000;

export function markUserSeen(userId: string) {
  lastSeenMap.set(userId, Date.now());
}

export function markUserOffline(userId: string) {
  lastSeenMap.delete(userId);
}

export function getPresence(userIds: string[]) {
  const now = Date.now();
  const result: Record<string, { isOnline: boolean; lastSeenAt: number | null }> = {};
  for (const userId of userIds) {
    const seenAt = lastSeenMap.get(userId) ?? null;
    result[userId] = {
      isOnline: seenAt !== null && now - seenAt <= ONLINE_WINDOW_MS,
      lastSeenAt: seenAt,
    };
  }
  return result;
}
