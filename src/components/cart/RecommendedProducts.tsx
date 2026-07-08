import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { products as staticProducts } from "../../data";
import { useCartStore, CartItem } from "../../store/useCart";

export function RecommendedProducts() {
  const [emblaRef] = useEmblaCarousel({ dragFree: true });
  const { addItem } = useCartStore();
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

  const handleAdd = (product: any) => {
    const priceNum = Number(product.price) || 0;
    const item: CartItem = {
      id: String(product.id),
      name: product.name,
      category: product.category,
      price: priceNum,
      originalPrice: priceNum + 500, // mock original price
      quantity: 1,
      image: product.image,
      size: "50ml",
    };
    addItem(item);
  };

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
              <div className="bg-white border border-gray-200 group flex flex-col h-full">
                <div className="aspect-square bg-white overflow-hidden relative">
                  <div className="absolute top-2 right-2 bg-white text-gold-accent text-[10px] uppercase tracking-wider px-2 py-1 font-semibold border border-gold-primary z-10">
                    -15% OFF
                  </div>
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <Link to={`/product/${product.id}`} className="hover:text-gold-accent transition-colors">
                    <h4 className="font-serif text-lg text-gray-900 mb-1 line-clamp-1">{product.name}</h4>
                  </Link>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-gray-900 font-medium">₹{Number(product.price).toLocaleString()}</span>
                    <span className="text-gray-500 text-xs line-through">₹{(Number(product.price) + 500).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => handleAdd(product)}
                    className="mt-auto w-full py-2 bg-white border border-gray-200 text-xs uppercase tracking-widest text-gray-900 hover:bg-gold-primary hover:text-black hover:border-gold-primary transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
