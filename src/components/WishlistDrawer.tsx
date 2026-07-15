import { AnimatePresence, motion } from "motion/react";
import { X, Heart, ShoppingBag, Trash2, Star } from "lucide-react";
import { useFavoritesStore } from "../store/useFavorites";
import { useCartStore } from "../store/useCart";
import { Link } from "react-router-dom";

export function WishlistDrawer() {
  const { items, isOpen, setIsOpen, removeItem } = useFavoritesStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
    // Optional: Auto remove from wishlist or keep it there? Usually keep it, but let's show a brief feedback or allow them to buy.
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-md bg-white shadow-2xl flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Heart className="w-5 h-5 text-gold-accent fill-gold-primary" />
                  <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-gold-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                </div>
                <h2 className="font-serif text-xl tracking-wide text-gray-900">Your Wishlist</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-gray-100 hover:border-gold-primary flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                title="Close Wishlist"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-gold-primary animate-pulse" />
                  </div>
                  <h3 className="font-serif text-lg text-gray-900 mb-1">Your Wishlist is Empty</h3>
                  <p className="text-gray-500 text-xs max-w-xs mb-8">
                    Discover our magnificent premium collections and save your absolute favorites here.
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 border border-gold-accent text-xs font-semibold uppercase tracking-widest hover:bg-gold-primary hover:text-black transition-colors"
                  >
                    Continue Exploring
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex gap-4 p-4 border border-gray-100 hover:border-gold-primary/30 transition-all rounded-sm relative"
                    >
                      {/* Image */}
                      <div className="w-20 h-24 bg-gray-50 overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || null}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Info & Action Buttons */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-gold-primary uppercase tracking-widest font-semibold mb-0.5">
                            {item.category}
                          </p>
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsOpen(false)}
                            className="hover:text-gold-accent transition-colors block"
                          >
                            <h4 className="font-serif text-base text-gray-900 leading-tight">
                              {item.name}
                            </h4>
                          </Link>
                          {item.rating && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="w-3 h-3 fill-gold-accent text-gold-accent" />
                              <span className="text-[11px] text-gray-500">{item.rating}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2">
                          <span className="font-medium text-sm text-gray-900">
                            ₹{item.price.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="flex items-center space-x-1 bg-gold-primary hover:bg-gold-accent text-black text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 transition-colors"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add To Cart</span>
                          </button>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-rose-500 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 space-y-3 bg-gray-50">
                <button
                  onClick={() => {
                    // Add all items to cart
                    items.forEach((item) => handleAddToCart(item));
                    setIsOpen(false);
                  }}
                  className="w-full py-3 bg-gray-900 hover:bg-gold-accent hover:text-black text-white text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add All to Shopping Cart</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 border border-gray-300 hover:border-gold-primary text-gray-700 hover:text-gray-900 text-xs font-semibold uppercase tracking-widest transition-colors"
                >
                  Keep Exploring
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
