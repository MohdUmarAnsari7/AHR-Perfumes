import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  guestId: string;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  mockOtp: string | null;
  forceSandboxMode: boolean;
  
  // Modal State Management
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup";
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
  
  // OTP Methods
  sendOtp: (email: string, fullName?: string) => Promise<void>;
  verifyOtp: (email: string, token: string, fullName?: string) => Promise<void>;
  
  // Sandbox Toggle
  enableSandboxMode: () => void;
  
  // Backwards compatible sign-out and guest
  signOut: () => Promise<void>;
  initialize: () => void;
  getUserId: () => string;
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
  mockOtp: null,
  forceSandboxMode: false,

  // Modal State
  isAuthModalOpen: false,
  authModalTab: "login",
  openAuthModal: (tab = "login") => set({ isAuthModalOpen: true, authModalTab: tab, error: null, mockOtp: null }),
  closeAuthModal: () => set({ isAuthModalOpen: false, error: null, mockOtp: null }),

  enableSandboxMode: () => set({ forceSandboxMode: true, error: null, mockOtp: null }),

  getUserId: () => {
    const { user, guestId } = get();
    return user ? user.id : guestId;
  },

  sendOtp: async (email, fullName) => {
    set({ loading: true, error: null, mockOtp: null });

    const isUsingSandbox = !isSupabaseConfigured || get().forceSandboxMode;

    if (isUsingSandbox) {
      // Mock OTP Flow
      console.warn("Using simulated sandbox mode. Generating OTP...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Generate a simple 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[MOCK OTP] Sent to ${email} (Name: ${fullName || "Guest"}). Verification Code: ${generatedOtp}`);
      set({ loading: false, mockOtp: generatedOtp });
      return;
    }

    try {
      // Send OTP via Supabase
      const { error } = await supabase!.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: fullName ? { full_name: fullName } : {},
        }
      });

      if (error) throw error;
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to send verification code.", loading: false });
      throw err;
    }
  },

  verifyOtp: async (email, token, fullName) => {
    set({ loading: true, error: null });

    const isUsingSandbox = !isSupabaseConfigured || get().forceSandboxMode;

    if (isUsingSandbox) {
      // Mock Verify OTP Flow
      console.warn("Using simulated sandbox mode. Verifying OTP...");
      await new Promise((resolve) => setTimeout(resolve, 850));

      const storedOtp = get().mockOtp;
      if (token === "123456" || token === storedOtp) {
        const mockUser = {
          id: "mock_user_" + Math.random().toString(36).substring(2, 9),
          email,
          user_metadata: { full_name: fullName || email.split("@")[0] },
          aud: "authenticated",
          role: "authenticated",
          created_at: new Date().toISOString()
        } as unknown as User;

        set({ user: mockUser, isLoggedIn: true, loading: false, isAuthModalOpen: false, mockOtp: null });
      } else {
        const err = new Error("Invalid verification code. Please check your OTP and try again (sandbox accepts '123456' or the generated code).");
        set({ error: err.message, loading: false });
        throw err;
      }
      return;
    }

    try {
      const { data, error } = await supabase!.auth.verifyOtp({
        email,
        token,
        type: "email"
      });

      if (error) throw error;

      // If user is logged in, optionally update full name metadata if registering
      if (data.user && fullName) {
        const { error: updateError } = await supabase!.auth.updateUser({
          data: { full_name: fullName }
        });
        if (updateError) {
          console.error("Failed to update full name metadata after verification:", updateError);
        } else {
          // fetch fresh session user
          const { data: { user: freshUser } } = await supabase!.auth.getUser();
          if (freshUser) {
            data.user = freshUser;
          }
        }
      }

      set({ 
        user: data.user, 
        isLoggedIn: !!data.user, 
        loading: false, 
        isAuthModalOpen: !data.user 
      });
    } catch (err: any) {
      set({ error: err.message || "Invalid OTP code or verification failed.", loading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    const isUsingSandbox = !isSupabaseConfigured || get().forceSandboxMode;

    if (isUsingSandbox) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      set({ user: null, isLoggedIn: false, loading: false });
      return;
    }

    try {
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoggedIn: false, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  initialize: () => {
    if (!isSupabaseConfigured) return;

    // Get initial session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({ user: session.user, isLoggedIn: true });
      }
    });

    // Listen to auth state updates
    supabase!.auth.onAuthStateChange((_event, session) => {
      set({ 
        user: session?.user ?? null, 
        isLoggedIn: !!session?.user,
        error: null
      });
    });
  }
}));
