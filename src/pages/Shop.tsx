import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { motion, AnimatePresence } from "motion/react";
import { Filter, ChevronDown, Heart, Eye, Search, RotateCcw, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { useCartStore } from "../store/useCart";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { useFavoritesStore } from "../store/useFavorites";
import { ProductCard } from "../components/ProductCard";

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
  
  // Sort and Drawer States
  const [sortBy, setSortBy] = useState<string>("default");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);

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
  
  const filteredProducts = useMemo(() => {
    return loadedProducts.filter((product) => {
      // 1. Category Filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // 2. Price Filter (if price limit is active)
      if (product.price > priceLimit) {
        return false;
      }

      // 3. Intelligent Search (by Name and/or Price)
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
  }, [loadedProducts, selectedCategory, priceLimit, searchQuery]);

  const sortedAndFilteredProducts = useMemo(() => {
    const result = [...filteredProducts];
    if (sortBy === "price-asc") {
      result.sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)));
    } else if (sortBy === "rating") {
      result.sort((a, b) => parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0)));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [filteredProducts, sortBy]);

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

      {/* Hero Section - Greatly reduced height for quick visibility */}
      <section className="relative w-full h-[140px] sm:h-[180px] md:h-[35vh] xl:h-[45vh] flex items-center justify-center overflow-hidden bg-white mt-[64px] sm:mt-[72px]">
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl sm:text-4xl md:text-5xl text-white mb-1.5 uppercase tracking-widest leading-snug drop-shadow-md"
          >
            {shopHero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] sm:text-xs md:text-sm text-stone-200 uppercase tracking-widest mb-3 leading-relaxed drop-shadow-sm"
          >
            {shopHero.subtitle}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="w-16 h-[1.5px] bg-gold-primary mx-auto shadow-sm"
          ></motion.div>
        </div>
      </section>

      {/* Sticky Premium Toolbar - Search, Category Tabs, Filter and Sort */}
      <div className="sticky top-[58px] sm:top-[72px] z-35 bg-white/95 backdrop-blur-md border-b border-stone-200 py-2 sm:py-3.5 shadow-xs transition-all duration-300">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex flex-col gap-2 sm:gap-3.5">
            
            {/* Row 1: Modern Compact Search Bar */}
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-stone-400 group-focus-within:text-gold-accent transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium fragrances, categories..."
                className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-stone-50 border border-stone-200 text-stone-800 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-gold-primary focus:bg-white transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: Categories scroll and Filter/Sort triggers */}
            <div className="flex items-center justify-between gap-3 overflow-hidden">
              {/* Category tabs scroller */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar flex-grow py-0.5">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`flex-shrink-0 px-3.5 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-full transition-all border ${
                    selectedCategory === null
                      ? "bg-stone-900 border-stone-900 text-white shadow-xs"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-full transition-all border ${
                      selectedCategory === cat
                        ? "bg-stone-900 border-stone-900 text-white shadow-xs"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Action Buttons for quick filter/sort setting */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className={`flex items-center space-x-1 bg-white hover:bg-stone-50 text-stone-800 border ${
                    priceLimit < maxProductPrice || selectedCategory ? 'border-gold-primary text-gold-accent' : 'border-stone-200'
                  } px-3 py-1.5 rounded-full text-[10px] sm:text-xs uppercase tracking-wider transition-colors font-semibold`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Filter</span>
                  {(priceLimit < maxProductPrice || selectedCategory) && (
                    <span className="w-1.5 h-1.5 bg-gold-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setIsSortDrawerOpen(true)}
                  className={`flex items-center space-x-1 bg-white hover:bg-stone-50 text-stone-800 border ${
                    sortBy !== 'default' ? 'border-gold-primary text-gold-accent' : 'border-stone-200'
                  } px-3 py-1.5 rounded-full text-[10px] sm:text-xs uppercase tracking-wider transition-colors font-semibold`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Sort</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-6 sm:py-10 bg-[#FAF9F6]">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          
          {/* Active search filter text indicator (non-obtrusive) */}
          {searchQuery && (
            <div className="flex justify-between items-center mb-4 px-1">
              <p className="text-[10px] sm:text-xs text-stone-550 uppercase tracking-widest font-medium">
                Showing results for "{searchQuery}" ({sortedAndFilteredProducts.length} items)
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="flex items-center space-x-1 text-[10px] uppercase tracking-widest text-stone-500 hover:text-gold-accent transition-colors font-bold"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Search</span>
              </button>
            </div>
          )}

          {/* Grid of Products - Reduced gap on mobile for high density */}
          {sortedAndFilteredProducts.length === 0 ? (
            <div className="text-center py-16 sm:py-24 bg-white border border-stone-100 max-w-xl mx-auto rounded-2xl p-6 sm:p-10 shadow-xs mt-4">
              <SlidersHorizontal className="w-12 h-12 text-stone-300 mx-auto mb-4 stroke-[1.5]" />
              <h3 className="font-serif text-xl sm:text-2xl text-gray-900 mb-2">No Fragrances Found</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6">
                We couldn't find any products matching your active filters. Try resetting filters or search query to explore luxury scents.
              </p>
              <button
                onClick={() => {
                  setPriceLimit(maxProductPrice);
                  handleCategorySelect(null);
                  setSearchQuery("");
                  setSortBy("default");
                }}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-gold-primary hover:text-black text-white text-xs uppercase tracking-widest font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 lg:gap-8">
              <AnimatePresence>
                {sortedAndFilteredProducts.map((product) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
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

      {/* FILTER DRAWER (Mobile Slide-up / Desktop centered sheet) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-2xl shadow-2xl z-55 flex flex-col font-sans overflow-hidden border-t border-stone-100 max-w-md mx-auto"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-serif text-lg text-neutral-900 tracking-wide font-medium">Filter Fragrances</h3>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 flex-grow">
                {/* Category Selector */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2.5">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCategorySelect(null)}
                      className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-lg border transition-all ${
                        selectedCategory === null
                          ? "bg-gold-primary border-gold-primary text-black font-bold"
                          : "bg-white border-stone-250 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-lg border transition-all ${
                          selectedCategory === cat
                            ? "bg-gold-primary border-gold-primary text-black font-bold"
                            : "bg-white border-stone-250 text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Limit Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Max Price</h4>
                    <span className="font-mono text-xs font-bold text-neutral-900">₹{priceLimit.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max={maxProductPrice}
                    step="100"
                    value={priceLimit}
                    onChange={(e) => setPriceLimit(Number(e.target.value))}
                    className="w-full accent-gold-primary h-1.5 bg-stone-150 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone-450 font-bold uppercase mt-1">
                    <span>Min: ₹100</span>
                    <span>Max: ₹{maxProductPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 bg-stone-50 border-t border-stone-100 flex gap-2.5">
                <button
                  onClick={() => {
                    setPriceLimit(maxProductPrice);
                    handleCategorySelect(null);
                    setIsFilterDrawerOpen(false);
                  }}
                  className="flex-1 py-2.5 border border-stone-200 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-white text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-2.5 bg-stone-950 text-gold-primary text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-gold-primary hover:text-black transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SORT DRAWER (Mobile Slide-up / Desktop centered sheet) */}
      <AnimatePresence>
        {isSortDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSortDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl shadow-2xl z-55 flex flex-col font-sans overflow-hidden border-t border-stone-100 max-w-md mx-auto"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-serif text-lg text-neutral-900 tracking-wide font-medium">Sort Fragrances</h3>
                <button 
                  onClick={() => setIsSortDrawerOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-1 flex-grow">
                {[
                  { value: "default", label: "Featured & Best Sellers" },
                  { value: "price-asc", label: "Price: Low to High" },
                  { value: "price-desc", label: "Price: High to Low" },
                  { value: "rating", label: "Customer Rating" },
                  { value: "name-asc", label: "Name: A to Z" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortDrawerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      sortBy === option.value
                        ? "bg-stone-900 text-gold-primary font-bold"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      <span className="w-1.5 h-1.5 bg-gold-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Sticky Actions Bar (Only visible on Mobile view for quick thumb reach) */}
      <div className="sm:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white rounded-full px-5 py-2.5 shadow-lg flex items-center space-x-4 border border-stone-800 backdrop-blur-md">
        <button 
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-primary"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
        <span className="w-[1px] h-3.5 bg-stone-750" />
        <button 
          onClick={() => setIsSortDrawerOpen(true)}
          className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-primary"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort</span>
        </button>
      </div>
    </>
  );
}
