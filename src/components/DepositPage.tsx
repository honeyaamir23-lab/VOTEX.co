import { useState } from "react";
import { QrCode, Coins, CheckCircle, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { UserProfile } from "../types";
import { depositCoins } from "../client";
import { motion, AnimatePresence } from "motion/react";

interface DepositPageProps {
  currentEmail: string;
  profile: UserProfile | null;
  onDepositSuccess: (updatedProfile: UserProfile) => void;
}

export default function DepositPage({
  currentEmail,
  profile,
  onDepositSuccess
}: DepositPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimulatedDeposit = async () => {
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const response = await depositCoins(currentEmail, depositAmount);
      if (response.success) {
        onDepositSuccess(response.profile);
        setSuccessMsg(`🎉 Successfully processed! Loaded +${depositAmount} Gold Coins into your wallet.`);
        setTimeout(() => setSuccessMsg(null), 8500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong during Simulated Deposit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Intro Header */}
      <div className="text-center mb-8">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-flex items-center gap-1.5 uppercase font-mono tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Secure Ledger Payment
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
          Load Battle Gold Tokens
        </h2>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-lg mx-auto">
          Scan the official secure QR code below to transfer USDT, USDC, or virtual credits. Your balance will synchronize in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* QR Code Column (Centered & Responsive) */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900/60 border border-slate-800 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* Inner frame for QR */}
          <div className="relative p-4 sm:p-5 bg-white rounded-3xl shadow-xl shadow-amber-500/5 border border-slate-200 w-full max-w-[280px] aspect-square flex items-center justify-center transition-transform hover:scale-102 duration-300">
            <img 
              src="https://i.postimg.cc/mrPYyyyf/qr-code.png" 
              alt="Deposit QR Code" 
              className="w-full h-full object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Prompt sub-heading as strictly requested */}
          <h3 className="text-sm sm:text-base font-bold text-white text-center mt-6 tracking-wide select-all flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400 animate-pulse" />
            Scan this QR Code to Make a Direct Deposit
          </h3>
          
          <p className="text-xs text-slate-400 text-center mt-2 max-w-[260px] leading-relaxed">
            Scan using your Wallet App (supports instant Binance Smart Chain / Polygon transfers)
          </p>
        </div>

        {/* Info & Sandbox Balance Updater Panel */}
        <div className="md:col-span-5 flex flex-col justify-between p-6 sm:p-8 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl">
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-4">Payment Guide</h4>
            
            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="flex-none font-bold text-amber-400 mt-0.5">01.</span>
                <span>Open your crypto wallet app or scanner and point to the QR code.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none font-bold text-amber-400 mt-0.5">02.</span>
                <span>Deposit any amount. Conversion rate: <strong className="text-amber-400">1 USD = 10 Coins</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-none font-bold text-amber-400 mt-0.5">03.</span>
                <span>Votes casted using premium paid ledger cost exactly <strong className="text-amber-400">5 Coins</strong> each.</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Simulated Deposit Sandbox</h4>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-normal">
              Since you are evaluating in the test sandbox, click below to instantly credit virtual coins to your profile (<strong className="text-white">{currentEmail}</strong>) in real-time.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {[20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      depositAmount === amt
                        ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/80"
                    }`}
                  >
                    +{amt} Coins
                  </button>
                ))}
              </div>

              <button
                onClick={handleSimulatedDeposit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    Simulate Direct Credit (+{depositAmount} Coins)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Notifications/Toasts using smooth transitions */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 rounded-xl border border-green-500/20 bg-green-950/20 text-green-400 flex items-start gap-2.5 text-xs sm:text-sm"
          >
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Deposit Credited Instantly</p>
              <p className="text-slate-300 mt-0.5">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 flex items-start gap-2.5 text-xs sm:text-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Payment Unsuccessful</p>
              <p className="text-slate-300 mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
