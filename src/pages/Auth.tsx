import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "../store/useAuth";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { isSupabaseConfigured } from "../lib/supabase";
import { 
  User, 
  Mail, 
  Phone,
  ShieldCheck, 
  LogOut, 
  ArrowRight,
  Sparkles,
  Lock,
  ShoppingBag,
  MapPin,
  Heart,
  Loader2,
  Calendar,
  CheckCircle,
  Truck,
  Package,
  Sliders,
  ChevronRight,
  Clock,
  Map,
  BadgeAlert
} from "lucide-react";

export default function Auth() {
  const { isLoggedIn, user, signOut, openAuthModal, updateProfile, fetchFreshProfile, loading: authStoreLoading } = useAuthStore();
  const info = useBusinessInfoStore((state) => state.info);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab state (synced with URL)
  const activeTab = searchParams.get("tab") || "dashboard";
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Profile forms
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");

  // Preferences fields
  const [intensity, setIntensity] = useState("Medium");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customBio, setCustomBio] = useState("");

  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync profile forms when user loads
  useEffect(() => {
    if (isLoggedIn && user) {
      setName(user.name || user.user_metadata?.full_name || "");
      setMobile(user.mobile || "");
      setAddress(user.shipping_address || "");
      setCity(user.city || "");
      setStateName(user.state || "");
      setZip(user.zip || "");
      setCountry(user.country || "India");

      // Parse preferences
      if (user.preferences) {
        try {
          const pref = JSON.parse(user.preferences);
          if (pref.intensity) setIntensity(pref.intensity);
          if (pref.notes) setSelectedNotes(pref.notes);
          if (pref.bio) setCustomBio(pref.bio);
        } catch (e) {
          // If not JSON, set as custom bio
          setCustomBio(user.preferences);
        }
      }
    }
  }, [isLoggedIn, user]);

  // Fetch Orders
  const fetchOrders = () => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    setOrdersError(null);
    fetch("/api/user/orders", {
      headers: {
        "x-session-token": localStorage.getItem("ahr_session_token") || ""
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not retrieve orders.");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.orders) {
          setOrders(data.orders);
        }
      })
      .catch((err) => {
        console.error("Orders retrieve failure:", err);
        setOrdersError("We were unable to load your orders history. Please try again.");
      })
      .finally(() => {
        setOrdersLoading(false);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
      fetchFreshProfile();
    }
  }, [isLoggedIn]);

  // Save changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(null);
    setIsUpdating(true);

    try {
      await updateProfile({
        name,
        mobile,
        shipping_address: address,
        city,
        state: stateName,
        zip,
        country
      });
      setUpdateSuccess("Your contact details and delivery addresses have been synchronized.");
      setTimeout(() => setUpdateSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(null);
    setIsUpdating(true);

    const serializedPreferences = JSON.stringify({
      intensity,
      notes: selectedNotes,
      bio: customBio
    });

    try {
      await updateProfile({
        mobile: mobile || user?.mobile || "",
        preferences: serializedPreferences
      });
      setUpdateSuccess("Your personal bespoke olfactory preferences have been saved.");
      setTimeout(() => setUpdateSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleNote = (note: string) => {
    if (selectedNotes.includes(note)) {
      setSelectedNotes(selectedNotes.filter(n => n !== note));
    } else {
      setSelectedNotes([...selectedNotes, note]);
    }
  };

  // Helper to render human dates
  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <>
      <Helmet>
        <title>{isLoggedIn ? "Fragrance Dashboard" : "Premium Client Access"} | {info.name}</title>
        <meta name="description" content="Manage your premium Attar and Perfume orders with secure passwordless email authentication." />
      </Helmet>

      {/* Header spacer */}
      <div className="h-[72px]"></div>

      <div className="bg-[#FAF9F6] min-h-screen py-12 md:py-16 font-sans">
        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          
          {!isLoggedIn ? (
            /* ========================================================
               1. GUEST ACCESS SCREEN (NOT LOGGED IN)
               ======================================================== */
            <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-xl rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
              
              {/* Cover Banner */}
              <div className="md:col-span-5 bg-gray-950 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.15),transparent_45%)]" />
                
                <div className="relative space-y-4">
                  <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">Exquisite Attars</span>
                  <h2 className="font-serif text-3.5xl md:text-4xl font-light leading-tight">
                    Crafted for Discerning Senses
                  </h2>
                  <div className="h-0.5 w-12 bg-[#C5A059] mt-2"></div>
                </div>

                <div className="relative space-y-6 pt-12 md:pt-0">
                  <p className="text-stone-400 text-xs italic font-serif leading-relaxed">
                    "Fragrance is the most intense form of memory. It represents your character, legacy, and silent elegance."
                  </p>
                  
                  <div className="flex items-center space-x-3 text-[10px] font-mono text-stone-500 border-t border-stone-800 pt-4">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                    <span>Secured Premium Gateway</span>
                  </div>
                </div>
              </div>

              {/* Form Trigger area */}
              <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center space-y-8">
                <div className="space-y-3 text-center md:text-left">
                  <div className="inline-flex p-3 bg-stone-50 border border-stone-100 rounded-full text-[#C5A059]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h1 className="font-serif text-3.5xl text-gray-900 font-light leading-tight">
                    Premium Client Portal
                  </h1>
                  <p className="text-gray-500 text-sm font-light leading-relaxed max-w-md">
                    To access your customized fragrance history, track pending priority shipments, or update your bespoke shipping address, please log in.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                  <button
                    onClick={() => openAuthModal("login")}
                    className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black font-semibold rounded-xl text-xs uppercase tracking-widest transition-colors duration-200 shadow-sm"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openAuthModal("signup")}
                    className="flex-1 py-4 px-6 border border-stone-200 hover:border-gold-accent text-gray-700 hover:text-gold-accent font-semibold rounded-xl text-xs uppercase tracking-widest transition-colors"
                  >
                    Register Account
                  </button>
                </div>

                <div className="border-t border-stone-100 pt-5 text-[10px] text-stone-400 font-sans flex items-center justify-center md:justify-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Secure double-encryption credentials.</span>
                </div>
              </div>

            </div>
          ) : (
            /* ========================================================
               2. ACTIVE PROFILE WORKSPACE (LOGGED IN)
               ======================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Sidebar: User Details and Tab Selection */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Profile Card */}
                <div className="bg-white border border-gray-150 p-6 rounded-2xl text-center shadow-xs">
                  <div className="relative inline-block mx-auto">
                    <div className="w-20 h-20 bg-stone-950 rounded-full border-2 border-[#C5A059] flex items-center justify-center">
                      <User className="w-10 h-10 text-[#C5A059]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <h2 className="font-serif text-xl font-medium text-gray-900 leading-tight">
                      {name || "Exclusive Client"}
                    </h2>
                    <p className="text-xs text-gray-400 font-mono break-all">{user?.email}</p>
                    <span className="inline-block mt-2 bg-stone-50 border border-stone-200 text-stone-600 px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full">
                      Level: connoisseur
                    </span>
                  </div>
                </div>

                {/* Vertical Navigation Tabs */}
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                  <nav className="flex flex-col">
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className={`flex items-center justify-between px-5 py-4 text-xs font-semibold uppercase tracking-widest border-b border-gray-100 transition-colors ${
                        activeTab === "dashboard"
                          ? "bg-stone-50 text-[#C5A059] border-l-4 border-l-[#C5A059]"
                          : "text-gray-600 hover:bg-[#FAF9F6] hover:text-stone-900"
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <Sliders className="w-4 h-4" />
                        <span>Client Overview</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>

                    <button
                      onClick={() => setActiveTab("orders")}
                      className={`flex items-center justify-between px-5 py-4 text-xs font-semibold uppercase tracking-widest border-b border-gray-100 transition-colors ${
                        activeTab === "orders"
                          ? "bg-stone-50 text-[#C5A059] border-l-4 border-l-[#C5A059]"
                          : "text-gray-600 hover:bg-[#FAF9F6] hover:text-stone-900"
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <ShoppingBag className="w-4 h-4" />
                        <span>My Orders ({orders.length})</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>

                    <button
                      onClick={() => setActiveTab("address")}
                      className={`flex items-center justify-between px-5 py-4 text-xs font-semibold uppercase tracking-widest border-b border-gray-100 transition-colors ${
                        activeTab === "address"
                          ? "bg-stone-50 text-[#C5A059] border-l-4 border-l-[#C5A059]"
                          : "text-gray-600 hover:bg-[#FAF9F6] hover:text-stone-900"
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4" />
                        <span>Bespoke Shipping</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>

                    <button
                      onClick={() => setActiveTab("preferences")}
                      className={`flex items-center justify-between px-5 py-4 text-xs font-semibold uppercase tracking-widest transition-colors ${
                        activeTab === "preferences"
                          ? "bg-stone-50 text-[#C5A059] border-l-4 border-l-[#C5A059]"
                          : "text-gray-600 hover:bg-[#FAF9F6] hover:text-stone-900"
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <Heart className="w-4 h-4" />
                        <span>Scent Preferences</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </nav>
                </div>

                {/* Session Actions */}
                <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-xs">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center space-x-2 bg-red-500/5 hover:bg-red-550/10 border border-red-500/15 hover:border-red-550/20 text-red-600 py-3 text-xs uppercase tracking-wider font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>

              </div>

              {/* Right Sidebar: Dynamic Tab Content */}
              <div className="lg:col-span-9">
                <div className="bg-white border border-gray-150 p-6 md:p-8 rounded-2xl shadow-xs min-h-[500px]">
                  
                  {updateSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 border border-emerald-500/10 text-emerald-800 text-xs p-4 rounded-xl mb-6 tracking-wide"
                    >
                      {updateSuccess}
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === "dashboard" && (
                      <motion.div
                        key="tab-dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                      >
                        <div className="border-b border-stone-100 pb-4">
                          <h1 className="font-serif text-3xl text-gray-900 font-light">Client Dashboard</h1>
                          <p className="text-gray-500 text-xs mt-1">Select olfactory tabs to synchronize your bespoke fragrance experience.</p>
                        </div>

                        {/* Bento Grid Info cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          <div className="bg-[#FAF9F6] border border-gray-150 p-5 rounded-xl space-y-2">
                            <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Total Curations</p>
                            <p className="text-2xl font-serif text-gray-950 font-light">{orders.length} Orders</p>
                            <button onClick={() => setActiveTab("orders")} className="text-[10px] text-[#C5A059] font-semibold flex items-center hover:underline">
                              View items history <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>

                          <div className="bg-[#FAF9F6] border border-gray-150 p-5 rounded-xl space-y-2">
                            <Heart className="w-5 h-5 text-[#C5A059]" />
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Bespoke Scent Profile</p>
                            <p className="text-sm font-serif text-gray-950 font-semibold line-clamp-1">
                              {selectedNotes.length > 0 ? selectedNotes.slice(0, 3).join(" • ") : "No preference set"}
                            </p>
                            <button onClick={() => setActiveTab("preferences")} className="text-[10px] text-[#C5A059] font-semibold flex items-center hover:underline">
                              Adjust olfactory dial <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>

                          <div className="bg-[#FAF9F6] border border-gray-150 p-5 rounded-xl space-y-2">
                            <MapPin className="w-5 h-5 text-[#C5A059]" />
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Delivery Location</p>
                            <p className="text-xs font-serif text-gray-950 font-semibold line-clamp-1">
                              {city ? `${city}, ${stateName}` : "No address set"}
                            </p>
                            <button onClick={() => setActiveTab("address")} className="text-[10px] text-[#C5A059] font-semibold flex items-center hover:underline">
                              Edit shipping port <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>

                        </div>

                        {/* Recent Order Preview */}
                        <div className="space-y-4">
                          <h3 className="font-serif text-lg text-gray-900 uppercase tracking-wider">Active Fragrance Transit</h3>
                          {orders.length > 0 ? (
                            <div className="border border-stone-150 rounded-xl overflow-hidden">
                              <div className="bg-stone-50 px-5 py-3 border-b border-stone-150 flex items-center justify-between text-xs text-gray-600">
                                <span className="font-mono">Reference: AHR-{orders[0].id}</span>
                                <span className="font-bold uppercase tracking-wider text-[10px] text-[#C5A059]">
                                  {orders[0].status || "In preparation"}
                                </span>
                              </div>
                              <div className="p-5 flex items-start justify-between gap-4">
                                <div className="space-y-1 text-xs">
                                  <p className="font-serif font-semibold text-gray-800">
                                    Placed on {formatOrderDate(orders[0].order_date || orders[0].createdAt)}
                                  </p>
                                  <p className="text-stone-400">
                                    {orders[0].items?.length} delicate item(s) • Total Value: ₹{Number(orders[0].total_amount).toLocaleString()}
                                  </p>
                                </div>
                                <button onClick={() => setActiveTab("orders")} className="border border-stone-250 text-stone-800 px-4 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-stone-50 rounded-lg">
                                  Track Details
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-stone-200 p-8 rounded-xl text-center space-y-3">
                              <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                              <p className="text-stone-500 text-xs">No active fragrances are currently under blending or priority transit.</p>
                              <Link to="/shop" className="inline-block bg-stone-950 hover:bg-[#C5A059] text-white hover:text-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg font-bold">
                                Curation Studio
                              </Link>
                            </div>
                          )}
                        </div>

                      </motion.div>
                    )}

                    {/* ORDER HISTORY TAB */}
                    {activeTab === "orders" && (
                      <motion.div
                        key="tab-orders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                          <div>
                            <h1 className="font-serif text-3xl text-gray-900 font-light">My Orders</h1>
                            <p className="text-gray-500 text-xs mt-1">Review active blends, past transactions, and safe package transits.</p>
                          </div>
                          <button onClick={fetchOrders} className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold border border-gold-accent/20 px-3 py-1.5 hover:bg-stone-50 rounded-lg">
                            Refresh Logs
                          </button>
                        </div>

                        {ordersLoading ? (
                          <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
                            <p className="text-stone-400 text-xs uppercase tracking-widest">Retrieving order caches...</p>
                          </div>
                        ) : ordersError ? (
                          <div className="bg-red-50 border border-red-500/10 p-6 rounded-xl text-center space-y-3">
                            <BadgeAlert className="w-8 h-8 text-red-500 mx-auto" />
                            <p className="text-red-800 text-xs font-semibold">{ordersError}</p>
                            <button onClick={fetchOrders} className="text-xs text-[#C5A059] hover:underline font-bold uppercase tracking-widest">Try Again</button>
                          </div>
                        ) : orders.length === 0 ? (
                          <div className="text-center py-16 space-y-4 border border-dashed border-stone-200 rounded-xl">
                            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                            <h3 className="font-serif text-xl text-gray-800">Your fragrance bag is empty</h3>
                            <p className="text-stone-400 text-xs max-w-sm mx-auto leading-relaxed">
                              You haven't placed any premium perfume orders yet. Start your journey by exploring Indore's classic olfactory selections.
                            </p>
                            <Link to="/shop" className="inline-block bg-stone-950 hover:bg-[#C5A059] text-white hover:text-black text-xs font-semibold uppercase tracking-widest px-8 py-3.5 rounded-lg">
                              Curation Studio
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {orders.map((order, oIdx) => {
                              // Standardize items array safely
                              let parsedItems: any[] = [];
                              if (order.items) {
                                if (typeof order.items === "string") {
                                  try {
                                    parsedItems = JSON.parse(order.items);
                                  } catch (e) {
                                    parsedItems = [];
                                  }
                                } else if (Array.isArray(order.items)) {
                                  parsedItems = order.items;
                                }
                              }

                              const totalVal = Number(order.total_amount || 0);

                              return (
                                <motion.div 
                                  key={order.id}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: oIdx * 0.05 }}
                                  className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-xs"
                                >
                                  {/* Order Title bar */}
                                  <div className="bg-stone-50 px-6 py-4 border-b border-gray-150 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-600 font-mono">
                                    <div className="flex gap-4">
                                      <div>
                                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Reference Code</span>
                                        <span className="font-bold text-gray-900">AHR-{order.id}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Date Placed</span>
                                        <span className="text-gray-800">{formatOrderDate(order.order_date || order.createdAt)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Payment Mode</span>
                                        <span className="text-gray-800 uppercase text-[10px]">{order.payment_method || "UPI"}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Transaction Value</span>
                                      <span className="font-serif font-bold text-[#C5A059] text-base">₹{totalVal.toLocaleString()}</span>
                                    </div>
                                  </div>

                                  {/* Order Contents */}
                                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                                    
                                    {/* Items List */}
                                    <div className="md:col-span-7 space-y-4">
                                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-stone-100 pb-2">Perfume Selection</p>
                                      {parsedItems.map((item, itemIdx) => (
                                        <div key={itemIdx} className="flex items-center space-x-4">
                                          {item.image && (
                                            <img 
                                              src={item.image} 
                                              alt={item.name} 
                                              className="w-12 h-12 object-cover rounded-lg border border-stone-100"
                                              referrerPolicy="no-referrer"
                                            />
                                          )}
                                          <div className="flex-1 text-xs">
                                            <p className="font-serif font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-stone-400 uppercase tracking-widest text-[9px] mt-0.5">
                                              Size: {item.size || "50ml"} • Qty: {item.quantity || 1}
                                            </p>
                                          </div>
                                          <div className="text-right text-xs font-mono text-gray-800">
                                            ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Tracking & Delivery port */}
                                    <div className="md:col-span-5 bg-stone-50 border border-stone-150/60 p-5 rounded-xl space-y-4">
                                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-stone-100 pb-2">Priority Safe Tracking</p>
                                      
                                      {/* Tracking Stepper */}
                                      <div className="space-y-4">
                                        <div className="flex items-start space-x-3 text-xs">
                                          <div className="mt-1 bg-emerald-50 text-emerald-500 p-1 rounded-full border border-emerald-100 flex-shrink-0">
                                            <CheckCircle className="w-3 h-3" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-gray-900">Olfactory Preparation Completed</p>
                                            <p className="text-gray-500 text-[10px] mt-0.5">Blend bottled under grade sterile conditions in our Indore facility.</p>
                                          </div>
                                        </div>

                                        <div className="flex items-start space-x-3 text-xs">
                                          <div className="mt-1 bg-amber-50 text-[#C5A059] p-1 rounded-full border border-[#C5A059]/20 flex-shrink-0">
                                            <Clock className="w-3 h-3 animate-spin" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-gray-900">Safe Packaging & Glass Shielding</p>
                                            <p className="text-gray-500 text-[10px] mt-0.5">Securing luxury flacon container under custom velvet cushions.</p>
                                          </div>
                                        </div>

                                        <div className="flex items-start space-x-3 text-xs opacity-45">
                                          <div className="mt-1 bg-gray-100 text-gray-400 p-1 rounded-full flex-shrink-0">
                                            <Truck className="w-3 h-3" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-gray-900">Priority Dispatch Handled</p>
                                            <p className="text-gray-500 text-[10px]">Handing over to safe priority courier for overnight air transport.</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="border-t border-stone-200 pt-3 text-[10px] text-gray-500">
                                        <span className="font-semibold block text-gray-800 uppercase tracking-wider text-[8px] mb-0.5">Shipping Address Port</span>
                                        {order.shipping_address}, {order.city}, {order.state} {order.zip}
                                      </div>

                                    </div>

                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* BESPOKE SHIPPING TAB */}
                    {activeTab === "address" && (
                      <motion.div
                        key="tab-address"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="border-b border-stone-100 pb-4">
                          <h1 className="font-serif text-3xl text-gray-900 font-light">Shipping Port & Contact</h1>
                          <p className="text-gray-500 text-xs mt-1">Configure your primary luxury destination port for effortless priority shipping checkout.</p>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Consignee Full Name</label>
                              <div className="relative">
                                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-300" />
                                <input 
                                  type="text" 
                                  required
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Full Name"
                                  className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Consignee Mobile</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-300" />
                                <input 
                                  type="tel" 
                                  required
                                  value={mobile}
                                  onChange={(e) => setMobile(e.target.value)}
                                  placeholder="Mobile Phone"
                                  className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                                />
                              </div>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Delivery Street Address</label>
                              <textarea 
                                required
                                rows={3}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Apartment details, building name, street address"
                                className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">City / Township</label>
                              <input 
                                type="text" 
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Indore"
                                className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">State / Province</label>
                              <input 
                                type="text" 
                                required
                                value={stateName}
                                onChange={(e) => setStateName(e.target.value)}
                                placeholder="Madhya Pradesh"
                                className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">PIN / Postal Code</label>
                              <input 
                                type="text" 
                                required
                                value={zip}
                                onChange={(e) => setZip(e.target.value)}
                                placeholder="452001"
                                className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Country</label>
                              <input 
                                type="text" 
                                required
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                              />
                            </div>

                          </div>

                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black py-3.5 px-8 text-[11px] font-semibold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 disabled:bg-gray-400"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Syncing Data Port...</span>
                              </>
                            ) : (
                              <span>Save Delivery Address</span>
                            )}
                          </button>

                        </form>
                      </motion.div>
                    )}

                    {/* FRAGRANCE PREFERENCES TAB */}
                    {activeTab === "preferences" && (
                      <motion.div
                        key="tab-preferences"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        <div className="border-b border-stone-100 pb-4">
                          <h1 className="font-serif text-3xl text-gray-900 font-light">Fragrance Settings</h1>
                          <p className="text-gray-500 text-xs mt-1">Personalize your olfactory choices so our Indore masters can custom package and recommend matching attar notes.</p>
                        </div>

                        <form onSubmit={handleSavePreferences} className="space-y-6 max-w-2xl">
                          
                          {/* Scent intensity */}
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Preferred Fragrance Intensity</label>
                            <p className="text-gray-400 text-[10px] tracking-wide mt-0.5 leading-relaxed">This dials in the concentration and blend projection style you prefer for bespoke curations.</p>
                            <div className="grid grid-cols-3 gap-3 pt-1">
                              {["Subtle", "Medium", "Intense"].map((level) => (
                                <button
                                  type="button"
                                  key={level}
                                  onClick={() => setIntensity(level)}
                                  className={`p-3 text-center border text-xs font-semibold uppercase tracking-wider rounded-xl transition-all ${
                                    intensity === level
                                      ? "border-[#C5A059] bg-[#C5A059]/5 ring-1 ring-[#C5A059] text-[#C5A059]"
                                      : "border-stone-200 text-gray-600 bg-white hover:border-stone-300"
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Fav families */}
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Favorite Fragrance Families</label>
                            <p className="text-gray-400 text-[10px] tracking-wide mt-0.5 leading-relaxed">Select matching notes. Our master blenders reference this checklist when sending complimentary tester vials with bulk orders.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                              {["Pure Oud (Dehn El Oud)", "Musky / White Musk", "Spicy Oriental", "Citrus Fresh", "Mogra / Jasmine", "Gulab / Rose", "Sandalwood (Chandan)", "Amber Warm", "Khus / Vetiver"].map((note) => {
                                const checked = selectedNotes.includes(note);
                                return (
                                  <button
                                    type="button"
                                    key={note}
                                    onClick={() => toggleNote(note)}
                                    className={`p-3 text-left border text-[11px] tracking-wide rounded-xl transition-all flex items-center justify-between ${
                                      checked
                                        ? "border-[#C5A059] bg-[#C5A059]/5 ring-1 ring-[#C5A059] text-gray-900 font-semibold"
                                        : "border-stone-200 text-gray-600 bg-white hover:border-stone-300"
                                    }`}
                                  >
                                    <span>{note}</span>
                                    {checked && <div className="w-2 h-2 bg-[#C5A059] rounded-full" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Olfactory profile Bio */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Olfactory Scent Bio & Packaging Notes</label>
                            <textarea 
                              rows={4}
                              value={customBio}
                              onChange={(e) => setCustomBio(e.target.value)}
                              placeholder="Describe your absolute favorite scent profile or specify customized luxury gifting message guidelines for bulk orders."
                              className="w-full bg-white border border-gray-200 px-4 py-3 text-xs tracking-wider text-gray-850 rounded-xl focus:outline-none focus:border-[#C5A059] transition-colors"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black py-3.5 px-8 text-[11px] font-semibold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 disabled:bg-gray-400"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving Olfactory Dial...</span>
                              </>
                            ) : (
                              <span>Save Bespoke Profile</span>
                            )}
                          </button>

                        </form>
                      </motion.div>
                    )}

                  </AnimatePresence>

                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
