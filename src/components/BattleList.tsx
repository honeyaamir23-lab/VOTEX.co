import { useState } from "react";
import { Battle, UserProfile } from "../types";
import { Vote, Target, Zap, Trophy, Timer, Flame, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BattleListProps {
  battles: Battle[];
  profile: UserProfile | null;
  isLoading: boolean;
  onVoteClick: (battle: Battle, contestant: 'A' | 'B') => void;
}

export default function BattleList({
  battles,
  profile,
  isLoading,
  onVoteClick
}: BattleListProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | "quick" | "grand">("all");

  const filteredBattles = battles.filter((b) => {
    if (activeCategory === "all") return true;
    return b.type === activeCategory;
  });

  const getVoteState = (battleId: string) => {
    if (!profile) return { hasVotedFree: false, votedFor: null };
    const vote = profile.votedBattles[battleId];
    return {
      hasVotedFree: !!vote?.hasVotedFree,
      votedFor: vote?.votedFor || null
    };
  };

  const calculatePercentages = (votesA: number, votesB: number) => {
    const total = votesA + votesB;
    if (total === 0) return { pctA: 50, pctB: 50 };
    const pctA = Math.round((votesA / total) * 100);
    const pctB = 100 - pctA;
    return { pctA, pctB };
  };

  // Modern Skeleton cards for lag-free visual optimization
  if (isLoading) {
    return (
      <div className="space-y-12">
        {/* Category Controls Skeleton */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-24 h-10 bg-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-80 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="w-16 h-3.5 bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-48 h-6 bg-slate-800 rounded-lg animate-pulse"></div>
                </div>
                <div className="w-20 h-6 bg-slate-800 rounded-full animate-pulse"></div>
              </div>

              {/* Contestants mockup */}
              <div className="grid grid-cols-11 gap-4 items-center">
                <div className="col-span-5 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-slate-800 rounded-full animate-pulse"></div>
                  <div className="w-20 h-4 bg-slate-800 rounded animate-pulse"></div>
                </div>
                <div className="col-span-1 text-center font-mono text-slate-700 font-bold">VS</div>
                <div className="col-span-5 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-slate-800 rounded-full animate-pulse text-right"></div>
                  <div className="w-20 h-4 bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Progress bars mockup */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-800 rounded-full animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="w-10 h-3 bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-10 h-3 bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const quickBattles = filteredBattles.filter((b) => b.type === "quick");
  const grandBattles = filteredBattles.filter((b) => b.type === "grand");

  return (
    <div className="space-y-12">
      
      {/* Category Toggles bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-500 animate-pulse" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
            Live Tournament Arenas
          </h2>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(["all", "quick", "grand"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat === "all" ? "🔥 All Arenas" : cat === "quick" ? "⚡ Quick Battles" : "🏆 Grand Tournaments"}
            </button>
          ))}
        </div>
      </div>

      {filteredBattles.length === 0 && (
        <div className="text-center py-12 p-8 bg-slate-900/20 rounded-3xl border border-slate-800">
          <p className="text-slate-400 font-mono text-sm">NO ACTIVE BATTLES REGISTERED FOR THIS FILTER</p>
          <p className="text-xs text-slate-500 mt-1">Please select another arena tab above to resume tracking.</p>
        </div>
      )}

      {/* Render Lists Container */}
      <div className="space-y-16">
        
        {/* Arena 1: Quick Battles */}
        {quickBattles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
                  Quick Meme Arenas 
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 font-bold uppercase font-mono tracking-wider">Fast-paced</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">High volatility, passionate communities, short voting countdowns.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {quickBattles.map((battle) => (
                <BattleCard
                  key={battle.id}
                  battle={battle}
                  voteState={getVoteState(battle.id)}
                  onVoteClick={onVoteClick}
                  calculatePercentages={calculatePercentages}
                />
              ))}
            </div>
          </section>
        )}

        {/* Arena 2: Grand Battles */}
        {grandBattles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 pt-4">
              <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-amber-400">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
                  Grand Tournament Championships 
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold uppercase font-mono tracking-wider">High Stakes</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Established bluechip networks, heavy structural support, huge voting pools.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {grandBattles.map((battle) => (
                <BattleCard
                  key={battle.id}
                  battle={battle}
                  voteState={getVoteState(battle.id)}
                  onVoteClick={onVoteClick}
                  calculatePercentages={calculatePercentages}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

interface BattleCardProps {
  key?: string;
  battle: Battle;
  voteState: { hasVotedFree: boolean; votedFor: 'A' | 'B' | null };
  onVoteClick: (battle: Battle, contestant: 'A' | 'B') => void;
  calculatePercentages: (v1: number, v2: number) => { pctA: number; pctB: number };
}

// Single Battle Card SubComponent
function BattleCard({
  battle,
  voteState,
  onVoteClick,
  calculatePercentages
}: BattleCardProps) {
  const { pctA, pctB } = calculatePercentages(battle.contestantA.votes, battle.contestantB.votes);
  const leadingContestant = battle.contestantA.votes > battle.contestantB.votes ? 'A' : battle.contestantB.votes > battle.contestantA.votes ? 'B' : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-slate-950/80 border rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-300 ${
        leadingContestant === 'A'
          ? "border-amber-500/10 hover:border-amber-500/35 hover:shadow-amber-500/5 bg-gradient-to-br from-slate-950 via-slate-950 to-amber-500/[0.015]"
          : leadingContestant === 'B'
          ? "border-purple-500/10 hover:border-purple-500/35 hover:shadow-purple-500/5 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-500/[0.015]"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Category Indicator Tag */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          {battle.category}
        </span>
        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 font-mono">
          <Timer className="w-3.5 h-3.5 text-slate-500" />
          <span>Timer ticking</span>
        </div>
      </div>

      <h4 className="text-base sm:text-lg font-extrabold text-white tracking-tight mb-6">
        {battle.title}
      </h4>

      {/* Main Vs Grid */}
      <div className="grid grid-cols-11 gap-2 items-center mb-6">
        {/* Contestant A Panel */}
        <div className="col-span-5 flex flex-col items-center text-center">
          <div className="relative">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border flex items-center justify-center p-2 relative overflow-hidden transition-transform group-hover:scale-102 ${
              leadingContestant === 'A' ? "border-amber-500 shadow-lg shadow-amber-500/20" : "border-slate-800/80"
            }`}>
              <img
                src={battle.contestantA.logoUrl}
                alt={battle.contestantA.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {leadingContestant === 'A' && (
                <div className="absolute -top-1 -left-1 bg-amber-500 text-[8px] font-extrabold text-slate-950 px-1 py-0.2 rounded-br">
                  WIN
                </div>
              )}
            </div>
          </div>
          <span className="font-extrabold text-white text-sm sm:text-base mt-3 leading-tight block">
            {battle.contestantA.name}
          </span>
          <span className="text-[11px] font-extrabold text-amber-500/90 font-mono mt-0.5">
            ${battle.contestantA.symbol}
          </span>
          
          <div className="text-xl sm:text-2xl font-extrabold text-white mt-2 font-mono tracking-tight leading-none">
            {battle.contestantA.votes.toLocaleString()}
            <span className="block text-[9px] text-slate-500 font-mono font-medium tracking-wide mt-1 uppercase">VOTES ACCUMULATED</span>
          </div>
        </div>

        {/* Center VS Visual */}
        <div className="col-span-1 text-center flex flex-col items-center justify-center">
          <div className="w-[1px] h-10 bg-slate-800"></div>
          <div className="my-2.5 font-bold font-mono text-xs text-slate-600 tracking-widest uppercase">VS</div>
          <div className="w-[1px] h-10 bg-slate-800"></div>
        </div>

        {/* Contestant B Panel */}
        <div className="col-span-5 flex flex-col items-center text-center">
          <div className="relative">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border flex items-center justify-center p-2 relative overflow-hidden transition-transform group-hover:scale-102 ${
              leadingContestant === 'B' ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-slate-800/80"
            }`}>
              <img
                src={battle.contestantB.logoUrl}
                alt={battle.contestantB.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {leadingContestant === 'B' && (
                <div className="absolute -top-1 -left-1 bg-purple-500 text-[8px] font-extrabold text-white px-1 py-0.2 rounded-br">
                  WIN
                </div>
              )}
            </div>
          </div>
          <span className="font-extrabold text-white text-sm sm:text-base mt-3 leading-tight block">
            {battle.contestantB.name}
          </span>
          <span className="text-[11px] font-extrabold text-purple-400 font-mono mt-0.5">
            ${battle.contestantB.symbol}
          </span>

          <div className="text-xl sm:text-2xl font-extrabold text-white mt-2 font-mono tracking-tight leading-none">
            {battle.contestantB.votes.toLocaleString()}
            <span className="block text-[9px] text-slate-500 font-mono font-medium tracking-wide mt-1 uppercase">VOTES ACCUMULATED</span>
          </div>
        </div>
      </div>

      {/* Beautiful Progress Percentage Bars (In style of Facebook Polling) */}
      <div className="space-y-2 mb-6">
        <div className="relative h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
          {/* Contestant A fill */}
          <motion.div
            initial={{ width: "50%" }}
            animate={{ width: `${pctA}%` }}
            transition={{ type: "spring", stiffness: 60 }}
            className="absolute left-0.5 top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-inner z-10"
          />
          {/* Contestant B fill */}
          <motion.div
            initial={{ width: "50%" }}
            animate={{ width: `${pctB}%` }}
            transition={{ type: "spring", stiffness: 60 }}
            className="absolute right-0.5 top-0.5 bottom-0.5 rounded-full bg-gradient-to-l from-purple-600 to-purple-400 shadow-inner"
          />
        </div>

        {/* Live Percent Metrics */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold font-mono text-white">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span>{pctA}%</span>
            {voteState.votedFor === 'A' && <span className="text-[9px] bg-amber-500/10 px-1.5 py-0.2 border border-amber-500/20 text-amber-500 rounded font-bold font-sans">MY CHOICE</span>}
          </div>
          <span className="text-[10px] text-slate-500 font-medium font-mono uppercase tracking-wide">
            {(battle.contestantA.votes + battle.contestantB.votes).toLocaleString()} TOTAL CASTS
          </span>
          <div className="flex items-center gap-1.5 text-purple-400">
            {voteState.votedFor === 'B' && <span className="text-[9px] bg-purple-500/10 px-1.5 py-0.2 border border-purple-500/20 text-purple-400 rounded font-bold font-sans">MY CHOICE</span>}
            <span>{pctB}%</span>
          </div>
        </div>
      </div>

      {/* Structured Vote Trigger Actions */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 border-t border-slate-900 pt-5">
        {/* Vote A Button */}
        <button
          onClick={() => onVoteClick(battle, 'A')}
          className={`py-3 px-3 rounded-2xl font-extrabold text-xs sm:text-sm tracking-wide active:scale-97 transition-all flex flex-col items-center justify-center gap-1 ${
            voteState.hasVotedFree
              ? "bg-amber-500/5 hover:bg-amber-500/12 text-amber-300 border border-amber-500/20 shadow-md shadow-amber-500/2"
              : "bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700/80"
          }`}
        >
          <span className="flex items-center gap-1 font-bold text-white uppercase text-[10px] tracking-wide font-sans">
            <Zap className={`w-3.5 h-3.5 ${voteState.hasVotedFree ? "text-amber-500" : "text-slate-400"}`} /> 
            Vote ${battle.contestantA.symbol}
          </span>
          
          <span className={`text-[9px] font-extrabold font-mono ${voteState.hasVotedFree ? "text-amber-500" : "text-slate-500"}`}>
            {voteState.hasVotedFree ? "💎 PREMIUM VOTE (5 COINS)" : "⚡ CAST FREE VOTE"}
          </span>
        </button>

        {/* Vote B Button */}
        <button
          onClick={() => onVoteClick(battle, 'B')}
          className={`py-3 px-3 rounded-2xl font-extrabold text-xs sm:text-sm tracking-wide active:scale-97 transition-all flex flex-col items-center justify-center gap-1 ${
            voteState.hasVotedFree
              ? "bg-purple-500/5 hover:bg-purple-500/12 text-purple-300 border border-purple-500/20 shadow-md shadow-purple-500/2"
              : "bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-700/80"
          }`}
        >
          <span className="flex items-center gap-1 font-bold text-white uppercase text-[10px] tracking-wide font-sans">
            <Zap className={`w-3.5 h-3.5 ${voteState.hasVotedFree ? "text-purple-400" : "text-slate-400"}`} /> 
            Vote ${battle.contestantB.symbol}
          </span>
          
          <span className={`text-[9px] font-extrabold font-mono ${voteState.hasVotedFree ? "text-purple-400" : "text-slate-500"}`}>
            {voteState.hasVotedFree ? "💎 PREMIUM VOTE (5 COINS)" : "⚡ CAST FREE VOTE"}
          </span>
        </button>
      </div>

    </motion.div>
  );
}
