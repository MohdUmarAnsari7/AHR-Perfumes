import { create } from "zustand";
import { businessInfo as staticBusinessInfo } from "../data";

interface BusinessInfoStore {
  info: any;
  loading: boolean;
  fetchInfo: () => Promise<void>;
}

export const useBusinessInfoStore = create<BusinessInfoStore>((set) => ({
  info: staticBusinessInfo,
  loading: false,
  fetchInfo: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/business-info");
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          set({ info: data });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch business info from database, using static fallback:", err);
    } finally {
      set({ loading: false });
    }
  }
}));
