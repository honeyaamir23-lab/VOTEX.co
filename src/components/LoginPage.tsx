import React, { useState } from "react";
import { Coins, Shield, User, ArrowRight, Sparkles, KeyRound, Radio } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "./Toast";

interface LoginPageProps {
  onLogin: (email: string) => void;
  initialEmail: string;
}

export default function LoginPage({ onLogin, initialEmail }: LoginPageProps) {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Please enter a valid email address to authenticate.");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      onLogin(emailInput.trim());
      setIsLoading(false);
      toast.success(`Welcome to the Arena, ${emailInput.trim()}! Status synchronized.`);
    }, 800);
  };

  const handlePresetSelect = (presetEmail: string) => {
    setEmailInput(presetEmail);
    setIsLoading(true);
    setTimeout(() => {
      onLogin(presetEmail);
      setIsLoading(false);
      toast.success(`Authenticated with preset: ${presetEmail}`);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      
      {/* Background neon visual glow grids */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
        
        {/* Fine Matrix grid style decoration */}
        <div className="absolute inset-x-0 inset-y-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Floating 3D token glowing simulation */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/30 mb-4 ring-4 ring-amber-500/20">
          <Coins className="w-12 h-12 text-slate-950 animate-bounce" style={{ animationDuration: "3s" }} />
          <span className="absolute -bottom-1 -right-1 bg-green-500 text-[10px] text-slate-950 px-2 py-0.5 rounded-full font-bold font-mono border-2 border-slate-950 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-slate-950 animate-pulse" /> LIVE
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans mt-2">
          VOTE<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">COIN</span>
          <span className="text-sm px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 ml-2 font-semibold">CHAMPS</span>
        </h1>
        <p className="text-xs text-slate-400 tracking-widest font-mono uppercase mt-2">THE DEFI TOURNAMENT ARENA</p>
      </motion.div>

      {/* Premium Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" /> Secure Gateway Access
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your email to sync live ledger vote counts & virtual coin balances.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-mono text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <User className="w-4 h-4 text-slate-500" />
              </span>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Name your identity or enter email"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-sans"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 cursor-pointer text-sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Synchronizing Identity...
              </span>
            ) : (
              <>
                Enter the Arena <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </motion.div>

      {/* Decorative Outer Stats Footnote */}
      <div className="mt-8 text-center text-[11px] text-slate-600 font-mono relative z-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        <span>VOTE COIN SECURE INTERACTION GRAPH : PORT 3000 ACTIVE</span>
      </div>

    </div>
  );
}
