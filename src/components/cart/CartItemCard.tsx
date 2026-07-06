import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, X, Heart } from "lucide-react";
import { CartItem, useCartStore } from "../../store/useCart";
import { useFavoritesStore } from "../../store/useFavorites";

export const CartItemCard: React.FC<{ item: CartItem }> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const handleMoveToWishlist = () => {
    // If it's not currently favorited, add it
    if (!isFavorite(item.id)) {
      toggleFavorite({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        image: item.image,
      });
    }
    // Remove from cart
    removeItem(item.id);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-gray-200 relative"
    >
      {/* Remove Button for Desktop */}
      <button 
        onClick={() => removeItem(item.id)}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors hidden sm:block"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <div className="w-24 sm:w-32 aspect-square bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover opacity-80" 
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Details */}
      <div className="flex-grow flex flex-col justify-between">
        <div className="mb-4 sm:mb-0 pr-8">
          <p className="text-gold-primary text-[10px] uppercase tracking-widest font-semibold mb-1">
            {item.category}
          </p>
          <div className="flex justify-between items-start">
            <h3 className="font-serif text-xl text-gray-900">{item.name}</h3>
            <button 
              onClick={() => removeItem(item.id)}
              className="text-gray-500 hover:text-red-400 sm:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {item.size && (
            <p className="text-gray-600 text-sm mt-1">{item.size}</p>
          )}

          <div className="mt-2 flex items-center space-x-3">
            <span className="text-gray-900 text-lg font-medium">₹{item.price.toLocaleString()}</span>
            {item.originalPrice && (
              <span className="text-gray-500 text-sm line-through">₹{item.originalPrice.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className={ "flex items-center border border-gold-primary/50 rounded-sm overflow-hidden bg-white" }>
            <button 
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-gold-accent hover:bg-gold-primary/10 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="w-10 text-center text-sm text-gray-900 font-medium">
              {item.quantity}
            </div>
            <button 
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-gold-accent hover:bg-gold-primary/10 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button 
            onClick={handleMoveToWishlist}
            className="flex items-center text-xs tracking-widest uppercase text-gray-600 hover:text-gold-accent transition-colors"
            title="Move this item to your wishlist"
          >
            <Heart className={`w-4 h-4 mr-2 ${isFavorite(item.id) ? "fill-gold-primary text-gold-accent" : ""}`} />
            <span className="hidden sm:inline">Move to Wishlist</span>
            <span className="sm:hidden">Wishlist</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
