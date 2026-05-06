import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // Array of product IDs

  toggle: (productId: string | undefined | null) => void;
  remove: (productId: string) => void;
  removeMany: (productIds: string[]) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (productId) => {
        // Guard: ignore falsy or whitespace-only IDs
        if (!productId || typeof productId !== 'string' || productId.trim() === '') return;
        const trimmed = productId.trim();
        const items = get().items;
        if (items.includes(trimmed)) {
          set({ items: items.filter(id => id !== trimmed) });
        } else {
          set({ items: [...items, trimmed] });
        }
      },

      remove: (productId) => {
        if (!productId) return;
        set({ items: get().items.filter(id => id !== productId) });
      },
      
      removeMany: (productIds) => {
        if (!productIds || productIds.length === 0) return;
        const setIds = new Set(productIds.map(id => typeof id === 'string' ? id.trim() : id));
        set({ 
          items: get().items.filter(id => {
            const cleanId = typeof id === 'string' ? id.trim() : id;
            return !setIds.has(cleanId);
          }) 
        });
      },

      isWishlisted: (productId) => {
        if (!productId) return false;
        return get().items.includes(productId.trim());
      },

      clear: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    {
      name: 'orchid-wishlist',
      // On rehydration, strip any corrupted entries (non-string / empty)
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.filter(
            (id) => id && typeof id === 'string' && id.trim().length > 0
          );
        }
      },
    }
  )
);
