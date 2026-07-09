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
  itemsByUser: Record<string, CartItem[]>;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  loadUserCart: (userId: string) => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      itemsByUser: {},
      loadUserCart: async (userId) => {
        if (!userId) return;
        const stringUserId = String(userId);
        
        // Load initial local user cart items
        const localItems = get().itemsByUser?.[stringUserId] || [];
        set({ items: localItems });

        // Try syncing from backend database if active
        const token = useAuthStore.getState().sessionToken;
        if (token) {
          try {
            const res = await fetch("/api/cart", {
              headers: {
                "x-session-token": token,
              },
            });
            if (res.ok) {
              const dbCartItems = await res.json();
              if (Array.isArray(dbCartItems) && dbCartItems.length > 0) {
                const prodRes = await fetch("/api/products");
                if (prodRes.ok) {
                  const products = await prodRes.json();
                  const mappedItems: CartItem[] = [];
                  
                  for (const dbItem of dbCartItems) {
                    const product = products.find((p: any) => String(p.id) === String(dbItem.productId));
                    if (product) {
                      mappedItems.push({
                        id: String(product.id),
                        name: product.name,
                        category: product.category,
                        price: Number(product.price),
                        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                        quantity: dbItem.quantity,
                        image: product.image,
                      });
                    }
                  }

                  if (mappedItems.length > 0) {
                    set((state) => ({
                      items: mappedItems,
                      itemsByUser: {
                        ...(state.itemsByUser || {}),
                        [stringUserId]: mappedItems,
                      },
                    }));
                  }
                }
              }
            }
          } catch (err) {
            console.warn("Failed to sync cart from server:", err);
          }
        }
      },
      addItem: (item) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          useAuthStore.getState().openAuthModal("signup");
          return;
        }
        const stringUserId = String(user.id);
        const token = useAuthStore.getState().sessionToken;

        set((state) => {
          const currentItems = state.itemsByUser?.[stringUserId] || [];
          const existingItem = currentItems.find((i) => i.id === item.id);
          let updatedItems: CartItem[];

          if (existingItem) {
            updatedItems = currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            );
          } else {
            updatedItems = [...currentItems, item];
          }

          if (token) {
            fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-session-token": token,
              },
              body: JSON.stringify({
                productId: item.id,
                quantity: item.quantity,
              }),
            }).catch((err) => console.warn("Failed to sync add to backend:", err));
          }

          return {
            items: updatedItems,
            itemsByUser: {
              ...(state.itemsByUser || {}),
              [stringUserId]: updatedItems,
            },
          };
        });
      },
      removeItem: (id) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const stringUserId = String(user.id);
        const token = useAuthStore.getState().sessionToken;

        set((state) => {
          const currentItems = state.itemsByUser?.[stringUserId] || [];
          const updatedItems = currentItems.filter((item) => item.id !== id);

          if (token) {
            fetch(`/api/cart/product/${id}`, {
              method: "DELETE",
              headers: {
                "x-session-token": token,
              },
            }).catch((err) => console.warn("Failed to sync remove from backend:", err));
          }

          return {
            items: updatedItems,
            itemsByUser: {
              ...(state.itemsByUser || {}),
              [stringUserId]: updatedItems,
            },
          };
        });
      },
      updateQuantity: (id, quantity) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const stringUserId = String(user.id);
        const token = useAuthStore.getState().sessionToken;
        const cleanQty = Math.max(1, quantity);

        set((state) => {
          const currentItems = state.itemsByUser?.[stringUserId] || [];
          const updatedItems = currentItems.map((item) =>
            item.id === id ? { ...item, quantity: cleanQty } : item
          );

          if (token) {
            fetch(`/api/cart/product/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "x-session-token": token,
              },
              body: JSON.stringify({ quantity: cleanQty }),
            }).catch((err) => console.warn("Failed to sync quantity to backend:", err));
          }

          return {
            items: updatedItems,
            itemsByUser: {
              ...(state.itemsByUser || {}),
              [stringUserId]: updatedItems,
            },
          };
        });
      },
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getTotal: () => get().getSubtotal(),
    }),
    {
      name: 'ahr-cart-storage',
    }
  )
);
