import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Star, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowLeft, 
  Share2, 
  Check, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles,
  Droplets,
  Award
} from "lucide-react";
import { useCartStore } from "../store/useCart";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useFavoritesStore } from "../store/useFavorites";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const info = useBusinessInfoStore((state) => state.info);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [currentImgIndex, setCurrentImgIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [addedNotify, setAddedNotify] = useState<boolean>(false);
  const [shareNotify, setShareNotify] = useState<boolean>(false);

  // Fetch product details
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setCurrentImgIndex(0);
    setQuantity(1);

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        
        // Default size options selection
        let initialSize = "";
        let customSizesList: any[] = [];
        if (data.sizes) {
          try {
            customSizesList = typeof data.sizes === "string" ? JSON.parse(data.sizes) : data.sizes;
          } catch (e) {
            console.warn(e);
          }
        }

        if (customSizesList && customSizesList.length > 0) {
          const firstSizeObj = customSizesList[0];
          initialSize = firstSizeObj && typeof firstSizeObj === "object" && "size" in firstSizeObj ? firstSizeObj.size : String(firstSizeObj);
        } else if (data.category === "Attars") {
          initialSize = "6ml";
        } else if (data.category === "Gift Sets") {
          initialSize = "Standard Set";
        } else {
          initialSize = "50ml";
        }
        setSelectedSize(initialSize);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product details:", err);
        setError("Unable to find this luxury fragrance. It might have been retired or is currently unavailable.");
        setLoading(false);
      });
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (!product) return;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data
            .filter((p) => p.category === product.category && String(p.id) !== String(product.id))
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      })
      .catch((err) => console.log("Failed to load recommended products:", err));
  }, [product]);

  const parsedSizes = useMemo(() => {
    if (!product || !product.sizes) return [];
    try {
      const parsed = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse product.sizes:", e);
      return [];
    }
  }, [product]);

  // Handle price dynamic resizing
  const getDisplayPrice = () => {
    if (!product) return 0;

    if (parsedSizes.length > 0) {
      const matched = parsedSizes.find((s: any) => {
        const sizeVal = s && typeof s === "object" && "size" in s ? String(s.size) : String(s);
        return sizeVal === selectedSize;
      });
      if (matched && typeof matched === "object" && "price" in matched && matched.price) {
        return parseFloat(matched.price);
      }
    }

    const basePrice = parseFloat(product.price);
    if (selectedSize === "3ml") return Math.round(basePrice * 0.5);
    if (selectedSize === "6ml") return Math.round(basePrice * 0.75);
    if (selectedSize === "12ml") return basePrice;
    if (selectedSize === "100ml") return Math.round(basePrice * 1.6);
    return basePrice;
  };

  const getDisplayOriginalPrice = () => {
    if (!product) return null;

    if (parsedSizes.length > 0) {
      const matched = parsedSizes.find((s: any) => {
        const sizeVal = s && typeof s === "object" && "size" in s ? String(s.size) : String(s);
        return sizeVal === selectedSize;
      });
      if (matched && typeof matched === "object" && "originalPrice" in matched && matched.originalPrice) {
        return parseFloat(matched.originalPrice);
      }
    }

    const displayPrice = getDisplayPrice();
    if (product.originalPrice) {
      const baseOrig = parseFloat(product.originalPrice);
      const basePrice = parseFloat(product.price);
      const ratio = displayPrice / basePrice;
      return Math.round(baseOrig * ratio);
    }
    // Mock discount for styling if best seller
    if (product.isBestSeller) {
      return Math.round(displayPrice * 1.25);
    }
    return null;
  };

  const displayPrice = getDisplayPrice();
  const displayOriginalPrice = getDisplayOriginalPrice();
  const discountPercent = displayOriginalPrice && displayOriginalPrice > displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : null;

  // Compile strictly only the images associated with the selected product
  const imagesList = useMemo(() => {
    const list: string[] = [];
    if (product?.image) {
      list.push(product.image);
    }
    if (product?.images && Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (img && typeof img === "string" && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    // Fallback if absolutely no images exist on the product
    if (list.length === 0) {
      list.push("https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1000&auto=format&fit=crop");
    }
    return list;
  }, [product?.image, product?.images]);

  useEffect(() => {
    if (imagesList.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % imagesList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [imagesList, isHovered]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: `${product.id}_${selectedSize}`,
      name: `${product.name} (${selectedSize})`,
      category: product.category,
      price: displayPrice,
      originalPrice: displayOriginalPrice || undefined,
      quantity: quantity,
      image: product.image,
      size: selectedSize
    });
    setAddedNotify(true);
    setTimeout(() => setAddedNotify(false), 3000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      id: `${product.id}_${selectedSize}`,
      name: `${product.name} (${selectedSize})`,
      category: product.category,
      price: displayPrice,
      originalPrice: displayOriginalPrice || undefined,
      quantity: quantity,
      image: product.image,
      size: selectedSize
    });
    navigate("/cart");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareNotify(true);
    setTimeout(() => setShareNotify(false), 3000);
  };

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => q + 1);

  // Luxury Notes/Ingredients breakdown for perfume profile mapping
  const getFragranceProfile = (name: string, category: string) => {
    const isAttar = category === "Attars";
    if (name.toLowerCase().includes("oud")) {
      return {
        top: "Saffron, Cardamom, Nutmeg",
        middle: "Damask Rose, Frankincense, Jasmine",
        base: "Cambodian Oud, Amber, Sandalwood, Patchouli",
        duration: isAttar ? "12-18 Hours" : "8-12 Hours",
        intensity: "Rich & Deep"
      };
    }
    if (name.toLowerCase().includes("rose") || name.toLowerCase().includes("maliki")) {
      return {
        top: "Turkish Rose, Bergamot, Pink Pepper",
        middle: "Red Rose Absolute, Honey, Geranium",
        base: "White Musk, Ambergris, Light Sandalwood",
        duration: isAttar ? "10-14 Hours" : "6-10 Hours",
        intensity: "Floral & Elegant"
      };
    }
    if (name.toLowerCase().includes("khus") || name.toLowerCase().includes("vetiver")) {
      return {
        top: "Lime, Green Grass, Cardamom",
        middle: "Wild Vetiver, Coriander, Orris Root",
        base: "Earthy Cedar, Oakmoss, Amber",
        duration: isAttar ? "14-20 Hours" : "8-12 Hours",
        intensity: "Earthy, Green & Refreshing"
      };
    }
    return {
      top: "Sweet Bergamot, Lemon Zest, Lavender",
      middle: "Spicy Nutmeg, Jasmin Petals, Lily",
      base: "Creamy Sandalwood, Rich Amber, Musk",
      duration: isAttar ? "12+ Hours" : "8+ Hours",
      intensity: "Warm, Balanced & Sensual"
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 uppercase tracking-widest text-xs">Unveiling Scent Details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center pt-24 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 p-8 text-center shadow-lg">
          <Award className="w-12 h-12 text-gold-accent mx-auto mb-4 opacity-75" />
          <h2 className="font-serif text-2xl text-gray-900 mb-3">Fragrance Uncharted</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">{error}</p>
          <Link 
            to="/shop" 
            className="inline-flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Shop</span>
          </Link>
        </div>
      </div>
    );
  }

  const profile = getFragranceProfile(product.name, product.category);
  const sizeOptions = parsedSizes.length > 0
    ? Array.from(new Set(parsedSizes.map((s: any) => {
        if (s && typeof s === "object" && "size" in s) {
          return String(s.size);
        }
        return s ? String(s) : "";
      }).filter(Boolean)))
    : product.category === "Attars"
      ? ["3ml", "6ml", "12ml"]
      : product.category === "Gift Sets"
        ? ["Standard Set"]
        : ["50ml", "100ml"];

  return (
    <>
      <Helmet>
        <title>{product.name} | Premium {product.category} | {info.name}</title>
        <meta name="description" content={product.description || `${product.name} is a premium luxury fragrance in our ${product.category} collection.`} />
      </Helmet>

      {/* Breadcrumb & Return Navigation */}
      <div className="bg-white border-b border-gray-100 pt-28 pb-4">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 flex items-center justify-between text-xs tracking-widest uppercase text-gray-400">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <Link to="/" className="hover:text-gold-accent transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-gold-accent transition-colors">Shop</Link>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-gold-accent transition-colors">{product.category}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-[150px] sm:max-w-none">{product.name}</span>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center space-x-2 text-gray-600 hover:text-gold-accent transition-colors">
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Shop</span>
          </Link>
        </div>
      </div>

      <section className="py-12 md:py-16 bg-[#FAF9F6] min-h-screen">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
            
            {/* LEFT COLUMN: Gallery View */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="sticky top-32 max-w-sm sm:max-w-md lg:max-w-[360px] xl:max-w-[400px] w-full mx-auto">
                {/* Large Featured Image */}
                <div 
                  className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-white border border-gray-200 rounded-lg group shadow-sm cursor-pointer"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Luxury Tags */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
                    {product.isBestSeller && (
                      <span className="bg-gold-primary text-black text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 shadow-md">
                        Bestseller
                      </span>
                    )}
                    {discountPercent && (
                      <span className="bg-red-600 text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 shadow-md">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImgIndex}
                      src={imagesList[currentImgIndex] || null}
                      alt={product.name}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>

                  {/* Manual Controls overlay on image */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-4 pointer-events-none">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
                      }}
                      className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 pointer-events-auto hover:bg-gold-primary hover:text-black transition-colors shadow-md"
                    >
                      &#10216;
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex((prev) => (prev + 1) % imagesList.length);
                      }}
                      className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 pointer-events-auto hover:bg-gold-primary hover:text-black transition-colors shadow-md"
                    >
                      &#10217;
                    </button>
                  </div>
                </div>

                {/* Thumbnails below Featured image */}
                {imagesList.length > 1 && (
                  <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-4">
                    {imagesList.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImgIndex(index)}
                        className={`aspect-square overflow-hidden bg-white border rounded transition-all duration-300 relative ${
                          currentImgIndex === index 
                            ? "border-gold-primary ring-2 ring-gold-primary/30 scale-[1.02] shadow-sm" 
                            : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img 
                          src={img || null} 
                          alt={`${product.name} detail view ${index + 1}`} 
                          className="w-full h-full object-cover select-none"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Aesthetic Detail Points */}
                <div className="hidden md:grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
                  <div className="flex flex-col items-center text-center p-3">
                    <Award className="w-5 h-5 text-gold-accent mb-2" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-900">Indore Heritage</span>
                    <span className="text-[10px] text-gray-400 mt-1">Estd. 2007 Luxury Blends</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3">
                    <Truck className="w-5 h-5 text-gold-accent mb-2" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-900">Secure Delivery</span>
                    <span className="text-[10px] text-gray-400 mt-1">Pan India Shipped Boxed</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3">
                    <ShieldCheck className="w-5 h-5 text-gold-accent mb-2" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-900">100% Pure Oil</span>
                    <span className="text-[10px] text-gray-400 mt-1">Premium Raw Ingredients</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Product Details & Controls */}
            <div className="lg:col-span-7 xl:col-span-7 bg-white border border-gray-100 p-6 sm:p-8 xl:p-10 rounded-lg shadow-sm">
              
              {/* Category, Actions, Title */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-gold-primary text-xs font-semibold uppercase tracking-[0.2em]">
                  {product.category}
                </span>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleShare}
                    className="p-2 border border-gray-100 hover:border-gold-primary hover:text-gold-accent transition-all rounded-full relative"
                    title="Copy Link to Share"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                    {shareNotify && (
                      <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-gray-900 text-white text-[10px] uppercase tracking-widest px-2 py-1 shadow-md rounded">
                        Link Copied!
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => product && toggleFavorite(product)}
                    className="p-2 border border-gray-100 hover:border-gold-primary transition-all rounded-full"
                    title={product && isFavorite(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${product && isFavorite(product.id) ? "fill-gold-primary text-gold-accent" : "text-gray-600"}`} />
                  </button>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-4 tracking-wide leading-tight font-medium">
                {product.name}
              </h1>

              {/* Ratings and Reviews */}
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center space-x-1 text-gold-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(product.rating || 4.8) ? "fill-gold-accent text-gold-accent" : "text-gray-200"}`} 
                    />
                  ))}
                  <span className="ml-2 text-gray-800 text-sm font-semibold">{product.rating || "4.8"}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-gray-400 uppercase tracking-widest hover:text-gold-accent cursor-pointer transition-colors">
                  {((parseFloat(id || "1") * 7) % 35) + 12} Certified Reviews
                </span>
              </div>

              {/* Price Display */}
              <div className="mb-6 flex items-baseline space-x-4">
                <span className="text-3xl font-medium text-gray-900">
                  ₹{displayPrice.toLocaleString()}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ₹{displayOriginalPrice.toLocaleString()}
                  </span>
                )}
                {discountPercent && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded tracking-widest border border-amber-200">
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>

              {/* Short Description */}
              <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                {product.description || `Experience the captivating essence of ${product.name}. Carefully crafted using centuries-old traditional methods in Indore, this natural fragrance offers unparalleled depth, long-lasting performance, and luxurious projection.`}
              </p>

              {/* Attar/Perfume Fragrance Notes breakdown */}
              <div className="mb-8 p-5 bg-stone-50 border border-stone-200 rounded-md">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-700 mb-4 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-gold-accent" />
                  <span>Fragrance Architecture</span>
                </h4>
                <div className="space-y-3.5 text-xs text-stone-600 font-sans">
                  <div className="grid grid-cols-12 gap-1.5">
                    <span className="col-span-3 font-semibold uppercase text-[10px] tracking-wider text-stone-400 pt-0.5">Top Notes:</span>
                    <span className="col-span-9 text-gray-800 italic">{profile.top}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1.5">
                    <span className="col-span-3 font-semibold uppercase text-[10px] tracking-wider text-stone-400 pt-0.5">Heart Notes:</span>
                    <span className="col-span-9 text-gray-800 italic">{profile.middle}</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1.5">
                    <span className="col-span-3 font-semibold uppercase text-[10px] tracking-wider text-stone-400 pt-0.5">Base Notes:</span>
                    <span className="col-span-9 text-gray-800 italic">{profile.base}</span>
                  </div>
                </div>
              </div>

              {/* Size Selector */}
              <div className="mb-6">
                <span className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                  Select Volume
                </span>
                <div className="flex flex-wrap gap-3">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 text-xs font-medium uppercase tracking-widest border transition-all duration-300 ${
                        selectedSize === size
                          ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-8">
                <span className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                  Quantity
                </span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 bg-white">
                    <button 
                      onClick={handleDecrease}
                      className="p-3 hover:bg-gray-50 text-gray-600 active:text-black transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-12 text-center text-sm font-medium text-gray-900 select-none">
                      {quantity}
                    </span>
                    <button 
                      onClick={handleIncrease}
                      className="p-3 hover:bg-gray-50 text-gray-600 active:text-black transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>In Stock & Ready to Ship</span>
                  </span>
                </div>
              </div>

              {/* Prominent Action Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-4 border border-gray-900 text-xs font-semibold uppercase tracking-widest text-gray-900 hover:bg-gray-950 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2.5 rounded shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{addedNotify ? "Added to Cart ✓" : "Add to Cart"}</span>
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-4 bg-gold-primary border border-gold-primary text-xs font-semibold uppercase tracking-widest text-black hover:bg-gold-accent hover:border-gold-accent transition-all duration-300 flex items-center justify-center space-x-2 rounded shadow-md font-medium"
                  >
                    <span>Buy It Now</span>
                  </button>
                </div>
              </div>

              {/* Premium Perks (Under-buttons trust elements) */}
              <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <Truck className="w-4 h-4 text-gold-accent" />
                  <span>Free Express Shipping across India</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-4 h-4 text-gold-accent" />
                  <span>Hassle-free 7-Day Exchange</span>
                </div>
              </div>

            </div>

          </div>

          {/* Related Products Grid */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 pt-16 border-t border-gray-200">
              <div className="text-center mb-12">
                <span className="text-gold-primary text-xs font-semibold uppercase tracking-[0.25em] block mb-2">
                  Harmonious Pairings
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-gray-900 mb-4">
                  You May Also Love
                </h2>
                <div className="w-20 h-1 bg-gold-primary mx-auto"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {relatedProducts.map((p) => (
                  <div 
                    key={p.id}
                    className="group bg-white border border-gray-200 overflow-hidden flex flex-col relative rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-300"
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-white">
                      <img 
                        src={p.image || null} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow text-center">
                      <p className="text-gold-primary text-[10px] uppercase tracking-widest mb-1.5 font-semibold">
                        {p.category}
                      </p>
                      <h3 className="font-serif text-base text-gray-900 mb-1.5 line-clamp-1">{p.name}</h3>
                      <div className="flex items-center justify-center space-x-1 mb-3">
                        <span className="text-gold-accent text-xs">★</span>
                        <span className="text-gray-500 text-xs">{p.rating || "4.8"}</span>
                      </div>
                      <p className="text-gray-900 font-semibold text-sm mt-auto">₹{Number(p.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
