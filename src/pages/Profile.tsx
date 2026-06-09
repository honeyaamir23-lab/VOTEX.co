import { ShieldAlert, LogOut, ArrowDownToLine, Upload, X, ExternalLink, Smartphone, Check, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import toast from 'react-hot-toast';

interface ProfileProps {
  isAdmin: boolean;
}

export default function Profile({ isAdmin }: ProfileProps) {
  const navigate = useNavigate();
  const { currentUser, state, submitDeposit, logoutUser, userRequest } = useGame();
  
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [depositMode, setDepositMode] = useState<'select' | 'crypto' | 'vtx' | 'vtx_form'>('select');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  
  const [depositAmount, setDepositAmount] = useState('500');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  React.useEffect(() => {
    if (currentUser?.balance !== undefined) {
      setIsUpdatingBalance(true);
      const timer = setTimeout(() => setIsUpdatingBalance(false), 800);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.balance]);

  if (!currentUser) return <div className="p-4 text-center">Loading...</div>;

  const myRealTransactions = state?.transactions?.filter(t => t.userId === currentUser.id).map(t => ({
      type: t.type,
      amount: t.amount > 0 ? t.amount : -t.amount,
      isPositive: t.amount > 0,
      status: 'COMPLETED',
      timestamp: t.date
  })) || [];

  const myDeposits = state?.deposits?.filter(d => d.userId === currentUser.id && d.status !== 'APPROVED').map(d => ({
      type: 'DEPOSIT',
      amount: d.amount,
      isPositive: true,
      status: d.status,
      timestamp: d.timestamp
  })) || [];

  const myWithdrawals = state?.pendingRequests?.filter(r => r.userId === currentUser.id && r.type === 'WITHDRAWAL' && r.status !== 'PAID').map(w => ({
      type: 'WITHDRAWAL',
      amount: w.amount,
      isPositive: false,
      status: w.status,
      timestamp: w.date
  })) || [];
  
  const myTransactions = [
     ...myRealTransactions,
     ...myDeposits,
     ...myWithdrawals
  ].sort((a,b) => b.timestamp - a.timestamp);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeposit = async () => {
    if (isSubmitting) return;
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (!transactionId || transactionId.trim().length === 0) {
      toast.error("Please enter a valid Transaction ID.");
      return;
    }

    if (!receiptImage) {
      toast.error("Please upload a receipt screenshot.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const paymentInfoStr = paymentMethod === 'easypaisa' ? `Easypaisa :: ${transactionId}` : `SadaPay :: ${transactionId}`;
      await submitDeposit(Number(depositAmount), receiptImage, paymentInfoStr);
      setIsDepositModalOpen(false);
      setDepositAmount('500');
      setTransactionId('');
      setReceiptImage(null);
      toast.success("Deposit request submitted!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 relative">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 border border-[#10B981] text-[#10B981] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300">
           <Check className="w-5 h-5 flex-shrink-0" />
           <p className="text-sm font-bold">{toastMessage}</p>
        </div>
      )}

      {isAdmin && (
        <button 
          onClick={() => navigate('/admin')}
          className="w-full bg-[#F43F5E] hover:bg-[#E11D48] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20 active:scale-95 mb-4">
          <ShieldAlert className="w-5 h-5" />
          ADMIN — Open control panel
        </button>
      )}

       {/* VIP Elite Profile Card */}
      <div className="relative mb-6 mt-2 overflow-hidden rounded-[24px] bg-[#1A1F2E]/50 p-[1px] shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-xl">
         {/* Subtle Neon Inner Border Gradient */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/40 via-transparent to-[#10B981]/10 opacity-50"></div>
         
         <div className="relative h-full w-full rounded-[23px] bg-[#131823]/95 p-6 pb-8 text-center ring-1 ring-[#10B981]/30">
            {/* Ambient glowing orb in the background */}
            <div className="absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#10B981]/10 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
               {/* Avatar Sphere */}
               {(() => {
                  const parts = (currentUser?.username || '').trim().split(' ');
                  
                  let profileIcon = <span className="text-4xl shadow-black font-bold">{(Array.from((currentUser?.username || '').trim())[0] as string | undefined)?.toUpperCase() || 'U'}</span>;
                  let displayName = currentUser?.username || 'Unknown';
                  
                  if (parts.length > 1 && parts[0].length <= 3 && /\p{Emoji}/u.test(parts[0])) {
                     profileIcon = <span className="text-5xl drop-shadow-md">{parts[0]}</span>;
                     displayName = parts.slice(1).join(' ');
                  }
                  
                  return (
                    <>
                       <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10B981]/20 to-transparent flex items-center justify-center ring-2 ring-[#10B981]/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] mb-2 mt-2">
                          {profileIcon}
                       </div>
                       
                       {/* Username & Verified Badge */}
                       <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                             @{displayName}
                          </h2>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981] ring-1 ring-[#10B981]/30">
                             <BadgeCheck className="h-4 w-4" strokeWidth={2.5} />
                          </div>
                       </div>
                    </>
                  );
               })()}

               {/* Tech-vibes Profile ID */}
               <div className="inline-flex flex-col items-center justify-center sm:flex-row sm:gap-4 gap-2 rounded-xl bg-black/60 px-6 py-3 shadow-inner ring-1 ring-white/5">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">Profile ID</span>
                  <span className="font-mono text-lg font-bold tracking-[0.1em] text-white/90">
                     {currentUser.uniqueId}
                  </span>
               </div>
            </div>

            {/* Divider */}
            <div className="relative z-10 mx-auto my-7 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-[#10B981]/25 to-transparent"></div>

            {/* Balance Details */}
            <div className="relative z-10 flex flex-col items-center">
               <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Available Balance</div>
               <div className={`flex items-center justify-center gap-3 transition-all duration-500 ${isUpdatingBalance ? 'scale-110 drop-shadow-[0_0_25px_rgba(16,185,129,0.8)]' : 'drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                  <span className="text-5xl sm:text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">VTX-</span>
                  <span className="text-4xl sm:text-5xl font-bold text-[#10B981] tracking-tight">{Number(currentUser.balance || 0).toLocaleString()}</span>
               </div>
               
               <button 
                  onClick={() => setIsWalletModalOpen(true)} 
                  className="mt-6 px-10 py-3 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-sm font-black uppercase tracking-widest rounded-full hover:bg-[#10B981]/20 transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
               >
                   Wallet
               </button>
            </div>
         </div>
      </div>

      {/* My Transactions List */}
      <div className="pt-4 pb-8">
        <h3 className="text-xs font-black tracking-widest text-white uppercase mb-3 px-1">MY TRANSACTIONS</h3>
        {myTransactions.length > 0 ? (
          <div className="space-y-3">
             {myTransactions.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#131823] rounded-2xl border border-gray-800 shadow-md">
                   <div className="flex items-center gap-3">
                      {t.isPositive ? (
                         <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                            <ArrowDownToLine className="w-5 h-5" />
                         </div>
                      ) : (
                         <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                            <ArrowDownToLine className="w-5 h-5 rotate-180" />
                         </div>
                      )}
                      <div>
                         <p className="font-bold text-sm text-white">
                            {t.isPositive ? '+' : '-'} {t.amount} VTX
                         </p>
                         <p className="text-[10px] text-gray-400 capitalize">{t.type.replace('_', ' ').toLowerCase()}</p>
                         <p className="text-[10px] text-gray-500">{new Date(t.timestamp).toLocaleString()}</p>
                      </div>
                   </div>
                   
                   <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      t.status === 'COMPLETED' || t.status === 'APPROVED' || t.status === 'PAID' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 
                      t.status === 'REJECTED' ? 'bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20' : 
                      'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                   }`}>
                      {t.status}
                   </div>
                </div>
             ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm bg-[#131823] border border-gray-800 rounded-2xl">
            No transactions yet.
          </div>
        )}
      </div>

      <div className="pt-6 text-center">
         <button onClick={logoutUser} className="text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 mx-auto text-xs font-bold uppercase tracking-widest">
            <LogOut className="w-4 h-4" /> Log out
         </button>
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-[#131823] border border-gray-800 rounded-[20px] w-full max-w-sm shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800/50 relative">
                 <h2 className="text-white font-bold text-lg w-full text-center">
                    {depositMode === 'select' && 'Select Deposit Method'}
                    {depositMode === 'crypto' && 'Crypto Deposit'}
                    {depositMode === 'vtx' && 'Global Exchange Directory'}
                    {depositMode === 'vtx_form' && 'VOTEX Official Deposit'}
                 </h2>
                 {depositMode !== 'select' && (
                    <button 
                      onClick={() => setDepositMode('select')}
                      className="absolute left-4 w-7 h-7 bg-gray-800/50 text-gray-400 rounded-full flex items-center justify-center text-xs"
                    >
                      ←
                    </button>
                 )}
                 <button 
                   onClick={() => { setIsDepositModalOpen(false); setDepositMode('select'); }}
                   className="absolute right-4 w-7 h-7 bg-gray-800/50 hover:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
                 {depositMode === 'select' && (
                    <div className="space-y-3">
                       <button 
                          onClick={() => setDepositMode('crypto')}
                          className="w-full bg-[#1A1F2E] border border-gray-800 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-[#10B981]/50 transition-colors"
                       >
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <ArrowDownToLine className="w-6 h-6" />
                          </div>
                          <span className="text-white font-bold">1. Crypto Deposit</span>
                          <span className="text-xs text-gray-400 font-medium">USDT / BEP20 (Instant)</span>
                       </button>
                       <button 
                          onClick={() => setDepositMode('vtx')}
                          className="w-full bg-[#1A1F2E] border border-gray-800 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-[#10B981]/50 transition-colors"
                       >
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                             <ExternalLink className="w-6 h-6" />
                          </div>
                          <span className="text-white font-bold">2. VTX Exchange</span>
                          <span className="text-xs text-gray-400 font-medium">PKR / Local Payment Channels</span>
                       </button>
                    </div>
                 )}

                 {depositMode === 'crypto' && (
                    <div className="text-center py-8">
                       <p className="text-gray-400 text-sm mb-4">Crypto deposits are coming soon.</p>
                       <p className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded inline-block">Please use VTX Exchange for now.</p>
                    </div>
                 )}

                 {depositMode === 'vtx' && (
                    <div className="space-y-4">
                       <button 
                          onClick={() => setDepositMode('vtx_form')}
                          className="w-full bg-gradient-to-r from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/30 p-4 rounded-xl flex items-center justify-between hover:bg-[#10B981]/20 transition-all active:scale-95"
                       >
                          <div className="text-left">
                             <h3 className="text-white font-bold flex items-center gap-2">VOTEX Official <BadgeCheck className="w-4 h-4 text-[#10B981]" /></h3>
                             <p className="text-xs text-[#10B981] font-mono mt-1">● Online (Verified)</p>
                          </div>
                          <div className="bg-[#10B981] text-black text-[10px] font-black uppercase px-3 py-1 rounded-full">
                             Deposit
                          </div>
                       </button>

                       <div className="pt-2">
                          <h4 className="text-[10px] font-black tracking-widest text-gray-500 uppercase px-1 mb-3">Global Exchange Directory</h4>
                          
                          <div className="space-y-2">
                             {[
                               { country: 'UAE', code: 'AE', flag: '🇦🇪' },
                               { country: 'United Kingdom', code: 'UK', flag: '🇬🇧' },
                               { country: 'Malaysia', code: 'MY', flag: '🇲🇾' },
                               { country: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' }
                             ].map((ex) => (
                                <div key={ex.code} className="bg-[#1A1F2E] border border-gray-800 p-3 rounded-xl flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <span className="text-2xl">{ex.flag}</span>
                                      <div>
                                         <p className="text-white font-bold text-sm leading-none mb-1">{ex.country}</p>
                                         <p className="text-[10px] text-gray-500 font-mono font-bold">○ Offline</p>
                                      </div>
                                   </div>
                                   <div className="bg-gray-800/50 text-gray-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded cursor-not-allowed">
                                      Coming Soon
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {depositMode === 'vtx_form' && (
                    <div className="space-y-5 animate-in slide-in-from-right-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AMOUNT (PKR)</label>
                          <input 
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#10B981] transition-colors"
                          />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SELECT PAYMENT METHOD</label>
                          <select 
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#10B981] transition-colors appearance-none"
                          >
                             <option value="" disabled>Select an account</option>
                             <option value="easypaisa">Easypaisa</option>
                             <option value="sadapay">SadaPay</option>
                          </select>
                       </div>

                       {(() => {
                           if (!paymentMethod) return null;
                           
                           const conf = state?.platformStats?.paymentConfig?.[paymentMethod as 'easypaisa' | 'sadapay'] || { iban: '', deepLink: '', qrUrl: '' };

                           return (
                               <div className="space-y-4 animate-in fade-in">
                                  <div className="bg-[#1A1F2E] border border-gray-800 rounded-xl p-4 text-center">
                                     <h4 className="text-white font-bold mb-1">{paymentMethod === 'easypaisa' ? 'Easypaisa' : 'SadaPay'}</h4>
                                     <p className="text-gray-400 text-xs mb-3">Send funds to the following account:</p>
                                     <div className="bg-black/50 p-4 rounded-lg border border-gray-800 flex flex-col items-center">
                                        <p className="text-white text-sm font-bold mb-2">Votex Admin</p>
                                        
                                        {conf.qrUrl && (
                                            <div className="bg-white p-2 rounded-xl mb-3 mt-1 shadow-lg max-w-min">
                                                <img src={conf.qrUrl} alt="Payment QR" className="w-[150px] h-[150px] object-contain" />
                                            </div>
                                        )}
                                        
                                        <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-gray-800/50">
                                            <span className="text-xs text-gray-500">Account:</span>
                                            <span className="text-[#10B981] font-mono text-xs sm:text-sm break-all font-bold tracking-widest">{conf.iban || 'Not configured'}</span>
                                        </div>
                                     </div>
                                     
                                     {conf.iban && (
                                     <button 
                                       onClick={() => {
                                          navigator.clipboard.writeText(conf.iban).catch(() => {});
                                          setToastMessage("Account copied!");
                                          setTimeout(() => setToastMessage(null), 3000);
                                       }}
                                       className="w-full mt-3 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-bold py-2.5 rounded-lg hover:bg-[#10B981]/20 transition-colors flex items-center justify-center gap-2"
                                     >
                                        Copy Account
                                     </button>
                                     )}

                                     {conf.deepLink && (
                                     <button 
                                       onClick={() => {
                                          window.location.href = conf.deepLink;
                                       }}
                                       className="w-full mt-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold py-2.5 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                                     >
                                        Open in App
                                     </button>
                                     )}
                                  </div>

                                  <div className="space-y-1.5">
                                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enter Transaction ID (Required)</label>
                                     <input 
                                       type="text"
                                       value={transactionId}
                                       onChange={(e) => setTransactionId(e.target.value)}
                                       placeholder="Enter 11 to 14 digit TID or ref number"
                                       className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-[#10B981] transition-colors"
                                     />
                                  </div>

                                  <div className="space-y-1.5 pt-2">
                                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">UPLOAD RECEIPT (Required)</label>
                                     <div 
                                       onClick={() => fileInputRef.current?.click()}
                                       className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                                         receiptImage ? 'border-[#10B981]/50 bg-[#10B981]/5' : 'border-gray-800 hover:border-gray-600 bg-[#1A1F2E]'
                                       }`}
                                     >
                                        {receiptImage ? (
                                           <div className="flex flex-col items-center">
                                              <Check className="w-5 h-5 text-[#10B981] mb-1" />
                                              <span className="text-xs text-[#10B981] font-bold">Screenshot Attached!</span>
                                              <span className="text-[10px] text-gray-500 mt-1">Tap to change</span>
                                           </div>
                                        ) : (
                                           <>
                                              <Upload className="w-5 h-5 text-gray-500" />
                                              <span className="text-xs text-gray-400">Tap to upload screenshot</span>
                                           </>
                                        )}
                                     </div>
                                     <input 
                                       type="file" 
                                       accept="image/*" 
                                       className="hidden" 
                                       ref={fileInputRef}
                                       onChange={handleImageUpload}
                                     />
                                  </div>
                               </div>
                           );
                       })()}

                       <button 
                         onClick={handleSubmitDeposit}
                         disabled={isSubmitting || (transactionId.length < 11 || !receiptImage)}
                         className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95"
                       >
                         {isSubmitting ? 'Submitting...' : 'Submit Deposit'}
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-[#131823] border border-gray-800 rounded-[20px] w-full max-w-sm shadow-2xl relative flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-800/50 relative">
                 <h2 className="text-white font-bold text-lg w-full text-center">Withdraw Funds</h2>
                 <button 
                   onClick={() => {
                      setIsWithdrawModalOpen(false);
                      setWithdrawAmount('');
                   }}
                   className="absolute right-4 w-7 h-7 bg-gray-800/50 hover:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
              </div>

              <div className="p-5">
                 <form 
                   onSubmit={async (e) => {
                      e.preventDefault();
                      if (isSubmitting) return;

                      const formData = new FormData(e.currentTarget);
                      const amount = Number(formData.get('amount'));
                      const method = formData.get('method') as string;
                      const account = formData.get('account') as string;
                      
                      if (!amount || amount <= 0 || !account) {
                         return toast.error('Please enter valid details.');
                      }
                      
                      setIsSubmitting(true);
                      try {
                         if (amount > (currentUser?.balance || 0)) {
                            throw new Error('Insufficient balance.');
                         }
                         await userRequest('REQUEST_WITHDRAWAL', { amount, easypaisaNumber: `[${method}] ${account}` });
                         (e.target as HTMLFormElement).reset();
                         setIsWithdrawModalOpen(false);
                         setWithdrawAmount('');
                          toast.success('Withdrawal request submitted successfully!');
                      } catch (err: any) {
                         toast.error(err.message);
                      } finally {
                         setIsSubmitting(false);
                      }
                   }}
                   className="space-y-4"
                 >
                    <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Payment Method</label>
                       <select 
                          name="method"
                          required
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#F43F5E] transition-colors appearance-none mb-4"
                       >
                          <option value="Easypaisa">Easypaisa</option>
                          <option value="SadaPay">SadaPay</option>
                          <option value="JazzCash">JazzCash</option>
                          <option value="Bank">Bank Transfer</option>
                       </select>
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Amount (Min {state.platformStats?.minWithdrawal || 500} - Max {state.platformStats?.maxWithdrawal || 50000})</label>
                       <input 
                          name="amount"
                          type="number"
                          placeholder="e.g., 500"
                           value={withdrawAmount}
                           onChange={(e) => setWithdrawAmount(e.target.value)}
                          required
                          className={`w-full bg-[#1A1F2E] border ${Number(withdrawAmount) > (currentUser?.balance || 0) ? 'border-red-500/80 focus:border-red-500' : 'border-gray-800 focus:border-[#F43F5E]'} rounded-xl px-4 py-3 text-white font-bold focus:outline-none transition-colors`}
                       />
                    </div>
                        {Number(withdrawAmount) > (currentUser?.balance || 0) && (
                           <div className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Insufficient balance.</span>
                           </div>
                        )}
                    <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Account No. / IBAN / Wallet Details</label>
                       <input 
                          name="account"
                          type="text"
                          placeholder="e.g. 03xx xxxxxxx or PK34..."
                          required
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#F43F5E] transition-colors"
                       />
                    </div>
                    <button 
                      type="submit" disabled={isSubmitting || Number(withdrawAmount) > (currentUser?.balance || 0)}
                      className="w-full bg-[#F43F5E] hover:bg-[#E11D48] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.2)] mt-2 active:scale-95"
                    >
                      <ArrowDownToLine className="w-5 h-5 rotate-180" />
                      {isSubmitting ? 'Processing...' : Number(withdrawAmount) > (currentUser?.balance || 0) ? 'Insufficient balance.' : 'Submit Withdraw Request'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Main Wallet Navigation Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#131823] border border-gray-800 rounded-t-[30px] sm:rounded-[30px] w-full max-w-sm shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-800 rounded-full sm:hidden"></div>
              
              <div className="flex items-center justify-between p-6 pb-2 relative">
                 <h2 className="text-white font-black text-2xl w-full text-center tracking-tight">Your Wallet</h2>
                 <button 
                   onClick={() => setIsWalletModalOpen(false)}
                   className="absolute right-6 top-6 w-8 h-8 bg-gray-800/50 hover:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6 pt-4 space-y-4">
                 <button 
                    onClick={() => {
                       setIsWalletModalOpen(false);
                       setIsDepositModalOpen(true);
                    }}
                    className="w-full bg-[#1A1F2E] hover:bg-[#1A1F2E]/80 border border-[#10B981]/20 p-5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 group"
                 >
                    <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center group-hover:bg-[#10B981] group-hover:text-black text-[#10B981] transition-colors">
                        <ArrowDownToLine className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                       <h3 className="text-white font-bold text-lg">Deposit Funds</h3>
                       <p className="text-gray-400 text-xs mt-0.5">Add VTX Coins via Exchange</p>
                    </div>
                 </button>
                 
                 <button 
                    onClick={() => {
                       setIsWalletModalOpen(false);
                       setIsWithdrawModalOpen(true);
                    }}
                    className="w-full bg-[#1A1F2E] hover:bg-[#1A1F2E]/80 border border-[#F43F5E]/20 p-5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 group"
                 >
                    <div className="w-12 h-12 rounded-xl bg-[#F43F5E]/10 flex items-center justify-center group-hover:bg-[#F43F5E] group-hover:text-white text-[#F43F5E] transition-colors">
                        <ArrowDownToLine className="w-6 h-6 rotate-180" />
                    </div>
                    <div className="text-left flex-1">
                       <h3 className="text-white font-bold text-lg">Withdraw Funds</h3>
                       <p className="text-gray-400 text-xs mt-0.5">Transfer VTX to your Wallet/Bank</p>
                    </div>
                 </button>
              </div>
              <div className="p-6 pt-0 text-center">
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Balance: {Number(currentUser.balance || 0).toLocaleString()} VTX</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
