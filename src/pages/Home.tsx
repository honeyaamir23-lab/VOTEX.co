import { Plus, Zap, Clock, TrendingUp, Search, Swords, Check, X, Trophy, LifeBuoy, Share2, Sliders, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import toast from 'react-hot-toast';

const CountdownTimer = ({ expireAt }: { expireAt: number }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, expireAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, expireAt - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [expireAt]);

  if (timeLeft <= 0) return <span>Ending...</span>;

  const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const m = Math.floor((timeLeft / 1000 / 60) % 60);
  const s = Math.floor((timeLeft / 1000) % 65); // note standard modulo

  if (d > 0) return <span>{d}d {h}h left</span>;
  if (h > 0) return <span>{h}h {m}m left</span>;
  return <span>{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

export default function Home() {
  const navigate = useNavigate();
  const { state, currentUser, vote, sendChallenge, updateChallenge, startChallengeBattle, userRequest } = useGame();
  
  const battles = state?.battles?.filter(b => b.status === 'LIVE') || [];
  const users = state?.users || [];
  const myPendingReceivedChallenges = state?.challenges?.filter(c => c.receiverId === currentUser?.id && c.status === 'PENDING') || [];

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingVoteInfo, setPendingVoteInfo] = useState<{ battleId: string, playerId: string } | null>(null);
  
  const [sendChallengeModalOpen, setSendChallengeModalOpen] = useState(false);
  const [targetUniqueId, setTargetUniqueId] = useState('');
  const [challengeLoading, setChallengeLoading] = useState(false);

  const [adminEditBattle, setAdminEditBattle] = useState<any | null>(null);
  const [adminP1Votes, setAdminP1Votes] = useState('');
  const [adminP2Votes, setAdminP2Votes] = useState('');
  const [adminUpdating, setAdminUpdating] = useState(false);

  const handleAdminUpdateVotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEditBattle) return;
    setAdminUpdating(true);
    try {
      await userRequest('ADMIN_UPDATE_BATTLE_VOTES', {
        battleId: adminEditBattle.id,
        player1Votes: parseInt(adminP1Votes) || 0,
        player2Votes: parseInt(adminP2Votes) || 0
      });
      toast.success("Battle votes updated real-time live!");
      setAdminEditBattle(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to edit votes");
    } finally {
      setAdminUpdating(false);
    }
  };

  const [battleType, setBattleType] = useState<'quick' | 'grand'>('quick');
  const [stakeIdx, setStakeIdx] = useState(0);
  const [duration, setDuration] = useState('10 min');

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

  // Ensure we switch to a valid duration/stake when changing battle type
  useEffect(() => {
     if (battleType === 'quick' && state.platformStats?.enableQuickBattles === false) {
         setBattleType('grand');
     }
     if (battleType === 'grand' && state.platformStats?.enableGrandBattles === false) {
         setBattleType('quick');
     }
     if (battleType === 'quick' && !['10 min', '15 min', '20 min', '30 min'].includes(duration)) setDuration('10 min');
     if (battleType === 'grand' && !['3 days', '5 days', '1 week'].includes(duration)) setDuration('3 days');
     setStakeIdx(0);
  }, [battleType, duration, state.platformStats]);

  const [freeVotedBattles, setFreeVotedBattles] = useState<Set<string>>(() => {
     try {
        const stored = localStorage.getItem(`freeVotedBattles_${currentUser?.id || 'guest'}`);
        return new Set(stored ? JSON.parse(stored) : []);
     } catch {
        return new Set();
     }
  });

  // Re-load when current user changes (for guest vs logged-in state)
  useEffect(() => {
     try {
        const stored = localStorage.getItem(`freeVotedBattles_${currentUser?.id || 'guest'}`);
        setFreeVotedBattles(new Set(stored ? JSON.parse(stored) : []));
     } catch {
        setFreeVotedBattles(new Set());
     }
  }, [currentUser?.id]);

  const markFreeVote = (battleId: string) => {
     const next = new Set(freeVotedBattles).add(battleId);
     setFreeVotedBattles(next);
     localStorage.setItem(`freeVotedBattles_${currentUser?.id || 'guest'}`, JSON.stringify(Array.from(next)));
  };

  const handleVote = (battleId: string, playerId: string) => {
    if (!currentUser) {
       toast.error("Please log in to cast your vote!");
       return;
    }
    
    // Admin direct bypass: unlimited free voting with instantaneous feedback
    if (currentUser.is_admin) {
      vote(battleId, playerId, false);
      toast.success("Admin Vote Casted!", { id: "admin-vote" });
      return;
    }

    // Determine if it should be paid or free
    const hasVotedFree = freeVotedBattles.has(battleId);
    
    if (!hasVotedFree) {
      vote(battleId, playerId, false);
      markFreeVote(battleId);
      toast.success("Free Vote Casted!", { id: `vote-${battleId}` });
    } else {
      setPendingVoteInfo({ battleId, playerId });
      setPaymentModalOpen(true);
    }
  };

  const confirmPaidVote = () => {
    if (pendingVoteInfo) {
      vote(pendingVoteInfo.battleId, pendingVoteInfo.playerId, true);
      setPaymentModalOpen(false);
      setPendingVoteInfo(null);
    }
  };

  const handleSendChallenge = async () => {
    if (!targetUniqueId) return;
    setChallengeLoading(true);
    try {
      const durationMap: Record<string, number> = {
         '10 min': 10 * 60 * 1000,
         '15 min': 15 * 60 * 1000,
         '20 min': 20 * 60 * 1000,
         '30 min': 30 * 60 * 1000,
         '3 days': 3 * 24 * 60 * 60 * 1000,
         '5 days': 5 * 24 * 60 * 60 * 1000,
         '1 week': 7 * 24 * 60 * 60 * 1000
      };
      await sendChallenge(targetUniqueId, stakes[stakeIdx], battleType, durationMap[duration] || 10 * 60 * 1000);
      toast.success('Challenge request sent successfully!');
      setTargetUniqueId('');
      setSendChallengeModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChallengeLoading(false);
    }
  };

  const confirmAcceptChallenge = async (challengeId: string) => {
    if (!currentUser) return;
    setChallengeLoading(true);
    try {
      await startChallengeBattle(challengeId);
      toast.success('Challenge accepted!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChallengeLoading(false);
    }
  };

  const calculateWidth = (v1: number, v2: number, target: 1 | 2) => {
    const total = v1 + v2;
    if (total === 0) return '50%';
    const pct = target === 1 ? (v1 / total) * 100 : (v2 / total) * 100;
    return `${Math.max(5, Math.min(95, pct))}%`; 
  };
  
  const [battleResultModal, setBattleResultModal] = useState<{ battleId: string, wonAmount: number, isWinner: boolean } | null>(null);
  const seenBattlesRef = useRef<Set<string>>(new Set());
  const initialCompletedBattlesRef = useRef<{ userId: string; battleIds: Set<string> } | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const liveBattlesObservedRef = useRef<Set<string>>(new Set());

  // Helper to load/save notified battle result IDs specific to each user in localStorage
  const getSeenCompletedResults = (): Set<string> => {
     if (!currentUser) return new Set();
     try {
        const stored = localStorage.getItem(`seen_completed_battles_user_${currentUser.id}`);
        return new Set(stored ? JSON.parse(stored) : []);
     } catch {
        return new Set();
     }
  };

  const markCompletedResultSeen = (battleId: string) => {
     if (!currentUser) return;
     try {
        const seen = getSeenCompletedResults();
        seen.add(battleId);
        localStorage.setItem(`seen_completed_battles_user_${currentUser.id}`, JSON.stringify(Array.from(seen)));
     } catch (e) {
        console.error("Failed to save completed battle notifications cache:", e);
     }
  };
  
  useEffect(() => {
     if (!currentUser || !state?.battles) return;

     // 1. Log any battle we see in the LIVE status during this active session
     state.battles.forEach(b => {
        if (b.status === 'LIVE' && (b.player1Id === currentUser.id || b.player2Id === currentUser.id)) {
           liveBattlesObservedRef.current.add(b.id);
        }
     });

     // Initialize or change user set of already completed battles to prevent historical ones from popping up
     if (!initialCompletedBattlesRef.current || initialCompletedBattlesRef.current.userId !== currentUser.id) {
        const completed = state.battles
          .filter(b => b.status === 'COMPLETED')
          .map(b => b.id);
        initialCompletedBattlesRef.current = {
           userId: currentUser.id,
           battleIds: new Set(completed)
        };
     }

     const seenCaches = getSeenCompletedResults();
     const newlyFinished = state.battles.find(b => {
         if (b.status !== 'COMPLETED') return false;
         if (b.player1Id !== currentUser.id && b.player2Id !== currentUser.id) return false;
         if (seenCaches.has(b.id) || seenBattlesRef.current.has(b.id)) return false;

         // Strictly enforce real-time transition:
         // It must have been observed as LIVE during this page view session, or its calculated finish moment is recent,
         // and it must not have been already status-completed when the session mounted.
         const wasObservedLive = liveBattlesObservedRef.current.has(b.id);
         const wasAlreadyCompletedOnStart = initialCompletedBattlesRef.current?.battleIds.has(b.id);
         const isRecentTransition = (b.createdAt + b.durationMs) >= sessionStartTimeRef.current - 2000;

         if (wasAlreadyCompletedOnStart) {
            seenBattlesRef.current.add(b.id);
            markCompletedResultSeen(b.id);
            return false;
         }

         if (!wasObservedLive && !isRecentTransition) {
            seenBattlesRef.current.add(b.id);
            markCompletedResultSeen(b.id);
            return false;
         }
         return true;
     });
     
     if (newlyFinished) {
        seenBattlesRef.current.add(newlyFinished.id);
        markCompletedResultSeen(newlyFinished.id);

        const p1Votes = newlyFinished.player1Votes;
        const p2Votes = newlyFinished.player2Votes;
        
        let isWinner = false;
        let isLoser = false;

        if (p1Votes > p2Votes) {
           if (currentUser.id === newlyFinished.player1Id) isWinner = true;
           else if (currentUser.id === newlyFinished.player2Id) isLoser = true;
        } else if (p2Votes > p1Votes) {
           if (currentUser.id === newlyFinished.player2Id) isWinner = true;
           else if (currentUser.id === newlyFinished.player1Id) isLoser = true;
        }

        if (isWinner && newlyFinished.notified !== true) {
           const prize = (newlyFinished.pot || (newlyFinished.stake * 2)) - ((newlyFinished.pot || (newlyFinished.stake * 2)) * ((state.platformStats?.platformFeePercent || 15) / 100));
           setBattleResultModal({ battleId: newlyFinished.id, wonAmount: prize, isWinner: true });
        } else if (isLoser) {
           setBattleResultModal({ battleId: newlyFinished.id, wonAmount: 0, isWinner: false });
        }
     }
  }, [state.battles, currentUser, battleResultModal]);

  const closeBattleResultModal = async () => {
     if (!battleResultModal) return;
     const bid = battleResultModal.battleId;
     const wasWinner = battleResultModal.isWinner;
     markCompletedResultSeen(battleResultModal.battleId);
     setBattleResultModal(null);
     if (true) {
         try {
           await userRequest('MARK_BATTLE_NOTIFIED', { battleId: bid });
         } catch(e) {
           console.error("Failed to mark notified", e);
         }
     }
  };
  const handleShare = (battleId: string) => {
     const text = `Vote on my Votex Battle! Check it out here:`;
     const url = `${window.location.origin}?battle=${battleId}`;
     if (navigator.share) {
         navigator.share({
             title: 'Votex Battle',
             text,
             url
         }).then(() => {
             toast.success("Battle link shared successfully!");
         }).catch((err) => {
             console.log("Native share cancelled or blocked:", err);
             navigator.clipboard.writeText(`${text} ${url}`).then(() => {
                 toast.success("Battle link copied to clipboard!");
             }).catch(() => {
                 toast.success(`Share link: ${url}`);
             });
         });
     } else {
         navigator.clipboard.writeText(`${text} ${url}`).then(() => {
             toast.success("Battle link copied to clipboard!");
         }).catch((err) => {
             console.log("Clipboard write blocked:", err);
             toast.success(`Share link: ${url}`);
         });
     }
  };

  const getAvatarInfo = (userId: string, isPlayer1: boolean) => {
     const user = users.find(u => u.id === userId);
     let username = user?.username || 'Unknown';
     let icon: React.ReactNode = isPlayer1 ? <Zap className="h-5 w-5" /> : <span className="text-xl">💎</span>;
     
     if (user?.username) {
        const parts = user.username.trim().split(' ');
        if (parts.length > 1 && parts[0].length <= 3 && /\p{Emoji}/u.test(parts[0])) {
           icon = <span className="text-xl">{parts[0]}</span>;
           username = parts.slice(1).join(' ').trim() || 'User';
        } else {
           const firstChar = Array.from(user.username.trim())[0] as string;
           icon = <span className="text-xl font-bold">{firstChar ? firstChar.toUpperCase() : 'U'}</span>;
        }
     }

     return {
        username,
        icon,
        color: isPlayer1 ? 'bg-emerald-500' : 'bg-yellow-400'
     };
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-[#10B981] rounded-3xl p-6 text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Zap className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-bold tracking-wider uppercase mb-1">Welcome to</p>
          <h2 className="text-4xl font-black mb-2 tracking-widest font-sans flex items-center text-black">
            VOTEX
          </h2>
          <p className="text-sm font-medium mb-6">Challenge anyone. Win VTX Coins.</p>
          
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl mb-4 text-white">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <Swords className="w-4 h-4 text-white" /> Direct Challenge
               </h3>
               <button 
                  onClick={() => setSendChallengeModalOpen(true)}
                  className="bg-white text-black font-bold px-4 py-2 rounded-xl transition-colors active:scale-95 text-xs"
               >
                  New Challenge
               </button>
            </div>
            <p className="text-xs text-gray-400">Challenge a friend to a battle</p>
          </div>
        </div>
      </div>
      
      {myPendingReceivedChallenges.length > 0 && (
         <div className="fixed top-20 left-4 right-4 z-[60] space-y-3 animate-in fade-in slide-in-from-top-5 duration-500">
            {myPendingReceivedChallenges.map(c => {
               const sender = users.find(u => u.id === c.senderId);
               return (
                  <div key={c.id} className="bg-black/60 backdrop-blur-xl border border-[#10B981]/50 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-[0_10px_40px_rgba(16,185,129,0.3)] relative overflow-hidden">
                     {/* Animated background glow */}
                     <div className="absolute inset-0 bg-gradient-to-r from-[#10B981]/10 to-transparent animate-pulse pointer-events-none"></div>
                     <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-[#10B981]/30 rounded-full blur-2xl pointer-events-none"></div>
                     
                     <div className="flex items-center gap-4 relative z-10 w-full">
                         {/* Avatar */}
                         <div className="relative shrink-0">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white ring-2 ring-white/20 shadow-[0_0_15px_#34d399]">
                               <Zap className="w-6 h-6" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                               <span className="text-[8px] text-white select-none">!</span>
                            </div>
                         </div>
                         
                         {/* Details */}
                         <div className="flex-1">
                            <p className="font-bold text-white text-base leading-tight">
                               {sender?.username || 'Challenger'}
                            </p>
                            <p className="text-xs text-gray-300 mt-0.5 leading-snug">
                               Challenged you for <span className="text-yellow-400 font-bold ml-1">{c.stake} VTX</span>
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-1">
                               {c.durationMs / 60000}m {c.type === 'quick' ? 'Quick Match' : 'Grand Match'}
                            </p>
                         </div>
                         
                         {/* Actions */}
                         <div className="flex flex-col gap-2 shrink-0">
                            <button 
                               onClick={() => confirmAcceptChallenge(c.id)}
                               disabled={challengeLoading}
                               className="h-9 px-4 rounded-full flex items-center justify-center bg-[#10B981] text-black font-black text-sm hover:bg-emerald-400 transition-transform active:scale-95 disabled:opacity-50 shadow-[0_0_10px_#10B981]"
                            >
                               {challengeLoading ? '...' : 'ACCEPT'}
                            </button>
                            <button 
                               onClick={() => updateChallenge(c.id, 'REJECTED')}
                               disabled={challengeLoading}
                               className="h-7 px-4 rounded-full flex items-center justify-center bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-transform active:scale-95 disabled:opacity-50"
                            >
                               Reject
                            </button>
                         </div>
                     </div>
                  </div>
               );
            })}
         </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
           <TrendingUp className="h-5 w-5 text-[#F43F5E]" />
          <h3 className="text-lg font-bold tracking-wide">LIVE BATTLES</h3>
          <span className="text-gray-500 text-sm">({battles.length})</span>
        </div>

        <div className="space-y-6">
          {battles.map((battle) => {
             const p1Info = getAvatarInfo(battle.player1Id, true);
             const p2Info = getAvatarInfo(battle.player2Id, false);
             
             return (
            <div key={battle.id} className="bg-black border-y border-gray-800 -mx-4 p-6 sm:mx-0 sm:rounded-3xl sm:border flex flex-col justify-between min-h-[450px] relative overflow-hidden group/battle snap-start animate-in fade-in zoom-in duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-[#131823]/50 to-black pointer-events-none"></div>
              
              {/* Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-white bg-[#F43F5E] px-3 py-1 rounded-full flex items-center gap-1.5 w-max shadow-[0_0_15px_#F43F5E]">
                     <div className="w-2 h-2 rounded-full bg-white animate-ping"></div> LIVE
                  </span>
                  <span className="text-[11px] font-mono font-bold text-gray-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-gray-700/50 w-max">
                    <Clock className="w-3.5 h-3.5" />
                    <CountdownTimer expireAt={battle.createdAt + battle.durationMs} />
                  </span>
                </div>
                <div className="flex flex-col gap-2 relative z-10 items-end">
                  {currentUser?.is_admin && (
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setAdminEditBattle(battle);
                         setAdminP1Votes(battle.player1Votes.toString());
                         setAdminP2Votes(battle.player2Votes.toString());
                       }}
                       className="bg-yellow-400 text-black px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.4)] mr-2"
                    >
                       <Sliders className="w-3.5 h-3.5" />
                       Quick Edit Votes
                    </button>
                  )}
                  <button 
                     onClick={() => handleShare(battle.id)}
                     className="bg-[#1A1F2E]/80 backdrop-blur-md border border-gray-700/50 text-gray-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                     <Share2 className="w-3.5 h-3.5" />
                     Share
                  </button>
                  <div className="bg-black/60 backdrop-blur-md border border-[#10B981]/30 text-[#10B981] px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    Pot {battle.pot} VTX
                  </div>
                </div>
              </div>
              
              {/* Fighters Center */}
              <div className="flex items-center justify-between mt-auto mb-10 relative z-10 px-2 lg:px-10">
                {/* Player 1 */}
                <div 
                   onClick={() => handleVote(battle.id, battle.player1Id)}
                   className="flex flex-col items-center gap-3 w-[40%] cursor-pointer active:scale-90 transition-transform group"
                >
                  <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white ${p1Info.color} ring-4 ring-white/10 group-hover:ring-[#10B981] ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_#10B981] transition-all`}>
                    {p1Info.icon}
                  </div>
                  <div className="text-center w-full">
                    <p className="font-black text-base sm:text-xl truncate w-full text-white drop-shadow-md">{p1Info.username}</p>
                    <p className="text-sm sm:text-base text-[#10B981] font-mono font-bold transition-all duration-300 mb-2 drop-shadow-md">
                       {battle.player1Votes.toLocaleString()} Votes
                    </p>
                    <button className="w-full bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] text-xs uppercase font-black py-2 rounded-full group-hover:bg-[#10B981] group-hover:text-black transition-colors">
                       Vote
                    </button>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                   <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#F43F5E] rounded-full flex items-center justify-center text-white font-black italic text-sm sm:text-xl shadow-[0_0_20px_#F43F5E] z-20">VS</div>
                </div>

                {/* Player 2 */}
                <div 
                   onClick={() => handleVote(battle.id, battle.player2Id)}
                   className="flex flex-col items-center gap-3 w-[40%] cursor-pointer active:scale-90 transition-transform group"
                >
                  <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white ${p2Info.color} ring-4 ring-white/10 group-hover:ring-yellow-400 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all`}>
                    {p2Info.icon}
                  </div>
                  <div className="text-center w-full">
                    <p className="font-black text-base sm:text-xl truncate w-full text-white drop-shadow-md">{p2Info.username}</p>
                    <p className="text-sm sm:text-base text-yellow-400 font-mono font-bold transition-all duration-300 mb-2 drop-shadow-md">
                       {battle.player2Votes.toLocaleString()} Votes
                    </p>
                    <button className="w-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 text-xs uppercase font-black py-2 rounded-full group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                       Vote
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar Bottom */}
              <div className="relative z-10 w-full mt-auto">
                 <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-400 font-bold mb-2 uppercase tracking-wide px-2">
                    <span className="text-[#10B981] drop-shadow-md">{(battle.player1Votes / (battle.player1Votes + battle.player2Votes + 0.001) * 100).toFixed(0)}%</span>
                    <span className="text-white bg-white/10 px-2 py-0.5 rounded-full">Score</span>
                    <span className="text-yellow-400 drop-shadow-md">{(battle.player2Votes / (battle.player1Votes + battle.player2Votes + 0.001) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="flex h-3 sm:h-4 rounded-full overflow-hidden bg-gray-900 border border-gray-800 relative shadow-inner w-full hover:h-6 transition-all duration-300">
                   <div 
                      className="bg-gradient-to-r from-teal-500 to-[#10B981] transition-all duration-500 ease-out flex items-center justify-start px-2 overflow-hidden" 
                      style={{ width: calculateWidth(battle.player1Votes, battle.player2Votes, 1) }}
                   >
                   </div>
                   <div className="w-1 h-full bg-black skew-x-12 absolute left-1/2 -translate-x-1/2 z-20 hidden"></div>
                   <div 
                      className="bg-gradient-to-l from-orange-400 to-yellow-400 transition-all duration-500 ease-out flex items-center justify-end px-2 overflow-hidden" 
                      style={{ width: calculateWidth(battle.player1Votes, battle.player2Votes, 2) }}
                   >
                   </div>
                 </div>
              </div>

              {/* Tax Banner */}
              <div className="relative z-10 mt-4 pt-3 border-t border-gray-800/60 text-center">
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1F2E]/45 border border-gray-800/60 rounded-full text-[11px] font-semibold tracking-wider text-gray-400">
                    <Info className="w-3.5 h-3.5 text-[#F43F5E] shrink-0" />
                    20% tax API & fixed cost
                 </span>
              </div>
            </div>
          )})}
          
          {battles.length === 0 && (
             <div className="text-center py-10 opacity-50">
               <Zap className="w-10 h-10 mx-auto mb-2 text-gray-500" />
               <p>No live battles. Start one!</p>
             </div>
          )}
        </div>
      </div>

      {/* Help Center Section */}
      <div className="mt-8 mb-4 border-t border-gray-800/50 pt-8 opacity-80 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-2 mb-3">
            <LifeBuoy className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold tracking-wide text-gray-300">Help Center</h3>
         </div>
         <div className="bg-[#131823]/50 border border-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3">Facing an issue? Submit a ticket to the admin team.</p>
            <textarea 
               id="support-ticket-input"
               placeholder="Describe your issue here..."
               className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 min-h-[60px] mb-2"
            ></textarea>
            <button 
               onClick={() => {
                  const input = document.getElementById('support-ticket-input') as HTMLTextAreaElement;
                  if (input && input.value.trim().length > 0) {
                     userRequest('SUBMIT_SUPPORT_TICKET', { message: input.value.trim() });
                     input.value = '';
                     toast.success("Ticket submitted");
                  } else {
                     toast.error("Please enter a valid message.");
                  }
               }}
               className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold py-2 rounded-lg text-xs transition-colors shrink-0"
            >
               Submit Ticket
            </button>
         </div>
      </div>

      {paymentModalOpen && pendingVoteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#131823] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
              <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-400/30">
                 <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </div>
              <h3 className="text-white font-bold text-xl text-center mb-2">Buy Extra Vote</h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                 Your free vote for this match is used. Would you like to buy another vote for <strong className="text-white">10 VTX</strong> from your wallet?
                 <br/><br/>
                 Current Balance: <span className="text-yellow-400 font-bold">{currentUser?.balance} VTX</span>
              </p>
              
              <div className="space-y-3">
                 <button 
                    onClick={confirmPaidVote}
                    className="w-full bg-[#10B981] hover:bg-[#0ea5e9] text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                 >
                    Pay 10 VTX & Vote
                 </button>
                 <button 
                    onClick={() => setPaymentModalOpen(false)}
                    className="w-full bg-[#1A1F2E] hover:bg-[#252B3B] text-white font-bold py-3.5 px-4 rounded-xl transition-colors border border-gray-800"
                 >
                    Cancel
                 </button>
              </div>
           </div>
        </div>
      )}

      {adminEditBattle && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#131823] border border-yellow-500/40 rounded-[30px] p-6 w-full max-w-sm shadow-[0_0_30px_rgba(234,179,8,0.25)] relative text-left">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-yellow-500 font-bold text-lg flex items-center gap-2">
                   <Sliders className="w-5 h-5 block" />
                   Admin: Edit Live Votes
                 </h3>
                 <button 
                    type="button"
                    onClick={() => setAdminEditBattle(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                 >
                    <X className="w-5 h-5 block" />
                 </button>
               </div>
               
               <form onSubmit={handleAdminUpdateVotes} className="space-y-4">
                 <div className="p-3 bg-black/30 rounded-xl mb-2 border border-gray-800">
                   <p className="text-xs text-gray-400 font-mono">Battle ID:</p>
                   <p className="text-xs text-gray-300 font-mono font-bold truncate">{adminEditBattle.id}</p>
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                     Player 1 Votes ({getAvatarInfo(adminEditBattle.player1Id, true).username})
                   </label>
                   <input 
                     type="number"
                     required
                     min="0"
                     value={adminP1Votes}
                     onChange={(e) => setAdminP1Votes(e.target.value)}
                     className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white font-bold font-mono focus:border-yellow-500 focus:outline-none"
                   />
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[#F43F5E] uppercase tracking-wider block">
                     Player 2 Votes ({getAvatarInfo(adminEditBattle.player2Id, false).username})
                   </label>
                   <input 
                     type="number"
                     required
                     min="0"
                     value={adminP2Votes}
                     onChange={(e) => setAdminP2Votes(e.target.value)}
                     className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white font-bold font-mono focus:border-yellow-500 focus:outline-none"
                   />
                 </div>
                 
                 <div className="space-y-2 pt-4">
                    <button 
                       type="submit"
                       disabled={adminUpdating}
                       className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                    >
                       {adminUpdating ? 'Updating Live...' : 'Submit Live Real-Time'}
                    </button>
                    <button 
                       type="button"
                       onClick={() => setAdminEditBattle(null)}
                       className="w-full bg-[#1A1F2E] hover:bg-[#252B3B] text-white font-bold py-3 px-6 rounded-2xl transition-all border border-gray-800"
                    >
                       Cancel
                    </button>
                 </div>
               </form>
            </div>
         </div>
      )}

      {sendChallengeModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#131823] border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
               <h3 className="text-white font-bold text-xl mb-4">Send Challenge Request</h3>
               
               <div className="space-y-4 mb-6">
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Opponent Unique ID</label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search className="h-4 w-4 text-gray-400" />
                       </div>
                       <input 
                         type="text" 
                         value={targetUniqueId}
                         onChange={(e) => setTargetUniqueId(e.target.value)}
                         className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                         placeholder="e.g. 524183"
                       />
                     </div>
                     {targetUniqueId.length >= 2 && !users.find(u => u.uniqueId === targetUniqueId) && (
                        <div className="mt-2 bg-[#1A1F2E] border border-gray-800 rounded-xl max-h-36 overflow-y-auto">
                           {users.filter(u => u.uniqueId.includes(targetUniqueId)).length > 0 ? (
                              users.filter(u => u.uniqueId.includes(targetUniqueId)).map(u => (
                                 <div 
                                    key={u.id}
                                    onClick={() => setTargetUniqueId(u.uniqueId)}
                                    className="px-4 py-3 hover:bg-[#252B3B] cursor-pointer flex justify-between items-center border-b border-gray-800/50 last:border-0 transition-colors"
                                 >
                                    <span className="text-white font-bold text-sm w-full truncate">
                                       {u.username}
                                       {u.id === currentUser?.id && <span className="text-blue-400 text-xs ml-2">(You)</span>}
                                    </span>
                                    <span className="text-gray-400 font-mono text-xs ml-2 bg-black/40 px-2 py-1 rounded">#{u.uniqueId}</span>
                                 </div>
                              ))
                           ) : (
                              <div className="px-4 py-4 text-gray-500 text-sm text-center">No matches found</div>
                           )}
                        </div>
                     )}
                     {users.find(u => u.uniqueId === targetUniqueId && u.id !== currentUser?.id) && (
                        <div className="mt-2 text-sm pl-1 animate-in fade-in">
                           <span className="text-[#10B981] font-bold flex items-center gap-1">
                              <Check className="w-4 h-4" /> Selected: {users.find(u => u.uniqueId === targetUniqueId)?.username}
                           </span>
                        </div>
                     )}
                     {users.find(u => u.uniqueId === targetUniqueId && u.id === currentUser?.id) && (
                        <div className="mt-2 text-sm pl-1 animate-in fade-in">
                           <span className="text-[#10B981] font-bold flex items-center gap-1">
                              <Check className="w-4 h-4" /> Selected: {users.find(u => u.uniqueId === targetUniqueId)?.username} (You)
                           </span>
                           <p className="text-red-500 font-bold mt-1 text-xs px-1">You cannot challenge yourself.</p>
                        </div>
                     )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     {state.platformStats?.enableQuickBattles !== false && (
                       <button onClick={() => setBattleType('quick')} className={`py-3 rounded-xl font-bold flex flex-col items-center gap-1 border-2 transition-all ${battleType === 'quick' ? 'bg-[#252B3B] border-[#10B981] text-[#10B981]' : 'border-gray-800 bg-[#1A1F2E] text-gray-400 hover:border-gray-700'}`}>
                          <Zap className="w-5 h-5" />
                          <span className="text-xs">Quick Match</span>
                       </button>
                     )}
                     {state.platformStats?.enableGrandBattles !== false && (
                       <button onClick={() => setBattleType('grand')} className={`py-3 rounded-xl font-bold flex flex-col items-center gap-1 border-2 transition-all ${battleType === 'grand' ? 'bg-[#252B3B] border-[#F43F5E] text-[#F43F5E]' : 'border-gray-800 bg-[#1A1F2E] text-gray-400 hover:border-gray-700'}`}>
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-xs">Grand Match</span>
                       </button>
                     )}
                  </div>
                  
                  <div className="space-y-2 justify-between">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stake Amount (VTX)</label>
                     <div className="grid grid-cols-4 gap-2">
                        {stakes.map((s, idx) => (
                           <button key={idx} onClick={() => setStakeIdx(idx)} className={`py-2 text-[10px] font-bold rounded-lg border transition-colors ${stakeIdx === idx ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-[#1A1F2E] border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                              {s}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2 justify-between">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</label>
                     <div className="grid grid-cols-4 gap-2">
                        {durations.map(t => (
                           <button key={t} onClick={() => setDuration(t)} className={`py-2 px-1 text-[10px] whitespace-nowrap font-bold rounded-lg border transition-colors ${duration === t ? 'bg-[#10B981] text-black border-[#10B981]' : 'bg-[#1A1F2E] border-gray-800 text-gray-400 hover:border-gray-700'}`}>
                              {t}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="space-y-3 mt-6">
                  <button 
                     onClick={handleSendChallenge}
                     disabled={challengeLoading || !users.find(u => u.uniqueId === targetUniqueId && u.id !== currentUser?.id)}
                     className="w-full bg-[#10B981] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                     {challengeLoading ? 'Sending...' : 'Send Challenge'}
                  </button>
                  <button 
                     onClick={() => setSendChallengeModalOpen(false)}
                     disabled={challengeLoading}
                     className="w-full bg-[#1A1F2E] disabled:opacity-50 hover:bg-[#252B3B] text-white font-bold py-3.5 px-4 rounded-xl transition-colors border border-gray-800"
                  >
                     Cancel
                  </button>
               </div>
            </div>
         </div>
      )}

      {battleResultModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500">
            {battleResultModal.isWinner ? (
               <>
                  {/* Confetti / Firework effects using CSS animations */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                     <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce delay-100 shadow-[0_0_20px_#facc15]"></div>
                     <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-rose-400 rounded-full animate-ping delay-300 shadow-[0_0_15px_#fb7185]"></div>
                     <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-emerald-400 rounded-full animate-bounce delay-200 shadow-[0_0_20px_#34d399]"></div>
                     <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-500 shadow-[0_0_10px_#60a5fa]"></div>
                  </div>

                  <div className="bg-[#131823] border border-[#10B981]/50 rounded-[30px] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(16,185,129,0.3)] relative text-center overflow-hidden">
                     <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#10B981]/20 rounded-full blur-3xl"></div>
                     
                     <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(250,204,21,0.5)] border-4 border-[#131823] relative z-10">
                        <Trophy className="w-12 h-12 text-black fill-black" />
                     </div>
                     
                     <h2 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10 animate-in slide-in-from-bottom-5">
                        Congratulations!
                     </h2>
                     <p className="text-[#10B981] font-bold text-xl mb-6 relative z-10 animate-in slide-in-from-bottom-6 delay-100">
                        {currentUser?.username}, you won the battle! 🥳🎆
                     </p>
                     
                     <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 mb-8 relative z-10 animate-in zoom-in delay-200">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">You earned</p>
                        <p className="text-4xl font-black text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                           {battleResultModal.wonAmount} VTX
                        </p>
                        <p className="text-emerald-400 text-[10px] mt-2">Added to your total balance!</p>
                     </div>
                     
                     <button 
                        onClick={closeBattleResultModal}
                        className="w-full bg-[#10B981] hover:bg-emerald-400 text-black font-black py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] relative z-10"
                     >
                        Awesome!
                     </button>
                  </div>
               </>
            ) : (
               <div className="bg-[#131823] border border-red-500/50 rounded-[30px] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(239,68,68,0.3)] relative text-center overflow-hidden">
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 rounded-full blur-3xl"></div>
                     
                  <div className="w-24 h-24 bg-[#1A1F2E] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-gray-800 relative z-10">
                     <span className="text-5xl opacity-80">💀</span>
                  </div>
                     
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10 animate-in slide-in-from-bottom-5">
                     You Lost!
                  </h2>
                  <p className="text-gray-400 font-bold text-lg mb-6 relative z-10 animate-in slide-in-from-bottom-6 delay-100">
                     Better luck next time, {currentUser?.username}. 😔
                  </p>
                     
                  <button 
                     onClick={closeBattleResultModal}
                     className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-4 px-6 rounded-2xl transition-all active:scale-95 relative z-10"
                  >
                     Close
                  </button>
               </div>
            )}
         </div>
      )}
    </div>
  );
}
