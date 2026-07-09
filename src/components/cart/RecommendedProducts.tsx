import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { products as staticProducts } from "../../data";
import { ProductCard } from "../ProductCard";

export function RecommendedProducts() {
  const [emblaRef] = useEmblaCarousel({ dragFree: true });
  const [loadedProducts, setLoadedProducts] = useState<any[]>(staticProducts);

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLoadedProducts(data);
        }
      })
      .catch(err => console.log("Falling back to static recommended products:", err));
  }, []);

  const limitedOffers = loadedProducts.slice(0, 4); // Just use a few products as mock

  return (
    <div className="mt-16 sm:mt-24 mb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="font-serif text-2xl text-gray-900 mb-2">Limited Time Offers</h3>
          <div className="w-12 h-1 bg-gold-primary"></div>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 cursor-grab active:cursor-grabbing">
          {limitedOffers.map((product) => (
            <div key={product.id} className="flex-[0_0_80%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] pl-4">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
