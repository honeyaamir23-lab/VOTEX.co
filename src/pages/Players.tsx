import React, { useState } from 'react';
import { Zap, ShieldAlert, Swords, Gift, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';

export default function Players() {
  const { state, currentUser, userRequest } = useGame();
  const navigate = useNavigate();
  const [giftTarget, setGiftTarget] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState<string>('');
  
  const users = state?.users?.filter(u => u.id !== currentUser?.id && !u.is_bot) || [];

  return (
    <div className="p-4 space-y-6 relative">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Players</h2>
        <p className="text-sm text-gray-500">Find opponents and share VTX</p>
      </div>

       <div className="space-y-3 relative z-0">
         {users.length > 0 ? (
           users.map(user => {
               const parts = user.username.trim().split(' ');
               let emojiIcon: React.ReactNode = <Zap className="w-6 h-6" />;
               let displayName = user.username;
               if (parts.length > 1 && parts[0].length <= 3 && /\p{Emoji}/u.test(parts[0])) {
                  emojiIcon = <span className="text-2xl">{parts[0]}</span>;
                  displayName = parts.slice(1).join(' ');
               } else {
                  const firstChar = Array.from(user.username.trim())[0] as string;
                  emojiIcon = <span className="text-xl font-bold">{firstChar ? firstChar.toUpperCase() : 'U'}</span>;
               }
               
               return (
              <div key={user.id} className="bg-[#131823] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                       {emojiIcon}
                    </div>
                    <div>
                       <h3 className="font-bold text-white">@{displayName}</h3>
                       <p className="text-xs text-emerald-400 font-mono">{user.balance.toLocaleString()} VTX</p>
                    </div>
                 </div>
                 <div className="flex gap-2 w-full pt-2">
                     <button 
                        onClick={() => navigate('/battle/new')}
                        className="flex-1 bg-[#1A1F2E] hover:bg-[#252B3B] text-emerald-400 border border-gray-800 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 text-xs"
                     >
                        <Swords className="w-4 h-4" />
                        Challenge
                     </button>
                     <button 
                        onClick={() => setGiftTarget(user.id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 text-xs shadow-lg shadow-purple-900/20"
                     >
                        <Gift className="w-4 h-4" />
                        Send VTX
                     </button>
                 </div>
              </div>
           )})
         ) : (
            <div className="text-center py-10 opacity-50">
               <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-gray-500" />
               <p>No other players found.</p>
             </div>
         )}
      </div>

      {/* Gift Modal */}
      {giftTarget && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#131823] border border-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
               <button 
                  onClick={() => { setGiftTarget(null); setGiftAmount(''); }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white"
               >
                  <X className="w-5 h-5" />
               </button>
               
               <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400 border border-purple-500/30">
                     <Gift className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Send Gift</h3>
                  <p className="text-sm text-gray-400 mt-1">Send VTX coins to @{state?.users?.find(u => u.id === giftTarget)?.username}</p>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (VTX)</label>
                     <input 
                        type="number"
                        value={giftAmount}
                        onChange={e => setGiftAmount(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full bg-[#0A0D14] border border-gray-800 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-purple-500 transition-colors text-center"
                        autoFocus
                     />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                     {[10, 50, 100].map(amt => (
                        <button
                           key={amt}
                           onClick={() => setGiftAmount(amt.toString())}
                           className="bg-[#1A1F2E] border border-gray-800 hover:border-purple-500/50 text-white rounded-lg py-2 font-mono text-sm transition-colors"
                        >
                           {amt}
                        </button>
                     ))}
                  </div>

                  <button 
                     onClick={() => {
                        userRequest('SEND_GIFT', { targetUserId: giftTarget, amount: giftAmount });
                        setGiftTarget(null);
                        setGiftAmount('');
                     }}
                     disabled={!giftAmount || isNaN(Number(giftAmount)) || Number(giftAmount) <= 0}
                     className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-4"
                  >
                     Send Gift Now
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
