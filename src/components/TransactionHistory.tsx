import { VoteTransaction } from "../types";
import { Coins, ArrowUpRight, TrendingUp, Sparkles, MessageCircle, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TransactionHistoryProps {
  transactions: VoteTransaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  const truncateEmail = (email: string) => {
    const parts = email.split("@");
    if (parts[0].length <= 5) return email;
    return `${parts[0].substring(0, 4)}...@${parts[1]}`;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-xl flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500 animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Live Ledger Broadcast</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 uppercase font-mono tracking-wider bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          SYNCED
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="p-3 bg-slate-800/50 rounded-full border border-slate-700/85 text-slate-500 mb-3">
            <Coins className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono">WAITING FOR NETWORK ENTRIES</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[170px]">
            Cast a free or paid vote to register entries onto the dashboard.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
          <AnimatePresence initial={false}>
            {transactions.slice(0, 10).map((tx, idx) => {
              const isDeposit = tx.battleId === "deposit";
              const isPaid = tx.voteType === "paid";

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs leading-normal ${
                    isDeposit
                      ? "bg-emerald-500/5 border-emerald-500/15"
                      : isPaid
                      ? "bg-amber-500/5 border-amber-500/15"
                      : "bg-slate-850/60 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isDeposit 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : isPaid 
                        ? "bg-amber-500/10 text-amber-400" 
                        : "bg-slate-800 text-slate-300"
                    }`}>
                      {isDeposit ? (
                        <Wallet className="w-3.5 h-3.5" />
                      ) : isPaid ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-300 truncate tracking-tight">{truncateEmail(tx.email)}</span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 font-light">{formatTime(tx.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {isDeposit ? (
                          <span>Deposited virtual credits</span>
                        ) : (
                          <span>Voted <strong className="text-white">${tx.tokenSymbol}</strong> in <span className="text-slate-500">{tx.battleTitle}</span></span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isDeposit ? (
                      <span className="font-mono font-bold text-emerald-400 text-[11px] flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" /> +{tx.cost} COINS
                      </span>
                    ) : isPaid ? (
                      <span className="font-mono font-bold text-amber-500 text-[10px]">
                        -5 COINS
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 font-bold uppercase tracking-widest font-mono">
                        FREE
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
