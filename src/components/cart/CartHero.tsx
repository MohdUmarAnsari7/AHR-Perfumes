import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function CartHero() {
  return (
    <section className="relative w-full h-[30vh] flex items-center justify-center overflow-hidden bg-white mt-[72px]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#B68D40]/20 via-black to-black opacity-80"></div>
      </div>
      
      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-gray-300 mb-4 font-semibold"
        >
          <Link to="/" className="hover:text-gold-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-primary">Cart</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-4xl md:text-5xl text-white mb-4 uppercase tracking-wider"
        >
          Your Shopping Bag
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-300 font-light tracking-wide text-sm md:text-base"
        >
          Review your selected fragrances before checkout.
        </motion.p>
      </div>
    </section>
  );
}
