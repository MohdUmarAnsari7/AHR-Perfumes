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
  toggleFavorite: (product: any) => void;
  removeItem: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleFavorite: (product) => {
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        if (!isLoggedIn) {
          useAuthStore.getState().openAuthModal("signup");
          return;
        }
        set((state) => {
          const idStr = String(product.id);
          const exists = state.items.some((i) => String(i.id) === idStr);
          if (exists) {
            return {
              items: state.items.filter((i) => String(i.id) !== idStr),
            };
          } else {
            return {
              items: [
                ...state.items,
                {
                  id: idStr,
                  name: product.name,
                  category: product.category,
                  price: Number(product.price),
                  image: product.image,
                  rating: product.rating,
                },
              ],
            };
          }
        });
      },
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => String(item.id) !== String(id)),
      })),
      isFavorite: (id) => {
        const idStr = String(id);
        return get().items.some((item) => String(item.id) === idStr);
      },
      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'ahr-favorites-storage',
    }
  )
);
