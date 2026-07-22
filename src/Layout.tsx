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

  // Keep-alive ping to keep the Render backend active (every 10 minutes)
  useEffect(() => {
    const pingHealth = () => {
      const pingUrl = (import.meta as any).env?.VITE_RENDER_URL 
        ? `${(import.meta as any).env.VITE_RENDER_URL}/api/health` 
        : "https://ahr-perfumes-1.onrender.com/api/health";

      fetch(pingUrl)
        .then((res) => console.log(`[Ping] Kept Render backend alive, status: ${res.status}`))
        .catch((err) => console.error("[Ping] Error pinging Render backend:", err.message));
    };

    // Initial ping on mount
    pingHealth();

    // Ping every 10 minutes (10 * 60 * 1000 ms)
    const intervalId = setInterval(pingHealth, 10 * 60 * 1000);

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

