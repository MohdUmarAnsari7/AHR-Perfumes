import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "../store/useAuth";
import { useBusinessInfoStore } from "../store/useBusinessInfo";
import { isSupabaseConfigured } from "../lib/supabase";
import { 
  X, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Lock
} from "lucide-react";

export function AuthModal() {
  const { 
    isAuthModalOpen, 
    authModalTab, 
    closeAuthModal, 
    openAuthModal,
    loading, 
    error, 
    mockOtp, 
    sendOtp, 
    verifyOtp,
    forceSandboxMode,
    enableSandboxMode
  } = useAuthStore();
  
  const info = useBusinessInfoStore((state) => state.info);

  // Form input states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpToken, setOtpToken] = useState("");
  
  // Progress states
  const [otpSent, setOtpSent] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset internal state when modal opens/closes or tab changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setOtpSent(false);
      setOtpToken("");
      setSuccessMsg(null);
      setLocalError(null);
      // Keep email and fullName if switching tabs
    }
  }, [isAuthModalOpen, authModalTab]);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!email) {
      setLocalError("Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (authModalTab === "signup" && !fullName.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }

    try {
      await sendOtp(email.trim(), authModalTab === "signup" ? fullName.trim() : undefined);
      setOtpSent(true);
      setSuccessMsg("Verification code sent! Please check your inbox.");
    } catch (err: any) {
      // Error is already set in the store, but we can capture local details if needed
      setLocalError(err.message || "Failed to send code. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!otpToken || otpToken.length < 4) {
      setLocalError("Please enter a valid verification code.");
      return;
    }

    try {
      await verifyOtp(email.trim(), otpToken.trim(), authModalTab === "signup" ? fullName.trim() : undefined);
      setSuccessMsg("Session verified successfully! Welcome back.");
      
      // Close modal on success after a brief delay
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } catch (err: any) {
      setLocalError(err.message || "Verification failed. Check your code.");
    }
  };

  const handleResetForm = () => {
    setOtpSent(false);
    setOtpToken("");
    setLocalError(null);
    setSuccessMsg(null);
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
            {authModalTab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Secure Passwordless Login via One-Time Verification Code (OTP)
          </p>
        </div>

        <div className="px-6 py-6 flex-1 overflow-y-auto">
          {/* Sandbox alert when Supabase isn't configured or sandbox mode is forced */}
          {(!isSupabaseConfigured || forceSandboxMode) && (
            <div className="mb-5 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-[#A68352] mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-amber-950 leading-normal">
                <strong>Local Demo Sandbox Active</strong>
                <p className="mt-0.5 text-amber-900/85">
                  Type any email and use verification code <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">123456</code> to complete instantly.
                </p>
              </div>
            </div>
          )}

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
              className="mb-5 bg-rose-50 border border-rose-200 p-3 rounded-xl flex flex-col space-y-2.5"
            >
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4.5 h-4.5 text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="text-[12px] text-rose-950 leading-normal font-sans">
                  {activeError}
                </div>
              </div>
              {isSupabaseConfigured && !forceSandboxMode && (
                <div className="bg-rose-100/40 p-2.5 rounded-lg border border-rose-200 text-[11px] text-rose-900 leading-normal font-sans mt-1">
                  <p className="font-semibold mb-1">💡 Developer Option</p>
                  <p className="mb-2">If your Supabase keys are not set up or are currently invalid, you can bypass this connection error and switch to the Local Demo Sandbox to continue testing logins.</p>
                  <button
                    type="button"
                    onClick={() => {
                      enableSandboxMode();
                      setLocalError(null);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Switch to Sandbox Mode
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* MOCK OTP HELPER POPUP */}
          {mockOtp && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 bg-gold-primary/10 border border-gold-primary/30 p-3.5 rounded-xl text-center shadow-xs"
            >
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-mono font-medium">
                🔑 Simulated OTP Inbox
              </p>
              <p className="text-2xl font-mono font-bold tracking-[0.4em] text-gray-900 my-1.5 ml-2.5">
                {mockOtp}
              </p>
              <p className="text-[10px] text-gray-500">
                Click the code to copy or type it below to log in.
              </p>
            </motion.div>
          )}

          {/* STEP 1: REQUEST CODE */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {authModalTab === "signup" && (
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
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-950 hover:bg-gold-primary text-white hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFY CODE */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[11px] text-gray-500 font-sans">
                  Verifying <span className="font-semibold text-gray-800">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[10px] text-gold-accent hover:text-gold-primary font-semibold underline mt-1 block mx-auto"
                >
                  Change Email / Reset Form
                </button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="otpInput" className="block text-xs font-medium text-gray-700 text-center">
                  Enter 6-Digit OTP Verification Code
                </label>
                <div className="relative max-w-[240px] mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    id="otpInput"
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. 123456"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ""))}
                    className="block w-full text-center pl-10 pr-3 py-2.5 text-lg font-mono font-bold tracking-widest bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-950 hover:bg-gold-primary text-white hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendOtp}
                  className="text-xs text-gray-500 hover:text-gold-accent transition-colors py-1.5 flex items-center justify-center space-x-1 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Link: Switch between Login & Register tabs */}
        {!otpSent && (
          <div className="bg-gray-50 py-4 px-6 border-t border-gray-100 text-center text-xs">
            {authModalTab === "login" ? (
              <p className="text-gray-500 font-sans">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="text-gold-accent hover:text-gold-primary font-semibold transition-colors focus:outline-hidden"
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
                  className="text-gold-accent hover:text-gold-primary font-semibold transition-colors focus:outline-hidden"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
