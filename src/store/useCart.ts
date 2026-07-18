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
                      const itemSize = dbItem.size || "6ml";
                      let displayPrice = Number(product.price);
                      let displayOriginalPrice = product.originalPrice ? Number(product.originalPrice) : undefined;

                      let parsedSizes: any[] = [];
                      if (product.sizes) {
                        try {
                          parsedSizes = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
                        } catch (e) {}
                      }
                      if (!Array.isArray(parsedSizes)) parsedSizes = [];

                      if (parsedSizes.length > 0) {
                        const matched = parsedSizes.find((s: any) => {
                          if (typeof s === "string") return s === itemSize;
                          if (typeof s === "object" && s !== null && "size" in s) {
                            return String(s.size).toLowerCase() === itemSize.toLowerCase();
                          }
                          return false;
                        });
                        if (matched && typeof matched === "object" && "price" in matched && matched.price) {
                          displayPrice = parseFloat(matched.price);
                        }
                        if (matched && typeof matched === "object" && "originalPrice" in matched && matched.originalPrice) {
                          displayOriginalPrice = parseFloat(matched.originalPrice);
                        }
                      } else {
                        const basePrice = parseFloat(product.price);
                        if (itemSize === "3ml") displayPrice = Math.round(basePrice * 0.5);
                        else if (itemSize === "6ml") displayPrice = Math.round(basePrice * 0.75);
                        else if (itemSize === "12ml") displayPrice = basePrice;
                        else if (itemSize === "100ml") displayPrice = Math.round(basePrice * 1.6);

                        if (product.originalPrice) {
                          const baseOrig = parseFloat(String(product.originalPrice));
                          if (itemSize === "3ml") displayOriginalPrice = Math.round(baseOrig * 0.5);
                          else if (itemSize === "6ml") displayOriginalPrice = Math.round(baseOrig * 0.75);
                          else if (itemSize === "12ml") displayOriginalPrice = baseOrig;
                          else if (itemSize === "100ml") displayOriginalPrice = Math.round(baseOrig * 1.6);
                        }
                      }

                      mappedItems.push({
                        id: `${product.id}_${itemSize}`,
                        name: `${product.name} (${itemSize})`,
                        category: product.category,
                        price: displayPrice,
                        originalPrice: displayOriginalPrice,
                        quantity: dbItem.quantity,
                        image: product.image,
                        size: itemSize,
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
