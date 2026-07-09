import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuth';

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  size?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (!isLoggedIn) {
          useAuthStore.getState().openAuthModal("signup");
          return;
        }
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
        ),
      })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getTotal: () => get().getSubtotal(), // Add taxes/shipping logic here if needed
    }),
    {
      name: 'ahr-cart-storage',
    }
  )
);
