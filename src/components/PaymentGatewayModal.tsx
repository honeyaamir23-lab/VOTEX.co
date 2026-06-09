import { X, Sparkles, Coins, ShoppingCart, ArrowRight, ShieldAlert } from "lucide-react";
import { Battle, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestantKey: 'A' | 'B';
  battle: Battle | null;
  profile: UserProfile | null;
  onPaySuccess: () => void;
  onRedirectToDeposit: () => void;
}

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  contestantKey,
  battle,
  profile,
  onPaySuccess,
  onRedirectToDeposit
}: PaymentGatewayModalProps) {
  if (!isOpen || !battle) return null;

  const contestant = contestantKey === 'A' ? battle.contestantA : battle.contestantB;
  const currentBalance = profile?.balance ?? 0;
  const voteCost = 5;
  const hasSufficientFunds = currentBalance >= voteCost;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Content Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-xl pointer-events-none rounded-full"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest font-mono text-amber-400 font-bold uppercase">PAY-TO-VOTE</span>
              <h3 className="text-lg font-bold text-white leading-tight">Payment Gateway</h3>
            </div>
          </div>

          <div className="space-y-5">
            {/* Limit Warning Notice */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 leading-relaxed flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>You have already casted your active <strong className="text-white">ONE FREE VOTE</strong> in this specific battle! Subsequent votes require a micro-payment.</span>
            </div>

            {/* Selected Contestant Badge */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={contestant.logoUrl}
                  alt={contestant.name}
                  className="w-10 h-10 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800/80"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Casting Vote For</div>
                  <div className="text-sm font-extrabold text-white">{contestant.name}</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/80 text-white font-mono font-semibold uppercase">
                ${contestant.symbol}
              </span>
            </div>

            {/* Line Items Transaction */}
            <div className="divide-y divide-slate-800 text-xs sm:text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Ledger Entry Service</span>
                <span className="text-white font-medium">Premium Vote Ticket</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Your Coin Balance</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {currentBalance} <Coins className="w-4 h-4 text-amber-400 inline" />
                </span>
              </div>
              <div className="py-2.5 flex justify-between text-base">
                <span className="text-slate-200 font-semibold">Total Cost</span>
                <span className="text-amber-400 font-bold flex items-center gap-1.5 font-mono">
                  -{voteCost} COINS
                </span>
              </div>
            </div>

            {/* Interaction State (funds check) */}
            {hasSufficientFunds ? (
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={onPaySuccess}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-extrabold rounded-2xl text-sm shadow-lg shadow-orange-500/10 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" /> Confirm & Process Payment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-800/40 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel Vote
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-red-950/20 border border-red-900/30 text-xs text-red-400 rounded-xl leading-relaxed">
                  ⚠️ <strong className="text-red-200">Insufficient Coin Balance!</strong> You need exactly 5 Coins, but only have {currentBalance} Coins in your ledger. scan the QR Code on the Deposit Page to credits tokens.
                </div>
                <button
                  type="button"
                  onClick={onRedirectToDeposit}
                  className="w-full py-3.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold rounded-xl text-xs tracking-wide transition-all flex items-center justify-center gap-2"
                >
                  Go to Deposit Page <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
