/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { useBusinessInfoStore } from "./store/useBusinessInfo";
import { useWebsiteContentStore } from "./store/useWebsiteContent";
import Layout from "./Layout";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Shop from "./pages/Shop";
import Categories from "./pages/Categories";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import SupabaseConsole from "./pages/SupabaseConsole";
import Auth from "./pages/Auth";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";

export default function App() {
  const fetchInfo = useBusinessInfoStore((state) => state.fetchInfo);
  const fetchContent = useWebsiteContentStore((state) => state.fetchContent);

  useEffect(() => {
    fetchInfo();
    fetchContent();
  }, [fetchInfo, fetchContent]);

  // Keep Render backend active by pinging the health endpoint every 13 minutes
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await fetch("/api/health");
      } catch (err) {
        // Silent error to prevent impacting user experience
        console.debug("Backend keep-alive ping failed:", err);
      }
    };

    // Ping once immediately on load
    pingBackend();

    // Set interval for every 13 minutes (13 mins * 60 secs * 1000 ms)
    const intervalId = setInterval(pingBackend, 13 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="collections" element={<Shop />} /> {/* Redirect/Alias to Shop for now */}
            <Route path="about" element={<About />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="contact" element={<Contact />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="account" element={<Auth />} />
            <Route path="auth" element={<Auth />} />
            <Route path="supabase" element={<SupabaseConsole />} />
            <Route path="admin" element={<SupabaseConsole />} />
            {/* Creating simple placeholders for other routes so it doesn't break */}
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}


