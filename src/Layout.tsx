import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SEOHead } from "./components/SEOHead";
import { useAuthStore } from "./store/useAuth";
import { WishlistDrawer } from "./components/WishlistDrawer";
import { AuthModal } from "./components/AuthModal";

export default function Layout() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead />
      <TopBar />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <WishlistDrawer />
      <AuthModal />
    </div>
  );
}

