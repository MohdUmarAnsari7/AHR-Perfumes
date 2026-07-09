import { create } from "zustand";
import { useCartStore } from "./useCart";

export interface CustomUser {
  id: string;
  email: string;
  mobile: string;
  name?: string;
  role: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  preferences?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthState {
  user: CustomUser | null;
  guestId: string;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  sessionToken: string | null;
  
  // Modal State Management
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup";
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
  
  // Auth Methods
  signUp: (params: { email: string; mobile: string; name?: string; password?: string }) => Promise<void>;
  login: (params: { identifier: string; password?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  getUserId: () => string;
  updateProfile: (params: {
    name?: string;
    mobile: string;
    shipping_address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    preferences?: string;
  }) => Promise<void>;
  fetchFreshProfile: () => Promise<void>;
}

// Generate an anonymous fallback guest ID
const getOrGenerateGuestId = () => {
  let gid = localStorage.getItem("ahr_guest_id");
  if (!gid) {
    gid = "guest_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("ahr_guest_id", gid);
  }
  return gid;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  guestId: getOrGenerateGuestId(),
  isLoggedIn: false,
  loading: false,
  error: null,
  sessionToken: null,

  // Modal State
  isAuthModalOpen: false,
  authModalTab: "login",
  openAuthModal: (tab = "login") => set({ isAuthModalOpen: true, authModalTab: tab, error: null }),
  closeAuthModal: () => set({ isAuthModalOpen: false, error: null }),

  getUserId: () => {
    const { user, guestId } = get();
    return user ? user.id : guestId;
  },

  signUp: async ({ email, mobile, name, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, mobile, name, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register.");
      }

      const mappedUser: CustomUser = {
        ...data.user,
        user_metadata: {
          full_name: data.user.name || data.user.email.split("@")[0]
        }
      };

      localStorage.setItem("ahr_session_token", data.sessionToken);
      localStorage.setItem("ahr_user", JSON.stringify(mappedUser));

      set({
        user: mappedUser,
        isLoggedIn: true,
        sessionToken: data.sessionToken,
        loading: false,
        isAuthModalOpen: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to sign up.", loading: false });
      throw err;
    }
  },

  login: async ({ identifier, password }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      const mappedUser: CustomUser = {
        ...data.user,
        user_metadata: {
          full_name: data.user.name || data.user.email.split("@")[0]
        }
      };

      localStorage.setItem("ahr_session_token", data.sessionToken);
      localStorage.setItem("ahr_user", JSON.stringify(mappedUser));

      set({
        user: mappedUser,
        isLoggedIn: true,
        sessionToken: data.sessionToken,
        loading: false,
        isAuthModalOpen: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to log in.", loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    const token = get().sessionToken;
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "x-session-token": token
          }
        });
      }
    } catch (err) {
      console.warn("Failed to sign out on server:", err);
    } finally {
      localStorage.removeItem("ahr_session_token");
      localStorage.removeItem("ahr_user");
      try {
        useCartStore.getState().clearCart();
      } catch (e) {
        console.warn("Failed to clear cart on sign out:", e);
      }
      set({
        user: null,
        isLoggedIn: false,
        sessionToken: null,
        loading: false
      });
    }
  },

  initialize: () => {
    const token = localStorage.getItem("ahr_session_token");
    const storedUser = localStorage.getItem("ahr_user");
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        set({ user: parsed, isLoggedIn: true, sessionToken: token });

        // Verify active session with the backend
        fetch("/api/auth/me", {
          headers: {
            "x-session-token": token,
          }
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              const mappedUser: CustomUser = {
                ...data.user,
                user_metadata: {
                  full_name: data.user.name || data.user.email.split("@")[0]
                }
              };
              set({ user: mappedUser, isLoggedIn: true });
              localStorage.setItem("ahr_user", JSON.stringify(mappedUser));
            }
          } else {
            // Token is invalid/expired
            localStorage.removeItem("ahr_session_token");
            localStorage.removeItem("ahr_user");
            set({ user: null, isLoggedIn: false, sessionToken: null });
          }
        }).catch(err => {
          console.warn("Auth check failed:", err);
        });
      } catch (e) {
        localStorage.removeItem("ahr_session_token");
        localStorage.removeItem("ahr_user");
      }
    }
  },

  updateProfile: async (params) => {
    set({ loading: true, error: null });
    const token = get().sessionToken;
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token || ""
        },
        body: JSON.stringify(params)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      const updatedUser: CustomUser = {
        ...data.user,
        user_metadata: {
          full_name: data.user.name || data.user.email.split("@")[0]
        }
      };

      localStorage.setItem("ahr_user", JSON.stringify(updatedUser));
      set({ user: updatedUser, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to update profile.", loading: false });
      throw err;
    }
  },

  fetchFreshProfile: async () => {
    const token = get().sessionToken;
    if (!token) return;
    try {
      const res = await fetch("/api/user/profile", {
        headers: {
          "x-session-token": token
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const freshUser: CustomUser = {
            ...data.user,
            user_metadata: {
              full_name: data.user.name || data.user.email.split("@")[0]
            }
          };
          set({ user: freshUser });
          localStorage.setItem("ahr_user", JSON.stringify(freshUser));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch fresh profile details:", e);
    }
  }
}));
