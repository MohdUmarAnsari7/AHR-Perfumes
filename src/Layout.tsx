import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BottomNavigation } from "./components/BottomNavigation";
import { SEOHead } from "./components/SEOHead";
import { useAuthStore } from "./store/useAuth";
import { useFavoritesStore } from "./store/useFavorites";
import { useCartStore } from "./store/useCart";
import { WishlistDrawer } from "./components/WishlistDrawer";
import { AuthModal } from "./components/AuthModal";

export default function Layout() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const loadUserFavorites = useFavoritesStore((state) => state.loadUserFavorites);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
  const loadUserCart = useCartStore((state) => state.loadUserCart);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/supabase");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Keep-alive ping to keep the Render backend active (every 15 minutes)
  useEffect(() => {
    const pingHealth = () => {
      fetch("/api/health")
        .catch((err) => {
          // Silently catch and log as warn to prevent UI impact
          console.warn("Keep-alive health ping failed:", err);
        });
    };

    // Initial ping on mount
    pingHealth();

    // Ping every 15 minutes (15 * 60 * 1000 ms)
    const intervalId = setInterval(pingHealth, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadUserFavorites(user.id);
      loadUserCart(user.id);
    } else {
      clearFavorites();
      clearCart();
    }
  }, [isLoggedIn, user, loadUserFavorites, clearFavorites, loadUserCart, clearCart]);

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead />
      {!isAdminRoute && <TopBar />}
      {!isAdminRoute && <Header />}
      <main className={`flex-grow ${isAdminRoute ? "" : "pb-16 sm:pb-0"}`}>
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <BottomNavigation />}
      <WishlistDrawer />
      <AuthModal />
    </div>
  );
}

