import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { products as staticProducts } from "../data";
import { useCartStore } from "../store/useCart";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { useFavoritesStore } from "../store/useFavorites";

export function ProductCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [loadedProducts, setLoadedProducts] = useState<any[]>(staticProducts);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { addItem } = useCartStore();
  const { websiteSections } = useWebsiteContentStore();

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    // Dynamic fetch of real seeded database products
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLoadedProducts(data);
        }
      })
      .catch(err => console.log("Falling back to static carousel products:", err));
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const bestSellers = loadedProducts.filter(p => p.isBestSeller || p.is_best_seller);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, bestSellers]);

  return (
    <section className="py-12 bg-[#FAF9F6]">
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-gray-900 mb-2">
              {websiteSections?.home?.best_sellers?.title || "Our Bestsellers"}
            </h2>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-4">
              {websiteSections?.home?.best_sellers?.subtitle || "Explore our most loved premium fragrance collections"}
            </p>
            <div className="w-24 h-1 bg-gold-primary"></div>
          </div>
          <div className="hidden md:flex space-x-4">
            <button onClick={scrollPrev} disabled={!canScrollPrev} className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-900 hover:border-gold-primary hover:text-gold-accent disabled:opacity-50 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={scrollNext} disabled={!canScrollNext} className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-900 hover:border-gold-primary hover:text-gold-accent disabled:opacity-50 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {bestSellers.map((product) => (
              <div key={product.id} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4">
                <div className="group bg-white border border-gray-200 overflow-hidden h-full flex flex-col relative">
                  
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-white">
                    <Link to={`/product/${product.id}`} className="block w-full h-full">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    {/* Hover Actions */}
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-black/90 to-transparent flex justify-center space-x-3">
                       <button 
                         onClick={() => toggleFavorite(product)}
                         className="w-10 h-10 bg-white text-black flex items-center justify-center hover:bg-gold-primary transition-colors hover:text-gray-900 rounded-full"
                         title={isFavorite(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                       >
                         <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-gold-primary text-gold-accent" : "text-gray-900"}`} />
                       </button>
                       <Link 
                         to={`/product/${product.id}`}
                         className="w-10 h-10 bg-white text-black flex items-center justify-center hover:bg-gold-primary transition-colors hover:text-gray-900 rounded-full"
                         title="View Details"
                       >
                         <Eye className="w-4 h-4" />
                       </Link>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow text-center">
                    <p className="text-gold-primary text-xs uppercase tracking-widest mb-2 font-semibold">
                      {product.category}
                    </p>
                    <Link to={`/product/${product.id}`} className="hover:text-gold-accent transition-colors">
                      <h3 className="font-serif text-xl text-gray-900 mb-2">{product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-center space-x-1 mb-4">
                       <span className="text-gold-accent text-sm">★</span>
                       <span className="text-gray-600 text-sm">{product.rating || "4.8"}</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-6">₹{Number(product.price).toLocaleString()}</p>
                    <div className="mt-auto">
                       <button 
                         onClick={() => addItem({
                           id: String(product.id),
                           name: product.name,
                           category: product.category,
                           price: Number(product.price),
                           quantity: 1,
                           image: product.image
                         })}
                         className="w-full py-3 border border-gray-200 text-sm uppercase tracking-wider hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-all duration-300"
                       >
                         Add to Cart
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
