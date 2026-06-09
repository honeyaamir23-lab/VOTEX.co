import React, { useState } from "react";
import { Shield, Coins, PlusCircle, RefreshCw, Send, CheckCircle, Flame, AlertTriangle } from "lucide-react";
import { Battle, UserProfile } from "../types";
import { toast } from "./Toast";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  battles: Battle[];
  currentEmail: string;
}

export default function AdminPanel({ battles, currentEmail }: AdminPanelProps) {
  const [selectedBattleId, setSelectedBattleId] = useState<string>(battles[0]?.id || "");
  const [selectedContestant, setSelectedContestant] = useState<'A' | 'B'>('A');
  const [voteCountToInject, setVoteCountToInject] = useState<number>(250);
  const [userEmailTarget, setUserEmailTarget] = useState<string>("ziddikhani446@gmail.com");
  const [coinsToInject, setCoinsToInject] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeBattle = battles.find(b => b.id === selectedBattleId) || battles[0];

  const handleInjectVotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBattleId) return;
    setIsSubmitting(true);
    try {
      // Direct high-speed simulation of admin power: HTTP trigger or helper
      const response = await fetch("/api/admin/inject-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: selectedBattleId,
          contestant: selectedContestant,
          votes: voteCountToInject
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`⚡ Admin power deployed! Injected +${voteCountToInject} votes onto ${selectedContestant === 'A' ? activeBattle.contestantA.name : activeBattle.contestantB.name}`);
      } else {
        toast.error(data.message || "Failed to inject votes");
      }
    } catch {
      toast.error("Internal server synchronization error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInjectCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmailTarget.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/inject-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmailTarget,
          amount: coinsToInject
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`💰 Admin power: Credited +${coinsToInject} Gold Coins directly into target ledger (${userEmailTarget})!`);
      } else {
        toast.error(data.message || "Failed to reward user");
      }
    } catch {
      toast.error("Internal ledger offline");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm("Are you sure you want to reset all votes, profiles, and live ledger logs back to standard defaults? This is irreversible.")) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/reset-system", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        toast.success("🚨 System completely restored back to factory fresh state.");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to reset system state");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6 sm:py-10">
      
      {/* Visual Header */}
      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/[0.04] to-transparent border border-amber-500/15 rounded-3xl">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Shield className="w-8 h-8 animate-pulse text-amber-500" />
        </div>
        <div>
          <span className="text-[10px] tracking-wider font-mono font-bold text-amber-400 uppercase">SYSTEM BACKEND SUITE-V4</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">Admin Control Center</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Execute real-time network ledger manipulation. Grant simulated balances, inject battle vote entries, or wipe systemic states.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Fast Vote Injector */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-850">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Live Vote Injector</h3>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Directly manipulate poll results in real-time. Witness live percentage bars update instantly across all active displays.
            </p>

            <form onSubmit={handleInjectVotes} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Select Battle Arena</label>
                <select
                  value={selectedBattleId}
                  onChange={(e) => setSelectedBattleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {battles.map(b => (
                    <option key={b.id} value={b.id}>{b.title} (type: {b.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Contestant</label>
                  <select
                    value={selectedContestant}
                    onChange={(e) => setSelectedContestant(e.target.value as 'A' | 'B')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="A">Contestant A (${activeBattle?.contestantA.symbol || "A"})</option>
                    <option value="B">Contestant B (${activeBattle?.contestantB.symbol || "B"})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Votes to Inject</label>
                  <input
                    type="number"
                    value={voteCountToInject}
                    onChange={(e) => setVoteCountToInject(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Inject Votes Into Poll
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Simulated Balance Injector */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-850">
              <Coins className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Direct balance minter</h3>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Directly credit free Coins into any user profile to bypass real payment walls for stress-testing.
            </p>

            <form onSubmit={handleInjectCoins} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Target Email Address</label>
                <input
                  type="email"
                  value={userEmailTarget}
                  onChange={(e) => setUserEmailTarget(e.target.value)}
                  placeholder="e.g. ziddikhani446@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1.5">Free Coins to Drop</label>
                <input
                  type="number"
                  value={coinsToInject}
                  onChange={(e) => setCoinsToInject(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mint Coins to Target Ledger
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Dangerous Wipe Action Panel */}
      <div className="p-6 bg-red-950/20 border border-red-500/15 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wider">State Ledger Reset</h4>
            <p className="text-xs text-slate-400 mt-0.5">Wipe all simulated profiles, coin ledger balances, and vote counts to restore pristine factory state.</p>
          </div>
        </div>
        <button
          onClick={handleResetSystem}
          disabled={isSubmitting}
          className="py-2.5 px-6 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs tracking-wider transition-all whitespace-nowrap"
        >
          🚨 Reset Simulated State
        </button>
      </div>

    </div>
  );
}
