import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { useCartStore } from "../store/useCart";
import { CartHero } from "../components/cart/CartHero";
import { CartItemCard } from "../components/cart/CartItemCard";
import { OrderSummary } from "../components/cart/OrderSummary";
import { EmptyCart } from "../components/cart/EmptyCart";
import { RecommendedProducts } from "../components/cart/RecommendedProducts";
import { BadgePercent, Truck, ShieldCheck, Droplet, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function Cart() {
  const navigate = useNavigate();
  const { items, getTotal } = useCartStore();
  const hasItems = items.length > 0;
  const total = getTotal();
  const info = useBusinessInfoStore((state) => state.info);

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `Shopping Cart | ${info.name}`,
    "description": "Review your premium attars and fragrances before secure checkout.",
  };

  return (
    <>
      <Helmet>
        <title>Shopping Cart | {info.name}</title>
        <meta name="description" content="Review your premium attars and fragrances before secure checkout at A.H.R Perfumes." />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      <CartHero />

      <main className="bg-white py-12 md:py-20 min-h-screen relative">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {!hasItems ? (
            <EmptyCart />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              
              {/* Left Column: Cart Items */}
              <div className="w-full lg:w-[65%] xl:w-[70%]">
                
                {/* Save Offer Alert */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-900/20 border border-green-500/30 p-4 mb-8 flex items-start sm:items-center space-x-4"
                >
                  <BadgePercent className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-green-400 font-medium text-sm">Save 5% Extra on Prepaid Orders</h4>
                    <p className="text-green-400/80 text-xs mt-0.5">Plus! Free Shipping on Orders Above ₹999.</p>
                  </div>
                </motion.div>

                {/* Items List */}
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItemCard key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>

                <RecommendedProducts />
                
                {/* Shipping Benefits (Desktop) */}
                <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-12 border-t border-gray-200">
                  <div className="text-center p-4">
                    <Truck className="w-6 h-6 text-gold-primary mx-auto mb-3" />
                    <p className="text-gray-900 text-xs uppercase tracking-widest">Free Shipping</p>
                  </div>
                  <div className="text-center p-4">
                    <ShieldCheck className="w-6 h-6 text-gold-primary mx-auto mb-3" />
                    <p className="text-gray-900 text-xs uppercase tracking-widest">Secure Payments</p>
                  </div>
                  <div className="text-center p-4">
                    <Droplet className="w-6 h-6 text-gold-primary mx-auto mb-3" />
                    <p className="text-gray-900 text-xs uppercase tracking-widest">Imported Oils</p>
                  </div>
                  <div className="text-center p-4">
                    <Star className="w-6 h-6 text-gold-primary mx-auto mb-3" />
                    <p className="text-gray-900 text-xs uppercase tracking-widest">Premium Quality</p>
                  </div>
                </div>

              </div>
              
              {/* Right Column: Order Summary */}
              <div className="w-full lg:w-[35%] xl:w-[30%]">
                <OrderSummary />
              </div>
              
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Checkout Bar */}
      {hasItems && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1F1F1F] p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-3">
             <div className="text-xs text-gray-400 uppercase tracking-widest">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
             </div>
             <div className="font-serif text-xl text-white">
                ₹{total.toLocaleString()}
             </div>
          </div>
          <button 
            onClick={() => navigate("/checkout")}
            className="w-full bg-gradient-to-r from-[#B68D40] via-[#F5E6C8] to-[#B68D40] text-black font-semibold uppercase tracking-widest text-xs py-4"
          >
            Proceed To Checkout
          </button>
        </div>
      )}
    </>
  );
}
