import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuth";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { 
  X, 
  Mail, 
  User, 
  Phone,
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

export function AuthModal() {
  const { 
    isAuthModalOpen, 
    authModalTab, 
    closeAuthModal, 
    openAuthModal,
    loading, 
    error,
    signUp,
    login
  } = useAuthStore();
  
  const info = useBusinessInfoStore((state) => state.info);

  // Form input states
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  
  // Login identifier (Email or Mobile)
  const [identifier, setIdentifier] = useState("");

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset internal state when modal opens/closes or tab changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setEmail("");
      setMobile("");
      setFullName("");
      setPassword("");
      setIdentifier("");
      setShowPassword(false);
      setSuccessMsg(null);
      setLocalError(null);
    }
  }, [isAuthModalOpen, authModalTab]);

  if (!isAuthModalOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    // Client-side validations
    if (!fullName.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setLocalError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (!mobile.trim()) {
      setLocalError("Please enter your mobile number.");
      return;
    }

    if (mobile.trim().length < 8) {
      setLocalError("Please enter a valid mobile number (at least 8 digits).");
      return;
    }

    if (!password) {
      setLocalError("Please set a password.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await signUp({
        email: email.trim(),
        mobile: mobile.trim(),
        name: fullName.trim(),
        password
      });

      setSuccessMsg("Registration successful! Welcome to " + info.name);
      
      // Close modal on success after a brief delay
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || "Failed to sign up. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!identifier.trim()) {
      setLocalError("Please enter your registered email address or mobile number.");
      return;
    }

    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    try {
      await login({
        identifier: identifier.trim(),
        password
      });

      setSuccessMsg("Logged in successfully! Welcome back.");
      
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || "Invalid email/mobile or password.");
    }
  };

  const activeError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop with fade-in */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Main modal card with scale/slide-up */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-100 z-10 flex flex-col"
      >
        {/* Top Accent gold bar */}
        <div className="h-1.5 w-full bg-[#C5A059]" />

        {/* Modal Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Logo */}
        <div className="px-6 pt-8 pb-4 text-center border-b border-gray-100">
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-semibold block mb-1">
            {info.name}
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-gray-900 font-light leading-tight">
            {authModalTab === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            {authModalTab === "login" 
              ? "Access your luxury orders, cart & favorites instantly" 
              : "Register using your email & mobile number for a secure account"
            }
          </p>
        </div>

        <div className="px-6 py-6 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Success message banner */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start space-x-2.5"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-[12px] text-emerald-950 leading-normal font-sans">
                {successMsg}
              </div>
            </motion.div>
          )}

          {/* Error message banner */}
          {activeError && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="text-[12px] text-rose-950 leading-normal font-sans">
                {activeError}
              </div>
            </motion.div>
          )}

          {/* LOGIN FORM */}
          {authModalTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="loginIdInput" className="block text-xs font-medium text-gray-700">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="loginIdInput"
                    type="text"
                    required
                    placeholder="e.g. you@example.com or +91987654321"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="loginPasswordInput" className="block text-xs font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="loginPasswordInput"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="fullNameInput" className="block text-xs font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="fullNameInput"
                    type="text"
                    required
                    placeholder="e.g. Alexander Mercer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emailInput" className="block text-xs font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="emailInput"
                    type="email"
                    required
                    placeholder="you@luxury.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="mobileInput" className="block text-xs font-medium text-gray-700">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="mobileInput"
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signupPasswordInput" className="block text-xs font-medium text-gray-700">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="signupPasswordInput"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-950 hover:bg-[#C5A059] text-white hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4.5 h-4.5 animate-pulse" />
                    <span>Create My Account</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Link: Switch between Login & Signup tabs */}
        <div className="bg-gray-50 py-4 px-6 border-t border-gray-100 text-center text-xs">
          {authModalTab === "login" ? (
            <p className="text-gray-500 font-sans">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => openAuthModal("signup")}
                className="text-[#C5A059] hover:text-[#b08b47] font-semibold transition-colors focus:outline-hidden"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p className="text-gray-500 font-sans">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="text-[#C5A059] hover:text-[#b08b47] font-semibold transition-colors focus:outline-hidden"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
