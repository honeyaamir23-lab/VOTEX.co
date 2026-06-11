import { Trophy, TrendingUp } from 'lucide-react';
import { useGame } from '../context/GameContext';

export default function TopRanking() {
  const { state } = useGame();
  const users = [...(state?.users || [])].filter(u => {
    if (u.is_admin) return false;
    if (u.is_bot) {
      return u.approved_for_leaderboard === true;
    }
    return u.approved_for_leaderboard !== false;
  }).sort((a, b) => b.balance - a.balance);

  return (
    <div className="p-4 space-y-6">
      <div className="mb-4 text-center">
        <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Leaderboard</h2>
        <p className="text-sm text-gray-500">Top earners on Votex</p>
      </div>

      <div className="bg-[#131823] border border-gray-800 rounded-3xl p-4 shadow-xl">
         <div className="space-y-2">
            {users.map((user, idx) => {
               const parts = user.username.trim().split(' ');
               let emoji = '';
               let displayName = user.username;
               if (parts.length > 1 && parts[0].length <= 3 && /\p{Emoji}/u.test(parts[0])) {
                  emoji = parts[0];
                  displayName = parts.slice(1).join(' ');
               }
               return (
               <div key={user.id} className="flex items-center justify-between p-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                     <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        #{idx + 1}
                     </div>
                     <div className="flex items-center gap-2">
                        {emoji && <span className="text-xl">{emoji}</span>}
                        <p className="font-bold text-white text-sm">@{displayName}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-yellow-400 font-mono flex items-center gap-1 justify-end">
                        {user.balance.toLocaleString()} VTX
                     </p>
                     <p className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        top {(idx / Math.max(1, users.length) * 100).toFixed(0)}%
                     </p>
                  </div>
               </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
