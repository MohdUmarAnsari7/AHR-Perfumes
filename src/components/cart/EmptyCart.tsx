import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

export function EmptyCart() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-24 text-center max-w-2xl mx-auto px-4"
    >
      <div className="w-24 h-24 rounded-full border border-gray-200 mx-auto flex items-center justify-center mb-8 bg-white">
        <ShoppingBag className="w-10 h-10 text-gold-primary" />
      </div>
      <h2 className="font-serif text-3xl text-gray-900 mb-4">Your Cart Is Empty</h2>
      <p className="text-gray-600 mb-10 font-light text-lg">
        Explore our premium fragrance collections and find your signature scent.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          to="/shop" 
          className="bg-gold-primary text-black px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-accent transition-colors"
        >
          Continue Shopping
        </Link>
        <Link 
          to="/category/attars" 
          className="border border-gold-primary text-gold-accent px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-primary hover:text-black transition-colors"
        >
          Browse Attars
        </Link>
      </div>
    </motion.div>
  );
}
