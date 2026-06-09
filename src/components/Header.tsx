import React, { useState } from "react";
import { Shield, Coins, User, KeyRound, Check, LogIn, LogOut } from "lucide-react";
import { UserProfile } from "../types";
import { motion } from "motion/react";

interface HeaderProps {
  profile: UserProfile | null;
  currentEmail: string;
  onEmailChange: (newEmail: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSignOut: () => void;
}

export default function Header({
  profile,
  currentEmail,
  onEmailChange,
  activeTab,
  setActiveTab,
  onSignOut
}: HeaderProps) {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(currentEmail);

  const isAdmin = currentEmail.toLowerCase().trim() === "honeyaamir23@gmail.com";

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmail.trim()) {
      onEmailChange(tempEmail.trim());
      setIsEditingEmail(false);
    }
  };

  const handleShortcutEmail = (email: string) => {
    setTempEmail(email);
    onEmailChange(email);
    setIsEditingEmail(false);
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("battles")}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
              <Coins className="w-6 h-6 text-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                VOTE<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">COIN</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-normal">CHAMPS</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wider font-mono uppercase hidden sm:block">CRYPTO SHOWDOWN POLLS</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab("battles")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                activeTab === "battles"
                  ? "bg-slate-800 text-white shadow-inner border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              🔥 Auctions & Battles
            </button>
            <button
              onClick={() => setActiveTab("deposit")}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                activeTab === "deposit"
                  ? "bg-slate-800 text-white shadow-inner border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              💎 Load Deposit
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${
                  activeTab === "admin"
                    ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-yellow-300 shadow-inner border border-amber-500/30"
                    : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
                }`}
              >
                🛠️ Admin Panel
              </button>
            )}
          </nav>

          {/* Right Area: Balance & User Profile email switcher */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Balance Tracker */}
            {profile && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl shadow-md transition-colors"
              >
                <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Coins className="w-4.5 h-4.5 text-amber-500 animate-spin" style={{ animationDuration: "8s" }} />
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">BALANCE</div>
                  <div className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1">
                    {profile.balance} <span className="text-xs text-amber-500">COINS</span>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Profile Menu & Account Badge */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/40 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-300">
                <User className="w-4 h-4 text-slate-400" />
                <span className="max-w-[124px] truncate hidden sm:inline">{currentEmail}</span>
                <span className="sm:hidden text-slate-400">Profile</span>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>

              {/* Secure Log Out Button to return to arena gate */}
              <button
                onClick={onSignOut}
                className="p-2 bg-slate-800/20 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/20 rounded-xl text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                title="Log Out of Arena"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
