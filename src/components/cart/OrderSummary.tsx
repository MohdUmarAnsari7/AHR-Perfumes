import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck, CreditCard, Wallet, IndianRupee } from "lucide-react";
import { useCartStore } from "../../store/useCart";

export function OrderSummary() {
  const { getSubtotal, getTotal } = useCartStore();
  const subtotal = getSubtotal();
  const total = getTotal();
  const [coupon, setCoupon] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "success" | "error">("idle");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim() === "") return;
    // Mock processing
    setCouponStatus("error");
    setTimeout(() => {
      setCouponStatus("idle");
    }, 3000);
  };

  return (
    <div className="bg-white border border-gray-200 p-6 md:p-8 sticky top-24">
      <h2 className="font-serif text-2xl text-gray-900 mb-6 uppercase tracking-wider">Order Summary</h2>
      
      <div className="space-y-4 mb-6 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Discount</span>
          <span>₹0</span>
        </div>
        <div className="flex justify-between text-green-400">
          <span>Shipping</span>
          <span className="uppercase tracking-widest text-xs font-semibold">Free</span>
        </div>
        <div className="flex justify-between text-gray-600 text-xs">
          <span>Taxes</span>
          <span>Included</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4 mb-8">
        <div className="flex justify-between text-xl text-gray-900 font-serif">
          <span>Total</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-8">
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input 
            type="text" 
            placeholder="ENTER COUPON CODE" 
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="flex-grow bg-white border border-gray-200 px-4 py-3 text-xs tracking-widest uppercase text-gray-900 focus:outline-none focus:border-gold-primary transition-colors"
          />
          <button 
            type="submit"
            className="px-6 py-3 border border-gray-200 text-xs uppercase tracking-widest hover:border-gold-primary text-gray-700 hover:text-gold-accent transition-colors"
          >
            Apply
          </button>
        </form>
        {couponStatus === "error" && (
          <p className="text-red-400 text-xs mt-2">Invalid or expired coupon code.</p>
        )}
      </div>

      <button className="w-full bg-gradient-to-r from-[#B68D40] via-[#F5E6C8] to-[#B68D40] text-black font-semibold uppercase tracking-widest text-sm py-4 mb-8 hover:opacity-90 transition-opacity">
        Proceed To Checkout
      </button>

      {/* Payment Trust Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4 text-xs font-medium tracking-widest uppercase">
          <ShieldCheck className="w-4 h-4 text-gold-primary" />
          <span>Secure Payments</span>
        </div>
        <div className="flex items-center justify-center space-x-4 mb-4">
           {/* Mock payment icons */}
           <div className="px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 uppercase tracking-wider flex items-center"><IndianRupee className="w-3 h-3 mr-1" /> UPI</div>
           <div className="px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 uppercase tracking-wider flex items-center"><CreditCard className="w-3 h-3 mr-1" /> Card</div>
           <div className="px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 uppercase tracking-wider flex items-center"><Wallet className="w-3 h-3 mr-1" /> Net</div>
        </div>
        <div className="text-center text-[10px] uppercase tracking-widest text-gray-500">
           Powered by Razorpay & Stripe
        </div>
      </div>
    </div>
  );
}
