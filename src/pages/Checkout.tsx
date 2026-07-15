import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  ShoppingBag, 
  CheckCircle, 
  Truck, 
  ShieldCheck, 
  Coins, 
  Loader2,
  Building,
  User,
  Phone,
  Mail,
  Smartphone
} from "lucide-react";
import { useCartStore } from "../store/useCart";
import { useAuthStore } from "../store/useAuth";
import { useBusinessInfoStore } from "../store/useBusinessInfo";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, getSubtotal, clearCart } = useCartStore();
  const { isLoggedIn, user, openAuthModal } = useAuthStore();
  const info = useBusinessInfoStore((state) => state.info);

  const total = getTotal();
  const subtotal = getSubtotal();

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate("/cart");
    }
  }, [items, navigate]);

  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Order success states
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Autofill form if user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setEmail(user.email || "");
      setName(user.name || user.user_metadata?.full_name || "");
      setMobile(user.mobile || "");
      setAddress(user.shipping_address || "");
      setCity(user.city || "");
      setStateName(user.state || "");
      setZip(user.zip || "");
      setCountry(user.country || "India");
    }
  }, [isLoggedIn, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !name || !mobile || !address || !city || !stateName || !zip) {
      setError("Please fill in all the required checkout details.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create request payload
      const orderPayload = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size
        })),
        total_amount: total,
        shipping_address: address,
        city,
        state: stateName,
        zip,
        country,
        payment_method: paymentMethod,
        guestId: !isLoggedIn ? `guest_${Math.random().toString(36).substring(2, 8)}` : undefined
      };

      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isLoggedIn && { "x-session-token": localStorage.getItem("ahr_session_token") || "" })
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place your order.");
      }

      setPlacedOrder(data.order);
      setOrderSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during order creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Premium Secure Checkout | {info.name}</title>
        <meta name="description" content="Review your pure attar curation and select billing details under premium secure encryption." />
      </Helmet>

      {/* Header Spacer */}
      <div className="h-[72px]"></div>

      <main className="bg-[#FAF9F6] min-h-screen py-12 md:py-20 font-sans">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          
          <AnimatePresence mode="wait">
            {!orderSuccess ? (
              /* ACTIVE CHECKOUT FLOW */
              <motion.div 
                key="checkout-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
              >
                {/* Left: Forms */}
                <div className="lg:col-span-7 space-y-8">
                  
                  {/* Header/Back Link */}
                  <div className="flex items-center justify-between">
                    <Link to="/cart" className="inline-flex items-center text-xs uppercase tracking-widest text-gray-500 hover:text-[#C5A059] transition-colors font-semibold">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Cart
                    </Link>
                    {!isLoggedIn && (
                      <button 
                        onClick={() => openAuthModal("login")}
                        className="text-xs font-semibold text-[#C5A059] hover:underline"
                      >
                        Sign in for faster checkout
                      </button>
                    )}
                  </div>

                  <h1 className="font-serif text-3.5xl text-gray-900 font-light leading-none">
                    Secure Checkout
                  </h1>

                  {error && (
                    <div className="bg-red-550/10 border border-red-500/20 p-4 rounded-xl text-red-700 text-xs tracking-wide">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Customer Information */}
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-center space-x-2 text-stone-900 font-serif border-b border-gray-100 pb-3">
                        <User className="w-4 h-4 text-[#C5A059]" />
                        <h3 className="text-lg font-medium uppercase tracking-wider">1. Customer Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Contact Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                            <input 
                              type="email" 
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="e.g. email@domain.com"
                              className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Mobile Number *</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                            <input 
                              type="tel" 
                              required
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                              placeholder="e.g. +91 98765 43210"
                              className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-300" />
                            <input 
                              type="text" 
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Aarav Sharma"
                              className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-center space-x-2 text-stone-900 font-serif border-b border-gray-100 pb-3">
                        <MapPin className="w-4 h-4 text-[#C5A059]" />
                        <h3 className="text-lg font-medium uppercase tracking-wider">2. Shipping Address</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Street Address *</label>
                          <textarea 
                            required
                            rows={3}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Apartment, building name, street, locality"
                            className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">City *</label>
                            <input 
                              type="text" 
                              required
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="e.g. Indore"
                              className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">State / Region *</label>
                            <input 
                              type="text" 
                              required
                              value={stateName}
                              onChange={(e) => setStateName(e.target.value)}
                              placeholder="e.g. Madhya Pradesh"
                              className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">PIN / Postal Code *</label>
                            <input 
                              type="text" 
                              required
                              value={zip}
                              onChange={(e) => setZip(e.target.value)}
                              placeholder="e.g. 452001"
                              className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Country *</label>
                            <input 
                              type="text" 
                              required
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-800 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-center space-x-2 text-stone-900 font-serif border-b border-gray-100 pb-3">
                        <CreditCard className="w-4 h-4 text-[#C5A059]" />
                        <h3 className="text-lg font-medium uppercase tracking-wider">3. Premium Payment Method</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("UPI")}
                          className={`p-4 border rounded-xl text-left flex items-start space-x-3 transition-all ${
                            paymentMethod === "UPI"
                              ? "border-[#C5A059] bg-[#C5A059]/5 ring-1 ring-[#C5A059]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <Smartphone className={`w-5 h-5 mt-0.5 ${paymentMethod === "UPI" ? "text-[#C5A059]" : "text-gray-400"}`} />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Instant UPI QR (5% Discount)</p>
                            <p className="text-[10px] text-gray-500 mt-1">Pay instantly via PhonePe, GPay or Paytm.</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("Card")}
                          className={`p-4 border rounded-xl text-left flex items-start space-x-3 transition-all ${
                            paymentMethod === "Card"
                              ? "border-[#C5A059] bg-[#C5A059]/5 ring-1 ring-[#C5A059]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <CreditCard className={`w-5 h-5 mt-0.5 ${paymentMethod === "Card" ? "text-[#C5A059]" : "text-gray-400"}`} />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Credit / Debit Card</p>
                            <p className="text-[10px] text-gray-500 mt-1">Visa, Mastercard, RuPay & Amex encrypted.</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("Net Banking")}
                          className={`p-4 border rounded-xl text-left flex items-start space-x-3 transition-all ${
                            paymentMethod === "Net Banking"
                              ? "border-[#C5A059] bg-[#C5A059]/5 ring-1 ring-[#C5A059]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <Building className={`w-5 h-5 mt-0.5 ${paymentMethod === "Net Banking" ? "text-[#C5A059]" : "text-gray-400"}`} />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Indian Net Banking</p>
                            <p className="text-[10px] text-gray-500 mt-1">Direct safe login with all major banks.</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("COD")}
                          className={`p-4 border rounded-xl text-left flex items-start space-x-3 transition-all ${
                            paymentMethod === "COD"
                              ? "border-[#C5A059] bg-[#C5A059]/5 ring-1 ring-[#C5A059]"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <Coins className={`w-5 h-5 mt-0.5 ${paymentMethod === "COD" ? "text-[#C5A059]" : "text-gray-400"}`} />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Cash on Delivery</p>
                            <p className="text-[10px] text-gray-500 mt-1">Pay with cash upon package handoff.</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Place Order Trigger */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gray-950 hover:bg-[#C5A059] disabled:bg-stone-400 disabled:cursor-not-allowed text-white hover:text-black py-4.5 text-xs font-semibold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Secure Checkout Token...</span>
                        </>
                      ) : (
                        <span>Place Secure Order • ₹{total.toLocaleString()}</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right: Order Summary Sidebar */}
                <div className="lg:col-span-5">
                  <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-2xl sticky top-24 space-y-6">
                    <h3 className="font-serif text-xl text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                      Review Order
                    </h3>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 py-1 text-xs">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={item.image || null} 
                              alt={item.name} 
                              className="w-12 h-12 object-cover rounded-lg border border-stone-100"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-serif font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                              <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                                size: {item.size || "Standard"} • Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-gray-900 font-mono">₹{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-3 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Bag Subtotal</span>
                        <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Prepaid Payment Discount</span>
                        <span className="text-green-500 font-semibold font-mono">
                          {paymentMethod !== "COD" ? "- ₹" + Math.round(subtotal * 0.05).toLocaleString() : "₹0"}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Priority Shipping</span>
                        <span className="text-green-500 uppercase tracking-widest text-[10px] font-bold">Free</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                      <span className="font-serif text-lg text-gray-900 font-semibold">Grand Total</span>
                      <span className="font-serif text-2xl text-[#C5A059] font-bold font-mono">
                        ₹{(paymentMethod !== "COD" ? Math.round(total * 0.95) : total).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-[#FAF9F6] border border-gray-100 p-4 rounded-xl space-y-3.5">
                      <div className="flex items-start space-x-3 text-[11px] text-gray-600">
                        <Truck className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">Priority Safe Transit</p>
                          <p className="text-gray-500 mt-0.5">Estimated delivery within 3-5 business days from our Indore blending facility.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 text-[11px] text-gray-600 border-t border-stone-200/40 pt-3">
                        <ShieldCheck className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">Pure Grade Protection</p>
                          <p className="text-gray-500 mt-0.5">Packaged securely in premium custom padded gift boxes to preserve luxury glassware containers.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            ) : (
              /* ORDER SUCCESS SCREEN */
              <motion.div 
                key="order-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto text-center bg-white border border-gray-150 p-8 sm:p-12 rounded-3xl shadow-xl space-y-8"
              >
                <div className="inline-flex p-4 bg-emerald-50 text-emerald-500 rounded-full">
                  <CheckCircle className="w-16 h-16 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Transaction Confirmed</span>
                  <h1 className="font-serif text-3.5xl sm:text-4xl text-gray-900 font-light leading-tight">
                    Your Fragrance Order Is Placed!
                  </h1>
                  <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                    Thank you for shopping with A.H.R Perfumes. A luxurious blend is being prepared for dispatch to your address.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-150 p-6 rounded-2xl grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Order Reference</span>
                    <span className="text-sm font-semibold font-mono text-gray-800">AHR-{placedOrder?.id || "10284"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Grand Total Paid</span>
                    <span className="text-sm font-semibold font-mono text-gray-800">₹{Number(placedOrder?.total_amount || total).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 border-t border-gray-150 pt-3">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Destination Address</span>
                    <span className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {placedOrder?.shipping_address || address}, {placedOrder?.city || city}, {placedOrder?.state || stateName} {placedOrder?.zip || zip}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
                  {isLoggedIn ? (
                    <Link
                      to="/account?tab=orders"
                      className="w-full sm:w-auto bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-widest rounded-xl transition-all duration-300"
                    >
                      Track Order on Profile
                    </Link>
                  ) : (
                    <Link
                      to="/shop"
                      className="w-full sm:w-auto bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black px-8 py-3.5 text-xs font-semibold uppercase tracking-widest rounded-xl transition-all duration-300"
                    >
                      Browse More Collections
                    </Link>
                  )}
                  
                  {!isLoggedIn && (
                    <button
                      onClick={() => openAuthModal("signup")}
                      className="w-full sm:w-auto border border-gray-200 hover:border-gold-accent text-gray-700 px-8 py-3.5 text-xs font-semibold uppercase tracking-widest rounded-xl transition-all"
                    >
                      Create Account to Save Order
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </>
  );
}
