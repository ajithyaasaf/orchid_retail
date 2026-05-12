import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemData {
  productId: string;
  variantId: string;
  quantity: number;
  // Snapshot at time of adding (for display)
  productName: string;
  productImage: string;
  productSlug: string;
  variantSize: string;
  variantColor: string;
  price: number;
  mrp: number;
  freeShipping?: boolean;
  
  // For Combos/Bundles
  comboId?: string;
  subItems?: {
    productId: string;
    variantId: string;
    productName: string;
    productImage: string;
    variantSize: string;
    variantColor: string;
    sku: string;
  }[];
}

interface CartStore {
  items: CartItemData[];
  isDrawerOpen: boolean;

  // Actions
  addItem: (item: CartItemData) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
  hasFreeShippingItem: () => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (item) => {
        const existing = get().items.find(i => i.variantId === item.variantId);
        if (existing) {
          set({
            items: get().items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
        set({ isDrawerOpen: true });
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter(i => i.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map(i =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      hasFreeShippingItem: () => get().items.some(i => i.freeShipping),
    }),
    { name: 'orchid-cart' }
  )
);
