import { create } from 'zustand';

interface SearchStore {
  homeSearchQuery: string;
  setHomeSearchQuery: (query: string) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  homeSearchQuery: '',
  setHomeSearchQuery: (query) => set({ homeSearchQuery: query }),
}));
