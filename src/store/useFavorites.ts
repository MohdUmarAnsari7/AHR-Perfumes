import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuth';

export interface FavoriteItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  rating?: string | number;
}

interface FavoritesStore {
  items: FavoriteItem[];
  itemsByUser: Record<string, FavoriteItem[]>;
  toggleFavorite: (product: any) => void;
  removeItem: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
  loadUserFavorites: (userId: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      itemsByUser: {},
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      loadUserFavorites: (userId) => {
        if (!userId) return;
        const stringUserId = String(userId);
        set((state) => ({
          items: state.itemsByUser?.[stringUserId] || [],
        }));
      },
      toggleFavorite: (product) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          useAuthStore.getState().openAuthModal("signup");
          return;
        }
        const stringUserId = String(user.id);
        set((state) => {
          const idStr = String(product.id);
          const currentItems = state.itemsByUser?.[stringUserId] || [];
          const exists = currentItems.some((i) => String(i.id) === idStr);
          let updatedItems: FavoriteItem[];
          
          if (exists) {
            updatedItems = currentItems.filter((i) => String(i.id) !== idStr);
          } else {
            updatedItems = [
              ...currentItems,
              {
                id: idStr,
                name: product.name,
                category: product.category,
                price: Number(product.price),
                image: product.image,
                rating: product.rating,
              },
            ];
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
        const idStr = String(id);
        set((state) => {
          const currentItems = state.itemsByUser?.[stringUserId] || [];
          const updatedItems = currentItems.filter((item) => String(item.id) !== idStr);
          return {
            items: updatedItems,
            itemsByUser: {
              ...(state.itemsByUser || {}),
              [stringUserId]: updatedItems,
            },
          };
        });
      },
      isFavorite: (id) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;
        const stringUserId = String(user.id);
        const idStr = String(id);
        const currentItems = get().itemsByUser?.[stringUserId] || [];
        return currentItems.some((item) => String(item.id) === idStr);
      },
      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'ahr-favorites-storage',
    }
  )
);
