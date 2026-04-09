import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // Array of product IDs

  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (productId) => {
        const items = get().items;
        if (items.includes(productId)) {
          set({ items: items.filter(id => id !== productId) });
        } else {
          set({ items: [...items, productId] });
        }
      },

      isWishlisted: (productId) => get().items.includes(productId),

      clear: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    { name: 'orchid-wishlist' }
  )
);
