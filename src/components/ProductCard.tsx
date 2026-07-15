import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingCart } from "lucide-react";
import { useCartStore } from "../store/useCart";
import { useFavoritesStore } from "../store/useFavorites";

interface ProductCardProps {
  product: {
    id: string | number;
    name: string;
    category: string;
    price: string | number;
    originalPrice?: string | number;
    rating?: string | number;
    image: string;
    sizes?: any;
    isBestSeller?: boolean;
    is_best_seller?: boolean;
  };
  layout?: "horizontal" | "vertical";
}

export function ProductCard({ product, layout = "horizontal" }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  // Parse custom size pricing from the database
  const parsedSizes = useMemo(() => {
    if (!product.sizes) return [];
    try {
      const parsed = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse product.sizes in ProductCard:", e);
      return [];
    }
  }, [product.sizes]);

  // Determine available size options
  const sizeOptions = useMemo(() => {
    if (parsedSizes.length > 0) {
      const sizes = parsedSizes.map((s: any) => {
        if (s && typeof s === "object" && "size" in s) {
          return String(s.size);
        }
        return s ? String(s) : "";
      }).filter(Boolean);
      return Array.from(new Set(sizes));
    }
    if (product.category === "Attars") {
      return ["3ml", "6ml", "12ml"];
    }
    if (product.category === "Gift Sets") {
      return ["Standard Set"];
    }
    return ["50ml", "100ml"];
  }, [product.category, parsedSizes]);

  // State for selected size
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    return sizeOptions[0] || "";
  });

  // Calculate dynamic price based on selected size
  const displayPrice = useMemo(() => {
    if (parsedSizes.length > 0) {
      const matched = parsedSizes.find((s: any) => {
        const sizeVal = s && typeof s === "object" && "size" in s ? String(s.size) : String(s);
        return sizeVal === selectedSize;
      });
      if (matched && typeof matched === "object" && "price" in matched && matched.price) {
        return parseFloat(matched.price);
      }
    }

    const basePrice = parseFloat(String(product.price));
    if (selectedSize === "3ml") return Math.round(basePrice * 0.5);
    if (selectedSize === "6ml") return Math.round(basePrice * 0.75);
    if (selectedSize === "12ml") return basePrice;
    if (selectedSize === "100ml") return Math.round(basePrice * 1.6);
    return basePrice;
  }, [product.price, selectedSize, parsedSizes]);

  // Calculate original price (if any)
  const displayOriginalPrice = useMemo(() => {
    if (parsedSizes.length > 0) {
      const matched = parsedSizes.find((s: any) => {
        const sizeVal = s && typeof s === "object" && "size" in s ? String(s.size) : String(s);
        return sizeVal === selectedSize;
      });
      if (matched && typeof matched === "object" && "originalPrice" in matched && matched.originalPrice) {
        return parseFloat(matched.originalPrice);
      }
      return null;
    }

    if (product.originalPrice) {
      const baseOrig = parseFloat(String(product.originalPrice));
      if (selectedSize === "3ml") return Math.round(baseOrig * 0.5);
      if (selectedSize === "6ml") return Math.round(baseOrig * 0.75);
      if (selectedSize === "12ml") return baseOrig;
      if (selectedSize === "100ml") return Math.round(baseOrig * 1.6);
      return baseOrig;
    }
    return null;
  }, [product.originalPrice, selectedSize, parsedSizes]);

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}_${selectedSize}`,
      name: `${product.name} (${selectedSize})`,
      category: product.category,
      price: displayPrice,
      originalPrice: displayOriginalPrice || undefined,
      quantity: 1,
      image: product.image,
      size: selectedSize,
    });
  };

  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (displayOriginalPrice && displayOriginalPrice > displayPrice) {
      return Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100);
    }
    return null;
  }, [displayOriginalPrice, displayPrice]);

  // Deterministic stable review count based on product ID
  const reviewCount = useMemo(() => {
    const idStr = String(product.id);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 30) + 15; // Stable review count between 15 and 44
  }, [product.id]);

  return (
    <>
      {layout === "vertical" ? (
        /* PREMIUM VERTICAL GRID CARD (Mainly for Home Page & Bestsellers) */
        <div className="group bg-white border border-stone-200 rounded-[18px] shadow-xs hover:shadow-sm transition-all overflow-hidden h-full flex flex-col relative p-3 font-sans">
          {/* 1. Image Container with aspect ratio */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[12px] bg-stone-50 mb-2.5">
            <Link to={`/product/${product.id}`} className="block w-full h-full">
              <img 
                src={product.image || null} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </Link>
            
            {/* Wishlist Icon overlays on Image top-left */}
            <button 
              onClick={() => toggleFavorite(product)}
              className="absolute top-2 right-2 w-6.5 h-6.5 bg-white/90 backdrop-blur-xs border border-stone-100 text-stone-800 flex items-center justify-center rounded-full shadow-xs active:scale-95 transition-transform z-10"
              title={isFavorite(String(product.id)) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite(String(product.id)) ? "fill-gold-primary text-gold-accent" : "text-stone-800"}`} />
            </button>

            {/* Best Seller Badge on Image top-left */}
            {(product.isBestSeller || product.is_best_seller) && (
              <div className="absolute top-2 left-2 bg-stone-900 border border-gold-primary/30 text-gold-primary text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider z-10">
                Best Seller
              </div>
            )}
          </div>

          {/* Details & Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              {/* Category & Rating Row */}
              <div className="flex justify-between items-center gap-1 mb-1">
                <span className="text-stone-400 text-[9px] uppercase tracking-widest font-extrabold block truncate">
                  {product.category}
                </span>
                
                {/* Rating (⭐) and Review Count */}
                <div className="flex items-center space-x-0.5 text-[9px] font-bold text-stone-750 flex-shrink-0 bg-stone-50 px-1 py-0.5 rounded border border-stone-100">
                  <span className="text-amber-500 text-[9px]">⭐</span>
                  <span>{product.rating || "4.8"}</span>
                  <span className="text-stone-400 font-normal">({reviewCount})</span>
                </div>
              </div>

              {/* Product Title (Bold, limited to 2 lines) */}
              <Link to={`/product/${product.id}`} className="hover:text-gold-accent transition-colors block mb-1">
                <h3 className="font-sans font-bold text-xs sm:text-sm text-gray-950 leading-tight line-clamp-2 min-h-[2rem]">
                  {product.name}
                </h3>
              </Link>

              {/* Price: Current, Original, Discount Badge */}
              <div className="flex items-center flex-wrap gap-1 mb-2">
                <span className="text-neutral-950 font-serif font-extrabold text-[13px] sm:text-[14px]">
                  ₹{displayPrice.toLocaleString()}
                </span>
                {displayOriginalPrice && (
                  <span className="text-stone-400 text-[9px] sm:text-[10px] line-through leading-none">
                    ₹{displayOriginalPrice.toLocaleString()}
                  </span>
                )}
                {discountPercentage && (
                  <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-extrabold px-1 py-0.2 rounded">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>

              {/* Size Options Picker */}
              <div className="mb-3">
                <span className="text-[8px] uppercase tracking-wider text-stone-400 font-extrabold block mb-1">
                  Size options
                </span>
                <div className="flex flex-wrap gap-1">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-1.5 py-0.5 text-[8px] font-mono font-extrabold rounded transition-all border ${
                        selectedSize === size
                          ? "bg-neutral-900 border-neutral-900 text-white"
                          : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="mt-1">
              <button 
                onClick={handleAddToCart}
                className="w-full py-2 bg-stone-900 hover:bg-gold-primary text-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-1.5 text-[10px] uppercase tracking-widest font-extrabold cursor-pointer rounded-xl shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ADAPTIVE HORIZONTAL CARD (Mainly for Shop Page search/listing list-view) */
        <>
          {/* MOBILE VIEW (Redesigned Premium Horizontal Layout) */}
          <div className="block sm:hidden bg-white border border-stone-200 rounded-[18px] shadow-xs hover:shadow-sm transition-all overflow-hidden relative p-3">
            {/* Top section: Horizontal Flex Row */}
            <div className="flex gap-3 mb-2.5">
              {/* Left Side: Product Image (takes ~45% width with rounded corners) */}
              <div className="w-[43%] flex-shrink-0 relative aspect-[4/5] overflow-hidden rounded-[12px] bg-stone-50">
                <Link to={`/product/${product.id}`} className="block w-full h-full">
                  <img 
                    src={product.image || null} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                
                {/* Wishlist Icon overlays on Image top-left */}
                <button 
                  onClick={() => toggleFavorite(product)}
                  className="absolute top-1.5 left-1.5 w-6.5 h-6.5 bg-white/90 backdrop-blur-xs border border-stone-100 text-stone-800 flex items-center justify-center rounded-full shadow-xs active:scale-95 transition-transform"
                  title={isFavorite(String(product.id)) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite(String(product.id)) ? "fill-gold-primary text-gold-accent" : "text-stone-800"}`} />
                </button>
              </div>

              {/* Right Side: Details Container */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  {/* Header inside details: Category left, Rating/Review right */}
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <span className="text-stone-400 text-[9px] uppercase tracking-widest font-extrabold block truncate">
                      {product.category}
                    </span>
                    
                    {/* Rating (⭐) and Review Count */}
                    <div className="flex items-center space-x-0.5 text-[10px] font-bold text-stone-750 flex-shrink-0 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
                      <span className="text-amber-500 text-[10px]">⭐</span>
                      <span>{product.rating || "4.8"}</span>
                      <span className="text-stone-400 font-normal">({reviewCount})</span>
                    </div>
                  </div>

                  {/* Product Title (Bold, limited to 2 lines) */}
                  <Link to={`/product/${product.id}`} className="hover:text-gold-accent transition-colors block mb-1">
                    <h3 className="font-sans font-bold text-xs text-gray-950 leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price: Current, Original, Green Discount Badge */}
                  <div className="flex items-center flex-wrap gap-1 mb-2">
                    <span className="text-neutral-950 font-serif font-extrabold text-[14px]">
                      ₹{displayPrice.toLocaleString()}
                    </span>
                    {displayOriginalPrice && (
                      <span className="text-stone-400 text-[10px] line-through leading-none">
                        ₹{displayOriginalPrice.toLocaleString()}
                      </span>
                    )}
                    {discountPercentage && (
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-extrabold px-1.5 py-0.2 rounded ml-0.5">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </div>

                  {/* Size Options Picker */}
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-stone-400 font-extrabold block mb-1">
                      Size options
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sizeOptions.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-1.5 py-0.5 text-[8px] font-mono font-extrabold rounded transition-all border ${
                            selectedSize === size
                              ? "bg-neutral-900 border-neutral-900 text-white"
                              : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width, premium-looking "ADD TO CART" button at the bottom */}
            <div className="mt-1">
              <button 
                onClick={handleAddToCart}
                className="w-full py-2 bg-stone-900 hover:bg-gold-primary text-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-1.5 text-[10px] uppercase tracking-widest font-extrabold cursor-pointer rounded-xl shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>

          {/* DESKTOP VIEW (Standard Premium Grid Layout) */}
          <div className="hidden sm:flex group bg-white border border-stone-200 overflow-hidden h-full flex-col relative transition-all duration-300 hover:shadow-md">
            {/* 1. Product Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-white">
              <Link to={`/product/${product.id}`} className="block w-full h-full">
                <img 
                  src={product.image || null} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </Link>
              
              {/* Discount Badge on Image */}
              {discountPercentage && (
                <div className="absolute top-2.5 left-2.5 bg-neutral-900 text-gold-primary text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider z-10">
                  {discountPercentage}% OFF
                </div>
              )}

              {/* Action Buttons (Wishlist, Quick View) */}
              <div className="absolute top-2.5 right-2.5 flex flex-col space-y-1.5 z-10">
                <button 
                  onClick={() => toggleFavorite(product)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-white/95 border border-stone-100 text-stone-800 flex items-center justify-center hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-colors rounded-full shadow-xs"
                  title={isFavorite(String(product.id)) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFavorite(String(product.id)) ? "fill-gold-primary text-gold-accent" : "text-stone-800"}`} />
                </button>
                <Link 
                  to={`/product/${product.id}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-white/95 border border-stone-100 text-stone-800 flex items-center justify-center hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-colors rounded-full shadow-xs"
                  title="Quick View"
                >
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </div>

            {/* Content Container - Compact padding for dense, high-end look on mobile */}
            <div className="p-2.5 sm:p-4.5 flex flex-col flex-grow text-center font-sans">
              
              {/* 2. Category */}
              <p className="text-gold-primary text-[9px] sm:text-[10px] uppercase tracking-widest mb-1 font-bold">
                {product.category}
              </p>

              {/* 3. Product Name */}
              <Link to={`/product/${product.id}`} className="hover:text-gold-accent transition-colors block mb-1">
                <h3 className="font-serif text-xs sm:text-sm md:text-base text-gray-900 leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center font-medium">
                  {product.name}
                </h3>
              </Link>
              
              {/* 4. Rating */}
              <div className="flex items-center justify-center space-x-1 mb-2">
                <span className="text-gold-accent text-xs">★</span>
                <span className="text-gray-650 text-[10px] sm:text-xs font-medium">{product.rating || "4.8"}</span>
              </div>

              {/* 5, 6, 7. Current Price, Original Price (Strikethrough) & Discount Badge Row */}
              <div className="mb-2 mt-auto">
                <div className="flex items-center justify-center flex-wrap gap-1">
                  <span className="text-neutral-900 font-serif font-bold text-xs sm:text-sm md:text-base">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  {displayOriginalPrice && (
                    <span className="text-stone-400 text-[10px] sm:text-xs line-through ml-1">
                      ₹{displayOriginalPrice.toLocaleString()}
                    </span>
                  )}
                  {discountPercentage && (
                    <span className="text-[8px] sm:text-[9px] bg-red-50 text-red-650 font-bold px-1 py-0.2 rounded border border-red-100 ml-1">
                      -{discountPercentage}%
                    </span>
                  )}
                </div>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mt-0.5">
                  Price for {selectedSize}
                </span>
              </div>

              {/* 8. Size Options (Dynamic Picker Pills) */}
              <div className="mb-3.5">
                <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">
                  Size options
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold tracking-tight rounded transition-all border ${
                        selectedSize === size
                          ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
                          : "bg-stone-50 border-stone-200 text-neutral-600 hover:border-stone-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* 9. Add to Cart Button */}
              <div className="mt-auto">
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-2 sm:py-2.5 bg-neutral-900 text-white border border-neutral-900 text-[9px] sm:text-xs uppercase tracking-wider hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 font-bold cursor-pointer rounded-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
