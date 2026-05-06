import { useState, useEffect } from 'react';

const GUEST_ID_KEY = 'orchid-guest-id';

/**
 * Returns a stable guest ID persisted in localStorage.
 * This ties addresses, orders and cart data to a session without requiring auth.
 * The ID is a UUIDv4 generated once per browser and never changes.
 *
 * Returns null during SSR (before hydration).
 */
export function useGuestId(): string | null {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      // Generate a v4 UUID-like ID using crypto API
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    setGuestId(id);
  }, []);

  return guestId;
}
