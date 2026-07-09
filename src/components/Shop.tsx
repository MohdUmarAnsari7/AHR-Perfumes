import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { motion, AnimatePresence } from "motion/react";
import { Filter, ChevronDown, Heart, Eye, Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useCartStore } from "../store/useCart";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { useFavoritesStore } from "../store/useFavorites";
import { ProductCard } from "./ProductCard";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [loadedProducts, setLoadedProducts] = useState<any[]>([]);
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const info = useBusinessInfoStore((state) => state.info);
  const { websiteSections } = useWebsiteContentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [priceLimit, setPriceLimit] = useState<number>(10000);
  const [maxProductPrice, setMaxProductPrice] = useState<number>(10000);

  const shopHero = websiteSections?.shop?.hero || {
    title: "Our Collection",
    subtitle: "Pure Essence of Indore",
    bgImage: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2500&auto=format&fit=crop"
  };

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLoadedProducts(data);
          const max = data.length > 0 ? Math.max(...data.map(p => p.price), 5000) : 5000;
          setMaxProductPrice(max);
          setPriceLimit(max);
        }
      })
      .catch((err) => {
        console.log("Error loading shop products:", err);
        setMaxProductPrice(5000);
        setPriceLimit(5000);
      });
  }, []);

  const categories = Array.from(new Set(loadedProducts.map((p) => p.category))) as string[];
  
  const filteredProducts = loadedProducts.filter((product) => {
    // 1. Category Filter
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }

    // 2. Intelligent Search (by Name and/or Price)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      
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

  const handleCategorySelect = (category: string | null) => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  return (
    <>
      <Helmet>
        <title>Shop Luxury Fragrances | {info.name}</title>
        <meta name="description" content="Explore our collection of premium attars, luxury perfumes, and authentic bakhoor. Shop online with A.H.R Perfumes." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative w-full h-[35vh] md:h-[40vh] xl:h-[50vh] flex items-center justify-center overflow-hidden bg-white mt-[72px]">
        <div className="absolute inset-0">
          <img
            src={shopHero.bgImage}
            alt={shopHero.title}
            className="w-full h-full object-cover opacity-100"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl md:text-5xl text-white mb-3 uppercase tracking-widest leading-snug drop-shadow-md"
          >
            {shopHero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs md:text-sm text-stone-200 uppercase tracking-widest mb-6 leading-relaxed drop-shadow-sm"
          >
            {shopHero.subtitle}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-[2px] bg-gold-primary mx-auto shadow-sm"
          ></motion.div>
        </div>
      </section>

      <section className="py-10 bg-[#FAF9F6]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          
          {/* Elegant Wide Search Bar */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 group-focus-within:text-gold-accent transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search luxury scents by name, category, or price (e.g., 'Saffron', 'Oud', 'under 2000')..."
                className="w-full pl-12 pr-12 py-4 bg-white border border-stone-200 text-stone-800 rounded-sm shadow-sm placeholder:text-stone-400 text-sm focus:outline-none focus:border-gold-primary focus:ring-1 focus:ring-gold-primary/30 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-700 text-xs uppercase font-bold tracking-wider transition-colors"
                  title="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="flex justify-between items-center mt-2.5 px-1">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                  Showing results for "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex items-center space-x-1 text-[10px] uppercase tracking-widest text-stone-500 hover:text-gold-accent transition-colors font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Search</span>
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 gap-6">
            <div className="flex items-center space-x-4 overflow-x-auto w-full md:w-auto pb-4 md:pb-0 no-scrollbar">
              <button 
                onClick={() => handleCategorySelect(null)}
                className={`flex-shrink-0 text-sm tracking-widest uppercase pb-1 border-b-2 transition-colors ${
                  selectedCategory === null 
                    ? "border-gold-primary text-gold-accent" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex-shrink-0 text-sm tracking-widest uppercase pb-1 border-b-2 transition-colors ${
                    selectedCategory === cat 
                      ? "border-gold-primary text-gold-accent" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
              <span className="text-gray-600 text-sm uppercase tracking-widest">{filteredProducts.length} Products</span>
              <button className="flex items-center space-x-2 text-sm uppercase tracking-widest text-gray-900 border border-gray-200 px-4 py-2 hover:border-gold-primary transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white border border-stone-100 max-w-xl mx-auto rounded-2xl p-10 shadow-sm mt-8">
              <SlidersHorizontal className="w-12 h-12 text-stone-300 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-serif text-2xl text-gray-900 mb-2">No Fragrances Found</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">We couldn't find any products in our store. Try adjusting your filters or search query, or check back later as we upload new luxury scents.</p>
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
    </>
  );
}
