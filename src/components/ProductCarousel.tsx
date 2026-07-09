import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/useCart";
import { useWebsiteContentStore } from "../store/useWebsiteContent";
import { useFavoritesStore } from "../store/useFavorites";
import { ProductCard } from "./ProductCard";

export function ProductCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [loadedProducts, setLoadedProducts] = useState<any[]>([]);
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
        if (Array.isArray(data)) {
          setLoadedProducts(data);
        }
      })
      .catch(err => console.log("Error fetching carousel products:", err));
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

        {bestSellers.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white border border-[#F0EAE1] max-w-lg mx-auto rounded-xl">
            <p className="font-serif text-xl text-gray-800 uppercase tracking-widest mb-2">Bestsellers coming soon</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">Our curation of best seller perfumes and attars is underway. Please stay tuned as we finalize our collection highlights!</p>
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-2 sm:-ml-4">
              {bestSellers.map((product) => (
                <div key={product.id} className="flex-[0_0_50%] min-w-0 lg:flex-[0_0_25%] pl-2 sm:pl-4">
                  <ProductCard product={product} layout="vertical" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
