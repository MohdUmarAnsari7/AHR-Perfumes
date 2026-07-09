import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Eye, RotateCcw } from "lucide-react";
import { useCartStore } from "../store/useCart";
import { useFavoritesStore } from "../store/useFavorites";
import { useSearchStore } from "../store/useSearch";

import { Hero } from "../components/Hero";
import { FeatureHighlights } from "../components/FeatureHighlights";
import { ProductCarousel } from "../components/ProductCarousel";
import { FeaturedCollections } from "../components/FeaturedCollections";
import { Gallery, Stats } from "../components/GalleryAndStats";
import { ContactCTA } from "../components/ContactCTA";
import { ProductCard } from "../components/ProductCard";

export default function Home() {
  const [loadedProducts, setLoadedProducts] = useState<any[]>([]);
  const homeSearchQuery = useSearchStore((state) => state.homeSearchQuery);
  const setHomeSearchQuery = useSearchStore((state) => state.setHomeSearchQuery);
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLoadedProducts(data);
        }
      })
      .catch((err) => {
        console.log("Error fetching home products:", err);
      });
  }, []);

  const filteredProducts = loadedProducts.filter((product) => {
    if (homeSearchQuery) {
      const query = homeSearchQuery.toLowerCase().trim();
      
      // Extract numbers (digits) from the query to check if user has written a price
      const digitsOnly = query.replace(/[^\d]/g, "");
      const hasNumber = digitsOnly.length > 0;
      
      if (hasNumber) {
        const parsedNumber = parseFloat(digitsOnly);
        
        // Remove the digits from the search string to check for accompanying text search
        const remainingText = query.replace(/\d+/g, "").trim();
        
        // Filter out common helper/filler words
        const fillerWords = ["under", "below", "less", "than", "up", "to", "price", "rs", "rupees", "inr", "maximum", "max", "around", "about", "budget", "for"];
        const words = remainingText.split(/\s+/).filter(w => w && !fillerWords.includes(w));
        
        if (words.length > 0) {
          const finalSearchText = words.join(" ");
          const matchText = 
            product.name?.toLowerCase().includes(finalSearchText) ||
            product.category?.toLowerCase().includes(finalSearchText) ||
            product.description?.toLowerCase().includes(finalSearchText);
          
          return matchText && product.price <= parsedNumber;
        } else {
          // If query only contains number/filler words (e.g. "under 1500"), filter by price <= parsedNumber
          return product.price <= parsedNumber;
        }
      } else {
        // Text-only search
        return (
          product.name?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
        );
      }
    }
    return true;
  });

  return (
    <>
      <Hero />
      
      {homeSearchQuery ? (
        <section className="py-24 bg-[#FAF9F6]">
          <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            
            {/* Header section of search results */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 pb-6 border-b border-stone-200">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-2">
                  Search Results
                </h2>
                <p className="text-xs text-stone-500 uppercase tracking-widest">
                  Showing matches for "{homeSearchQuery}"
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 md:mt-0 gap-6">
                <span className="text-stone-600 text-sm uppercase tracking-widest font-mono">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </span>
                <button
                  onClick={() => setHomeSearchQuery("")}
                  className="flex items-center space-x-2 text-xs uppercase tracking-widest text-stone-600 hover:text-gold-accent transition-colors font-bold border border-stone-200 hover:border-gold-primary bg-white px-4 py-2.5 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Search</span>
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white border border-stone-200 rounded-sm shadow-sm max-w-4xl mx-auto">
                <p className="text-stone-500 text-sm uppercase tracking-widest mb-6">
                  No luxury fragrances match your search criteria.
                </p>
                <button
                  onClick={() => setHomeSearchQuery("")}
                  className="px-8 py-3.5 bg-gold-primary hover:bg-gold-accent text-black text-xs font-semibold uppercase tracking-widest transition-colors shadow-sm"
                >
                  View All Collections
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      key={product.id}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <FeatureHighlights />
          <ProductCarousel />
          <FeaturedCollections />
          <Gallery />
          <Stats />
          <ContactCTA />
        </>
      )}
    </>
  );
}
