import { Zap, Crown, Search, Swords } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CreateBattle() {
  const [battleType, setBattleType] = useState<'quick' | 'grand'>('quick');
  const [duration, setDuration] = useState('10 min');
  const [stakeIdx, setStakeIdx] = useState(0);
  const [search, setSearch] = useState('');
  
  const { sendChallenge, state, currentUser } = useGame();
  const navigate = useNavigate();

  // Ensure battle type syncs
  useEffect(() => {
     if (battleType === 'quick' && state.platformStats?.enableQuickBattles === false) {
         setBattleType('grand');
     }
     if (battleType === 'grand' && state.platformStats?.enableGrandBattles === false) {
         setBattleType('quick');
     }
  }, [state.platformStats, battleType]);

  const getStakes = () => {
    try {
      if (battleType === 'quick') {
        const customStakes = state?.platformStats?.quickStakes?.split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
        if (customStakes && customStakes.length > 0) return customStakes;
        return [500, 1000, 2000, 5000];
      } else {
        const customStakes = state?.platformStats?.grandStakes?.split(',').map(s => Number(s.trim())).filter(s => !isNaN(s));
        if (customStakes && customStakes.length > 0) return customStakes;
        return [10000, 25000, 50000, 100000];
      }
    } catch {
      return battleType === 'quick' ? [500, 1000, 2000, 5000] : [10000, 25000, 50000, 100000];
    }
  };
  const stakes = getStakes();
  
  const getDurations = () => battleType === 'quick' ? ['10 min', '15 min', '20 min', '30 min'] : ['3 days', '5 days', '1 week'];
  const durations = getDurations();
  
  // Ensure we switch to a valid duration when changing battle type
  if (battleType === 'quick' && !['10 min', '15 min', '20 min', '30 min'].includes(duration)) setDuration('10 min');
  if (battleType === 'grand' && !['3 days', '5 days', '1 week'].includes(duration)) setDuration('3 days');
  const users = state?.users || [];
  
  // Exclude current user from opponents and match by uniqueId or username
  const opponents = users.filter(u => u.id !== currentUser?.id && (u.uniqueId.includes(search) || u.username.toLowerCase().includes(search.toLowerCase())));
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

  const handleCreate = async () => {
     if (!selectedOpponent) return toast.error("Select an opponent");
     if ((currentUser?.balance || 0) < stakes[stakeIdx]) return toast.error("Insufficient balance");
     
     const durationMap: Record<string, number> = {
       '10 min': 10 * 60 * 1000,
       '15 min': 15 * 60 * 1000,
       '20 min': 20 * 60 * 1000,
       '30 min': 30 * 60 * 1000,
       '3 days': 3 * 24 * 60 * 60 * 1000,
       '5 days': 5 * 24 * 60 * 60 * 1000,
       '1 week': 7 * 24 * 60 * 60 * 1000
     };

     const opponent = state.users.find(u => u.id === selectedOpponent);
     if (!opponent) return;

     try {
       await sendChallenge(opponent.uniqueId, stakes[stakeIdx], battleType, durationMap[duration] || 10 * 60 * 1000);
       toast.success("Challenge sent successfully!");
       navigate('/');
     } catch (err: any) {
       toast.error(err.message);
     }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-white mb-4">Create Battle</h2>

      <div className="grid grid-cols-2 gap-4">
        {state.platformStats?.enableQuickBattles !== false && (
          <button 
            onClick={() => setBattleType('quick')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
              battleType === 'quick' ? 'bg-[#10B981]/10 border-[#10B981] text-white' : 'bg-[#1A1F2E] border-gray-800 text-gray-400'
            } transition-colors`}
          >
            <Zap className={`w-5 h-5 mb-1 ${battleType === 'quick' ? 'text-[#10B981]' : ''}`} />
            <span className="font-bold text-sm">Quick</span>
            <span className="text-[10px] opacity-70">10m - 1h</span>
          </button>
        )}

        {state.platformStats?.enableGrandBattles !== false && (
          <button 
            onClick={() => { setBattleType('grand'); setDuration('3 days'); }}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
              battleType === 'grand' ? 'bg-yellow-400/10 border-yellow-400 text-white' : 'bg-[#1A1F2E] border-gray-800 text-gray-400'
            } transition-colors`}
          >
            <Crown className={`w-5 h-5 mb-1 ${battleType === 'grand' ? 'text-yellow-400' : ''}`} />
            <span className="font-bold text-sm">Grand</span>
            <span className="text-[10px] opacity-70">3 - 15 days</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {durations.map(t => (
            <button 
              key={t}
              onClick={() => setDuration(t)}
              className={`py-2 text-[10px] whitespace-nowrap font-bold rounded-full border transition-colors ${
                duration === t ? 'bg-[#10B981] text-black border-[#10B981]' : 'bg-[#1A1F2E] border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stake (VTX)</label>
        <div className="grid grid-cols-4 gap-2">
           {stakes.map((s, idx) => (
            <button 
              key={s}
              onClick={() => setStakeIdx(idx)}
              className={`py-2 text-[10px] font-bold rounded-full border transition-colors ${
                stakeIdx === idx ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[#1A1F2E] border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1.5">
          20% Commission (Includes API, Server Hosting, and System Maintenance Costs)
        </p>
      </div>

      <div className="space-y-3">
         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Opponent</label>
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Unique ID or Name..."
              className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#10B981] transition-colors"
            />
         </div>
         {search && opponents.length > 0 && (
            <div className="bg-[#1A1F2E] border border-gray-800 rounded-xl mt-2 max-h-40 overflow-y-auto">
               {opponents.map(u => (
                  <div 
                     key={u.id}
                     onClick={() => { setSelectedOpponent(u.id); setSearch(u.uniqueId); }}
                     className={`p-3 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-[#252B3B] ${selectedOpponent === u.id ? 'bg-[#252B3B] text-[#10B981]' : ''}`}
                  >
                     {u.username} <span className="text-gray-500 text-xs ml-2">ID: {u.uniqueId}</span>
                  </div>
               ))}
            </div>
         )}
      </div>

      <div className="space-y-3">
         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Message (Optional)</label>
         <textarea 
            placeholder="Bring your best..."
            rows={3}
            className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#10B981] transition-colors resize-none"
         ></textarea>
      </div>

      <button 
         onClick={handleCreate}
         className="w-full bg-[#10B981] hover:bg-[#0ea5e9] text-black font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-lg shadow-emerald-500/20"
      >
         <Swords className="w-5 h-5" />
         Stake {stakes[stakeIdx]} VTX & Challenge
      </button>
    </div>
  );
}
