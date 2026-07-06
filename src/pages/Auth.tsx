import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuth";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { isSupabaseConfigured } from "../lib/supabase";
import { 
  User, 
  Mail, 
  Database, 
  ShieldCheck, 
  LogOut, 
  ArrowRight,
  Sparkles,
  Lock
} from "lucide-react";

export default function Auth() {
  const { isLoggedIn, user, signOut, openAuthModal } = useAuthStore();
  const info = useBusinessInfoStore((state) => state.info);

  return (
    <>
      <Helmet>
        <title>{isLoggedIn ? "My Premium Profile" : "Access Your Account"} | {info.name}</title>
        <meta name="description" content="Manage your premium Attar and Perfume orders with secure passwordless email authentication." />
      </Helmet>

      {/* Header spacer */}
      <div className="h-[72px]"></div>

      <div className="bg-[#FAF9F6] min-h-[80vh] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          
          {/* Brand/Hero Side Cover */}
          <div className="md:col-span-5 bg-gray-950 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.15),transparent_45%)]" />
            
            <div className="relative space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Exquisite Fragrances</span>
              <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight">
                Crafted for Discerning Senses
              </h2>
              <div className="h-1 w-12 bg-[#C5A059] mt-2"></div>
            </div>

            <div className="relative space-y-6 pt-12 md:pt-0">
              <p className="text-gray-400 text-xs italic font-serif leading-relaxed">
                "Fragrance is the most intense form of memory. It represents your character, legacy, and silent elegance."
              </p>
              
              <div className="flex items-center space-x-3 text-xs font-mono text-gray-500 border-t border-gray-800 pt-4">
                <ShieldCheck className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>Secured by Passwordless OTP</span>
              </div>
            </div>
          </div>

          {/* Authentication Action Side */}
          <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
            {isLoggedIn ? (
              /* LOGGED IN VIEW */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 w-full"
              >
                <div className="text-center md:text-left space-y-2">
                  <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold">Authenticated Session</span>
                  <h1 className="font-serif text-3xl text-gray-900 font-medium">
                    Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Sophisticated Guest"}
                  </h1>
                  <p className="text-gray-500 text-sm font-light">
                    Your premium perfume preferences and secure shopping sessions are active.
                  </p>
                </div>

                {/* Profile info cards */}
                <div className="grid grid-cols-1 gap-4 bg-gray-50 border border-gray-150 p-6 rounded-xl">
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <Mail className="w-4 h-4 text-[#C5A059]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Verified Email</p>
                      <p className="text-sm font-medium text-gray-800 font-mono">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <User className="w-4 h-4 text-[#C5A059]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">User ID / Reference</p>
                      <p className="text-sm font-light text-gray-800 font-mono break-all leading-none">{user?.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <Database className="w-4 h-4 text-[#C5A059]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">Platform Backend</p>
                      <p className="text-sm font-medium text-gray-800">
                        {isSupabaseConfigured ? "Live Supabase Cloud" : "Local Database Sandbox"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center justify-center space-x-2 bg-gray-950 hover:bg-[#C5A059] text-white px-6 py-3 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all duration-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>End Active Session</span>
                  </button>
                  
                  <a
                    href="/shop"
                    className="inline-flex items-center justify-center space-x-2 border border-gray-300 hover:border-gold-accent text-gray-800 px-6 py-3 text-xs uppercase tracking-wider font-semibold rounded-lg transition-all"
                  >
                    <span>Browse Collections</span>
                    <ArrowRight className="w-4 h-4 text-[#C5A059]" />
                  </a>
                </div>
              </motion.div>
            ) : (
              /* NOT LOGGED IN VIEW - REDIRECT / CALL-TO-ACTION */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center md:text-left space-y-6 w-full"
              >
                <div className="space-y-3">
                  <div className="inline-flex p-3 bg-[#FAF9F6] border border-gray-150 rounded-full text-[#C5A059] mb-2 animate-bounce">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h1 className="font-serif text-3.5xl text-gray-900 font-light leading-tight">
                    Premium Attar Portal
                  </h1>
                  <p className="text-gray-500 text-sm font-light leading-relaxed max-w-md">
                    To safeguard your personalized fragrance curation, order histories, and bespoke shipping details, please sign in.
                  </p>
                </div>

                <div className="flex flex-col gap-3 max-w-sm">
                  <button
                    onClick={() => openAuthModal("login")}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-gray-950 hover:bg-gold-primary text-white hover:text-black font-semibold rounded-xl text-xs uppercase tracking-widest transition-colors duration-200 shadow-sm cursor-pointer"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openAuthModal("signup")}
                    className="w-full py-3.5 px-6 border border-gray-250 hover:border-gold-accent text-gray-700 hover:text-gold-accent font-semibold rounded-xl text-xs uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                  >
                    Create Free Profile
                  </button>
                </div>

                <div className="border-t border-gray-150 pt-5 text-[11px] text-gray-400 font-sans flex items-center justify-center md:justify-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Verified email access. No passwords required.</span>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
