import { useState } from "react";
import {
  Users,
  Activity,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Settings,
  Database,
  Server,
  Check,
  X,
  ImageIcon,
  Swords,
  LifeBuoy,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useGame } from "../context/GameContext";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const tabs = [
    "Stats",
    "Deposits",
    "Withdrawals",
    "Battles",
    "Users",
    "Support",
    "Settings",
  ];
  const [activeTab, setActiveTab] = useState("Stats");
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const { state, adminAction, currentUser } = useGame();

  if (!currentUser || currentUser.email !== "honeyaamir23@gmail.com") {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505] text-white p-4">
        <div className="bg-[#131823] border border-red-500/20 rounded-2xl p-6 text-center max-w-sm shadow-xl">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-gray-455">
            This control panel is strictly restricted to administrator
            credentials.
          </p>
        </div>
      </div>
    );
  }

  const stats = state?.platformStats || {
    totalCommission: 0,
    activeBattles: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  };
  const usersCount = state?.users?.length || 0;

  // Calculate metrics
  const totalVotes =
    state?.battles?.reduce(
      (acc, b) => acc + b.player1Votes + b.player2Votes,
      0,
    ) || 0;
  const totalDepositsValue =
    state?.deposits
      ?.filter((d) => d.status === "APPROVED")
      .reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalWithdrawalsValue =
    state?.pendingRequests
      ?.filter((r) => r.type === "WITHDRAWAL" && r.status === "PAID")
      .reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const totalCoinsValue =
    state?.users?.reduce((sum, u) => sum + u.balance, 0) || 0;
  const totalBattleRevenue =
    state?.battles
      ?.filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + b.pot, 0) || 0;
  const totalPaidVoteRevenue =
    state?.transactions
      ?.filter((t) => t.type.startsWith("PAID_VOTE_"))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  const pendingDepositsList =
    state?.deposits?.filter((d) => d.status === "PENDING") || [];
  const pendingWithdrawalsList =
    state?.pendingRequests?.filter(
      (r) => r.type === "WITHDRAWAL" && r.status === "PENDING",
    ) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [isLiveStatsOpen, setIsLiveStatsOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row h-full w-full bg-[#050505] overflow-hidden">
      {/* Sidebar */}
      <div className="w-full sm:w-64 bg-[#0A0D14] border-b sm:border-b-0 sm:border-r border-gray-800 p-4 flex sm:flex-col overflow-x-auto sm:overflow-y-auto sm:h-full shrink-0">
        <div className="hidden sm:block mb-8 px-2">
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500">Internal control</p>
        </div>
        <div className="flex sm:flex-col gap-2">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? "bg-[#10B981] text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab === "Stats" && <Activity className="w-4 h-4" />}
              {tab === "Deposits" && <ArrowDownToLine className="w-4 h-4" />}
              {tab === "Withdrawals" && <ArrowUpFromLine className="w-4 h-4" />}
              {tab === "Battles" && <Swords className="w-4 h-4" />}
              {tab === "Users" && <Users className="w-4 h-4" />}
              {tab === "Support" && <LifeBuoy className="w-4 h-4" />}
              {tab === "Payment Methods" && <Wallet className="w-4 h-4" />}
              {tab === "Settings" && <Settings className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#050505] pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-6 flex justify-between items-center hidden sm:flex">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === "Stats" ? "Platform Overview" : activeTab}
            </h2>
            {activeTab === "Users" && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ID or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-2 pl-10 text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                />
                <Users className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              </div>
            )}
            {activeTab !== "Users" && (
              <div className="text-sm text-gray-500 font-mono">
                Live Sync Active
              </div>
            )}
          </div>

          {activeTab === "Stats" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#131823] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    Total Users
                    <Users className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {usersCount}
                  </div>
                </div>

                <div className="bg-[#131823] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    Active Battles
                    <Activity className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {stats.activeBattles}
                  </div>
                </div>

                <div className="bg-[#131823] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    Pending Deposits
                    <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {stats.pendingDeposits}
                  </div>
                </div>

                <div className="bg-[#131823] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    Pending Withdrawals
                    <ArrowUpFromLine className="w-4 h-4 text-[#F43F5E]" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {stats.pendingWithdrawals}
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE VOTEX LIVE STATISTICS DASHBOARD */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsLiveStatsOpen(!isLiveStatsOpen)}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-br from-[#0c0f18] to-[#131823] border border-[#10B981]/30 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-[#10B981]/50 transition-all focus:outline-none group text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="relative flex h-3.5 w-3.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                    </span>
                    <div>
                      <h3 className="text-sm font-black tracking-widest text-[#10B981] uppercase">
                        VOTEX LIVE STATISTICS
                      </h3>
                      <p className="text-[10px] text-gray-400 font-sans">
                        Match logs, ledger status & current user balances
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full hidden sm:inline-block">
                      {state?.battles?.filter((b) => b.status === "LIVE")
                        .length || 0}{" "}
                      ongoing
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isLiveStatsOpen ? "rotate-180 text-[#10B981]" : ""}`}
                    />
                  </div>
                </button>

                {isLiveStatsOpen && (
                  <div className="bg-gradient-to-br from-[#0c0f18] to-[#06080d] border border-[#10B981]/30 rounded-2xl p-5 lg:p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] space-y-6 animate-in fade-in duration-300">
                    {/* Live Dashboard Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <div>
                          <h3 className="text-lg font-black tracking-wider text-white">
                            VOTEX Live Network Status
                          </h3>
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                            Connected to Database Ledger
                          </p>
                        </div>
                      </div>
                      <div className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2 font-mono text-xs flex items-center gap-2">
                        <span className="text-gray-400">
                          Ongoing Live Matches:
                        </span>
                        <span className="text-emerald-400 font-extrabold text-sm">
                          {state?.battles?.filter((b) => b.status === "LIVE")
                            .length || 0}{" "}
                          Live
                        </span>
                      </div>
                    </div>

                    {/* All Users' Coin Balances List */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#10B981]">
                          All Users' Coin Balances
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500">
                          Total Coins Circulating:{" "}
                          {state?.users
                            ?.reduce((sum, u) => sum + (u.balance || 0), 0)
                            .toLocaleString()}{" "}
                          VTX
                        </span>
                      </div>
                      <div className="bg-black/30 border border-gray-800 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                        {state?.users?.map((u) => (
                          <div
                            key={u.id}
                            className="flex justify-between items-center bg-[#07090E]/60 p-3 rounded-lg border border-gray-800/40"
                          >
                            <div className="flex items-center gap-3 w-2/3">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs uppercase shrink-0 ${u.is_bot ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"}`}
                              >
                                {u.username.substring(0, 2)}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span className="truncate">
                                    @{u.username}
                                  </span>
                                  {u.is_bot && (
                                    <span className="text-[8px] bg-purple-500/25 text-purple-400 border border-purple-500/30 px-1 py-0.2 rounded shrink-0 font-sans">
                                      BOT
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[9px] text-gray-500 truncate">
                                  ID: {u.uniqueId} | {u.email}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-mono font-black text-emerald-400 w-1/3 text-right">
                              {Number(u.balance || 0).toLocaleString()} VTX
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dedicated "Live Match Logs" Table */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#10B981]">
                          Dedicated Live Match Logs
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500">
                          Logged Matches: {state?.battles?.length || 0}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-black/40 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[550px] text-xs font-mono">
                          <thead>
                            <tr className="border-b border-gray-800 bg-[#131823]/60 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                              <th className="py-3 px-4">
                                Match ID
                              </th>
                              <th className="py-3 px-4">
                                Players
                              </th>
                              <th className="py-3 px-4 text-center">
                                Result
                              </th>
                              <th className="py-3 px-4 text-right">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/40">
                            {state?.battles?.map((battle) => {
                              const p1 = state.users.find(
                                (u) => u.id === battle.player1Id,
                              );
                              const p2 = state.users.find(
                                (u) => u.id === battle.player2Id,
                              );
                              const winner = battle.winnerId
                                ? state.users.find(
                                    (u) => u.id === battle.winnerId,
                                  )
                                : null;

                              let resultText = "In Progress";
                              let resultColor = "text-yellow-500";
                              if (battle.status === "LIVE") {
                                resultText = "🟢 Live Match";
                                resultColor = "text-[#10B981] animate-pulse";
                              } else if (battle.status === "COMPLETED") {
                                if (winner) {
                                  resultText = `Winner: @${winner.username}`;
                                  resultColor = "text-emerald-400 font-bold";
                                } else {
                                  resultText = "Draw";
                                  resultColor = "text-gray-400";
                                }
                              } else if (battle.status === "CANCELLED") {
                                resultText = "❌ Cancelled";
                                resultColor = "text-red-400";
                              } else {
                                resultText = `Pending (${battle.status})`;
                                resultColor = "text-slate-500";
                              }

                              return (
                                <tr
                                  key={battle.id}
                                  className="hover:bg-gray-800/20 transition-colors"
                                >
                                  <td className="py-3 px-4 font-bold text-white">
                                    {battle.id}
                                  </td>
                                  <td className="py-3 px-4 font-sans text-white">
                                    <span className="font-bold text-sky-400">
                                      @{p1?.username || "Unknown"}
                                    </span>
                                    <span className="text-gray-500 mx-2 text-xs">
                                      vs
                                    </span>
                                    <span className="font-bold text-indigo-400">
                                      @{p2?.username || "Pending"}
                                    </span>
                                  </td>
                                  <td
                                    className={`py-3 px-4 text-center font-sans text-xs font-semibold ${resultColor}`}
                                  >
                                    {resultText}
                                  </td>
                                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                                    {battle.stake?.toLocaleString() || "0"} VTX
                                  </td>
                                </tr>
                              );
                            })}
                            {(!state?.battles ||
                              state.battles.length === 0) && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="py-8 text-center text-gray-500"
                                >
                                  No matches logged.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Overview Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#131823] to-[#0A0D14] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Total Deposits (VTX)
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    {totalDepositsValue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#131823] to-[#0A0D14] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Total Paid Vote Revenue
                  </div>
                  <div className="text-2xl font-black text-purple-400">
                    {totalPaidVoteRevenue.toLocaleString()} VTX
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#131823] to-[#0A0D14] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Total Withdrawals
                  </div>
                  <div className="text-2xl font-black text-[#F43F5E]">
                    {totalWithdrawalsValue.toLocaleString()} VTX
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#131823] to-[#0A0D14] border border-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Commission ({stats.platformFeePercent}%)
                  </div>
                  <div className="text-2xl font-black text-yellow-400">
                    {stats.totalCommission.toLocaleString()} VTX
                  </div>
                </div>
              </div>

              {/* New Distinct Cards Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions Card */}
                <div className="bg-[#131823] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col h-80">
                  <h3 className="font-bold text-white mb-4 border-b border-gray-800 pb-2">
                    Recent Transactions
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {state?.transactions?.slice(0, 10).map((t, i) => {
                      const u = state.users.find(
                        (user) => user.id === t.userId,
                      );
                      const sourceUser = t.sourceUserId
                        ? state.users.find((user) => user.id === t.sourceUserId)
                        : null;
                      return (
                        <div
                          key={i}
                          className="flex flex-col gap-2 bg-[#0A0D14] p-3 rounded-xl border border-gray-800/50"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs font-bold text-gray-300">
                                {t.type === "PLATFORM_FEE"
                                  ? "🏆 PLATFORM COMMISSION (20%)"
                                  : t.type}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                @{u?.username || "Admin"} -{" "}
                                {new Date(t.date).toLocaleTimeString()}
                              </div>
                            </div>
                            <div
                              className={`text-sm font-mono font-bold ${t.amount > 0 ? "text-[#10B981]" : "text-red-400"}`}
                            >
                              {t.amount > 0 ? "+" : ""}
                              {t.amount} VTX
                            </div>
                          </div>
                          {t.type === "PLATFORM_FEE" && (
                            <div className="text-[9px] bg-yellow-500/10 text-yellow-400/90 border border-yellow-500/20 p-2 rounded-lg font-mono flex flex-col gap-0.5">
                              <div>
                                <span className="text-gray-400">
                                  Source User ID:
                                </span>{" "}
                                {t.sourceUserId || "N/A"}{" "}
                                {sourceUser ? `(@${sourceUser.username})` : ""}
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Battle ID:
                                </span>{" "}
                                {t.battleId || "N/A"}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* User Register List Card */}
                <div className="bg-[#131823] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col h-80">
                  <h3 className="font-bold text-white mb-4 border-b border-gray-800 pb-2">
                    New Registrations
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {state?.users
                      ?.filter((u) => !u.is_bot)
                      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                      .slice(0, 10)
                      .map((u) => (
                        <div
                          key={u.id}
                          className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-gray-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                              {u.username.substring(0, 2)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                @{u.username}
                              </div>
                              <div className="font-mono text-[10px] text-gray-500">
                                ID: {u.uniqueId}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                adminAction("TOGGLE_LEADERBOARD_APPROVAL", {
                                  userId: u.id,
                                })
                              }
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all border ${
                                u.approved_for_leaderboard !== false
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                              }`}
                            >
                              {u.approved_for_leaderboard !== false
                                ? "Approved"
                                : "Hidden"}
                            </button>
                            <div className="text-[10px] text-gray-400">
                              {new Date(
                                u.createdAt || Date.now(),
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Deposits" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {pendingDepositsList.length > 0 ? (
                pendingDepositsList.map((req) => {
                  const user = state?.users.find((u) => u.id === req.userId);
                  return (
                    <div
                      key={req.id}
                      className="bg-[#131823] border border-gray-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-white">
                            @{user?.username || "Unknown"}{" "}
                            <span className="text-gray-400 text-xs ml-1">
                              (ID: {user?.uniqueId || "N/A"})
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(req.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-emerald-400 font-mono font-bold">
                          +{req.amount}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-2">
                        {req.transactionId && (
                          <div className="bg-gray-800/50 text-gray-300 py-2 px-3 rounded-lg text-xs font-mono border border-gray-700 flex flex-col gap-1">
                            {req.transactionId.includes("::") ? (
                              <>
                                <span className="text-gray-400 font-sans font-bold text-[10px] uppercase tracking-wider">
                                  {req.transactionId.split("::")[0].trim()}
                                </span>
                                <span>
                                  TID:{" "}
                                  <span className="text-[#10B981] font-bold">
                                    {req.transactionId.split("::")[1].trim()}
                                  </span>
                                </span>
                              </>
                            ) : (
                              <span>
                                TID:{" "}
                                <span className="text-[#10B981] font-bold">
                                  {req.transactionId}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {req.receiptUrl && (
                            <button
                              onClick={() =>
                                setSelectedReceipt(req.receiptUrl!)
                              }
                              className="flex-1 bg-blue-500/10 text-blue-400 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-500/20 transition-colors"
                            >
                              <ImageIcon className="w-3 h-3" /> Receipt
                            </button>
                          )}
                          <button
                            onClick={() =>
                              adminAction("REJECT_DEPOSIT", {
                                requestId: req.id,
                              })
                            }
                            className="bg-red-500/10 text-red-500 p-2 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              adminAction("APPROVE_DEPOSIT", {
                                requestId: req.id,
                                amount: req.amount,
                              })
                            }
                            className="flex-1 bg-emerald-500/10 text-emerald-400 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 opacity-50 bg-[#131823] rounded-2xl border border-gray-800">
                  <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                  <p>No pending deposits.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "Withdrawals" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {pendingWithdrawalsList.length > 0 ? (
                pendingWithdrawalsList.map((req) => {
                  const user = state?.users.find((u) => u.id === req.userId);
                  return (
                    <div
                      key={req.id}
                      className="bg-[#131823] border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-lg"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">
                          @{user?.username || "Unknown"}{" "}
                          <span className="text-gray-400 text-xs ml-1">
                            (ID: {user?.uniqueId || "N/A"})
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(req.date).toLocaleString()}
                        </p>
                        <p className="text-sm font-mono text-[#10B981]">
                          {req.easypaisaNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[#F43F5E] font-mono font-bold">
                          -{req.amount}
                        </div>
                        <button
                          onClick={() =>
                            adminAction("APPROVE_WITHDRAWAL", {
                              requestId: req.id,
                            })
                          }
                          className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg hover:bg-emerald-500/40 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            adminAction("REJECT_WITHDRAWAL", {
                              requestId: req.id,
                            })
                          }
                          className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/40 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 opacity-50 bg-[#131823] rounded-2xl border border-gray-800">
                  <ArrowUpFromLine className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                  <p>No pending withdrawals.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "Battles" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#131823] p-5 rounded-xl border border-gray-800 shadow-lg h-fit">
                  <h3 className="text-white font-bold mb-4">
                    Create Display Battle (Bots)
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const p1 = formData.get("player1") as string;
                      const p2 = formData.get("player2") as string;
                      const stake = Number(formData.get("stake"));
                      const type =
                        (formData.get("battleType") as string) || "QUICK";
                      const p1Votes = Number(formData.get("p1Votes")) || 0;
                      const p2Votes = Number(formData.get("p2Votes")) || 0;
                      if (p1 && p2 && p1 !== p2 && stake > 0) {
                        adminAction("CREATE_ADMIN_BATTLE", {
                          player1Id: p1,
                          player2Id: p2,
                          stake,
                          type,
                          p1Votes,
                          p2Votes,
                        });
                        toast.success("Battle created!");
                      } else {
                        toast.error("Invalid battle parameters");
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">
                          Player 1
                        </label>
                        <select
                          name="player1"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                        >
                          <option value="">Select Bot...</option>
                          {state?.users
                            ?.filter((u) => u.is_bot)
                            .map((bot) => (
                              <option key={bot.id} value={bot.id}>
                                @{bot.username}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">
                          Player 2
                        </label>
                        <select
                          name="player2"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                        >
                          <option value="">Select Bot...</option>
                          {state?.users
                            ?.filter((u) => u.is_bot)
                            .map((bot) => (
                              <option key={bot.id} value={bot.id}>
                                @{bot.username}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">
                          Battle Type
                        </label>
                        <select
                          name="battleType"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                        >
                          <option value="QUICK">
                            Quick Battle (2 minutes)
                          </option>
                          <option value="GRAND">Grand Battle (24 hours)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">
                          Virtual Stake
                        </label>
                        <input
                          name="stake"
                          type="number"
                          min="100"
                          defaultValue="1000"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">
                          P1 Initial Votes
                        </label>
                        <input
                          name="p1Votes"
                          type="number"
                          min="0"
                          defaultValue="0"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">
                          P2 Initial Votes
                        </label>
                        <input
                          name="p2Votes"
                          type="number"
                          min="0"
                          defaultValue="0"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#10B981] text-black font-bold px-4 py-3 rounded-lg hover:bg-[#059669]"
                    >
                      Start Battle
                    </button>
                  </form>
                </div>

                <div className="bg-[#131823] p-5 rounded-xl border border-gray-800 shadow-lg flex flex-col h-[600px]">
                  <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">
                    Active Battles Overview
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {state?.battles
                      ?.filter(
                        (b) => b.status === "LIVE" || b.status === "WAITING",
                      )
                      .map((battle) => {
                        const p1 = state.users.find(
                          (u) => u.id === battle.player1Id,
                        );
                        const p2 = state.users.find(
                          (u) => u.id === battle.player2Id,
                        );
                        return (
                          <div
                            key={battle.id}
                            className="bg-[#0A0D14] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-sm text-white">
                                @{p1?.username || "Unknown"}{" "}
                                <span className="text-gray-500 mx-2">vs</span> @
                                {p2?.username || "Pending"}
                              </p>
                              <p className="text-xs text-emerald-400 mt-1 font-mono">
                                Pot: {battle.pot} VTX
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (window.confirm("Cancel this battle?")) {
                                  adminAction("CANCEL_BATTLE", {
                                    battleId: battle.id,
                                  });
                                }
                              }}
                              className="text-xs text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        );
                      })}
                    {state?.battles?.filter(
                      (b) => b.status === "LIVE" || b.status === "WAITING",
                    ).length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-10">
                        No active battles.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Users" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="sm:hidden mb-4">
                <input
                  type="text"
                  placeholder="Search ID or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </div>
              <div className="bg-[#131823] p-6 rounded-2xl border border-gray-800 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-4">
                  <h3 className="text-white font-bold text-lg">
                    User Statistics & Management
                  </h3>
                  <div className="text-xs text-gray-400 font-mono bg-[#0A0D14]/80 px-3 py-1.5 rounded-lg border border-gray-800/80">
                    Total Users:{" "}
                    {state?.users?.filter((u) => !u.is_bot).length || 0}
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-4">User Name / ID</th>
                        <th className="py-3 px-4 text-center">
                          Total Coins / Balance
                        </th>
                        <th className="py-3 px-4 text-center">
                          Total Matches Played
                        </th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {state?.users
                        ?.filter(
                          (u) =>
                            !u.is_bot &&
                            (u.username
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                              u.uniqueId.includes(searchQuery)),
                        )
                        .map((user) => {
                          const totalMatches =
                            state?.battles?.filter(
                              (b) =>
                                b.player1Id === user.id ||
                                b.player2Id === user.id,
                            ).length || 0;
                          return (
                            <tr
                              key={user.id}
                              className="hover:bg-[#1A1F2E]/25 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-sm text-white">
                                    @{user.username}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    ID: {user.uniqueId}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono">
                                <span className="text-sm font-black text-[#10B981]">
                                  {user.balance.toLocaleString()} VTX
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/10">
                                  {totalMatches} Matches
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  <button
                                    onClick={() => {
                                      const amountStr = prompt(
                                        `Adjust balance for @${user.username} (Use negative for deduction):`,
                                      );
                                      if (
                                        amountStr &&
                                        !isNaN(Number(amountStr))
                                      ) {
                                        adminAction("ADMIN_ADJUST_BALANCE", {
                                          userId: user.id,
                                          amount: Number(amountStr),
                                        });
                                      }
                                    }}
                                    className="bg-yellow-500/15 border border-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-yellow-500/25 transition-colors"
                                  >
                                    Adjust Balance
                                  </button>
                                  <button
                                    onClick={() =>
                                      adminAction(
                                        "TOGGLE_LEADERBOARD_APPROVAL",
                                        { userId: user.id },
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                                      user.approved_for_leaderboard !== false
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                        : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                    }`}
                                  >
                                    Leaderboard:{" "}
                                    {user.approved_for_leaderboard !== false
                                      ? "Approved"
                                      : "Hidden"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {state?.users?.filter(
                  (u) =>
                    !u.is_bot &&
                    (u.username
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                      u.uniqueId.includes(searchQuery)),
                ).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No real users found matching "{searchQuery}".
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#131823] p-5 rounded-xl border border-gray-800 shadow-lg h-fit">
                  <h3 className="text-white font-bold mb-4">
                    Create Display Bot
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get("botName") as string;
                      if (name) {
                        adminAction("CREATE_BOT", { name });
                        (e.target as HTMLFormElement).reset();
                        toast.success("Bot created");
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="botName"
                      placeholder="e.g. ₿ Bitcoin"
                      className="flex-1 bg-[#1A1F2E] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#10B981]"
                    />
                    <button
                      type="submit"
                      className="bg-[#10B981] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#059669]"
                    >
                      Add Bot
                    </button>
                  </form>
                </div>

                <div className="bg-[#131823] p-5 rounded-xl border border-gray-800 shadow-lg flex flex-col h-[400px]">
                  <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">
                    Bots (Display Users)
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {state?.users
                      ?.filter((u) => u.is_bot)
                      .map((bot) => (
                        <div
                          key={bot.id}
                          className="bg-[#1a1c23] border border-dashed border-gray-700/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-extrabold text-sm text-gray-200">
                              @{bot.username}
                            </p>
                            <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                              {bot.balance.toLocaleString()} VTX
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const amountStr = prompt(
                                  `Adjust balance for Bot @${bot.username} (Use negative for deduction):`,
                                );
                                if (amountStr && !isNaN(Number(amountStr))) {
                                  adminAction("ADMIN_ADJUST_BALANCE", {
                                    userId: bot.id,
                                    amount: Number(amountStr),
                                  });
                                }
                              }}
                              className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-yellow-500/20 transition-all active:scale-95 shrink-0"
                            >
                              Adjust Coins
                            </button>
                            <button
                              onClick={() =>
                                adminAction("TOGGLE_LEADERBOARD_APPROVAL", {
                                  userId: bot.id,
                                })
                              }
                              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all border shrink-0 ${
                                bot.approved_for_leaderboard === true
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/15"
                              }`}
                            >
                              Leaderboard:{" "}
                              {bot.approved_for_leaderboard === true
                                ? "Approved"
                                : "Hidden"}
                            </button>
                          </div>
                        </div>
                      ))}
                    {state?.users?.filter((u) => u.is_bot).length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No bots created yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Support" && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-4">
                Support Tickets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state?.pendingRequests
                  ?.filter((r) => r.type === "SUPPORT_TICKET")
                  .sort((a, b) => b.date - a.date)
                  .map((ticket) => {
                    const user = state?.users?.find(
                      (u) => u.id === ticket.userId,
                    );
                    return (
                      <div
                        key={ticket.id}
                        className="bg-[#131823] border border-gray-800 rounded-2xl p-4 shadow-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-white text-sm">
                              @{user?.username || "Unknown"}{" "}
                              <span className="text-xs text-gray-500 font-mono ml-1">
                                ({user?.uniqueId})
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(ticket.date).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-lg ${
                              ticket.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <div className="bg-[#0A0D14] rounded-xl p-3 border border-gray-800/50 mb-3 text-sm text-gray-300">
                          {ticket.easypaisaNumber || "No message provided."}
                        </div>
                        {ticket.status === "PENDING" && (
                          <button
                            onClick={() =>
                              adminAction("RESOLVE_TICKET", {
                                ticketId: ticket.id,
                              })
                            }
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-2 rounded-xl transition-colors text-xs"
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>
                    );
                  })}
                {!state?.pendingRequests?.filter(
                  (r) => r.type === "SUPPORT_TICKET",
                ).length && (
                  <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-[#131823] border border-gray-800 border-dashed rounded-2xl">
                    No support tickets found.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#131823] p-5 lg:p-8 rounded-2xl border border-gray-800 shadow-lg">
                <h3 className="text-white font-bold mb-6 text-xl border-b border-gray-800 pb-4">
                  Platform Configuration
                </h3>
                <form
                  key={JSON.stringify(stats)}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    const paymentConfig = {
                      jazzcash: {
                        iban: formData.get("jcIban") as string,
                        deepLink: (formData.get("jcLink") as string) || "",
                        qrUrl: formData.get("jcQr") as string,
                      },
                      easypaisa: {
                        iban: formData.get("epIban") as string,
                        deepLink: formData.get("epLink") as string,
                        qrUrl: formData.get("epQr") as string,
                      },
                      sadapay: {
                        iban: formData.get("spIban") as string,
                        deepLink: formData.get("spLink") as string,
                        qrUrl: formData.get("spQr") as string,
                      },
                    };

                    adminAction("UPDATE_SETTINGS", {
                      paymentConfig,
                      depositAccountNumber: formData.get("epIban"),
                      platformFeePercent: Number(
                        formData.get("platformFeePercent"),
                      ),
                      minWithdrawal: Number(formData.get("minWithdrawal")),
                      maxWithdrawal: Number(formData.get("maxWithdrawal")),
                      quickStakes: formData.get("quickStakes"),
                      grandStakes: formData.get("grandStakes"),
                      signupBonus: Number(formData.get("signupBonus")),
                      enableQuickBattles:
                        formData.get("enableQuickBattles") === "on",
                      enableGrandBattles:
                        formData.get("enableGrandBattles") === "on",
                    });
                    toast.success("Settings updated successfully!");
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Signup Bonus (VTX)
                    </label>
                    <input
                      name="signupBonus"
                      defaultValue={stats.signupBonus || 1000}
                      type="number"
                      min="0"
                      className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 mt-2 p-4 bg-black/20 rounded-xl border border-gray-800">
                    <h4 className="text-[#10B981] font-bold border-b border-[#10B981]/20 pb-2 mb-4">
                      Easypaisa Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Account IBAN
                        </label>
                        <input
                          name="epIban"
                          defaultValue={
                            stats.paymentConfig?.easypaisa?.iban || ""
                          }
                          type="text"
                          placeholder="PK12EASY..."
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Deep Link
                        </label>
                        <input
                          name="epLink"
                          defaultValue={
                            stats.paymentConfig?.easypaisa?.deepLink || ""
                          }
                          type="url"
                          placeholder="easypaisa://"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          QR Code URL
                        </label>
                        <input
                          name="epQr"
                          defaultValue={
                            stats.paymentConfig?.easypaisa?.qrUrl || ""
                          }
                          type="url"
                          placeholder="https://..."
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 mb-2 p-4 bg-black/20 rounded-xl border border-gray-800">
                    <h4 className="text-blue-400 font-bold border-b border-blue-400/20 pb-2 mb-4">
                      SadaPay Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Account IBAN
                        </label>
                        <input
                          name="spIban"
                          defaultValue={
                            stats.paymentConfig?.sadapay?.iban || ""
                          }
                          type="text"
                          placeholder="PK12SADA..."
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Deep Link
                        </label>
                        <input
                          name="spLink"
                          defaultValue={
                            stats.paymentConfig?.sadapay?.deepLink || ""
                          }
                          type="url"
                          placeholder="sadapay://"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          QR Code URL
                        </label>
                        <input
                          name="spQr"
                          defaultValue={
                            stats.paymentConfig?.sadapay?.qrUrl || ""
                          }
                          type="url"
                          placeholder="https://..."
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 mb-2 p-4 bg-black/20 rounded-xl border border-gray-800">
                    <h4 className="text-amber-500 font-bold border-b border-amber-500/20 pb-2 mb-4">
                      JazzCash Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Account IBAN
                        </label>
                        <input
                          name="jcIban"
                          defaultValue={
                            stats.paymentConfig?.jazzcash?.iban || ""
                          }
                          type="text"
                          placeholder="PK12JAZZ..."
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Deep Link (Optional)
                        </label>
                        <input
                          name="jcLink"
                          defaultValue={
                            stats.paymentConfig?.jazzcash?.deepLink || ""
                          }
                          type="url"
                          placeholder="jazzcash://"
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          QR Code URL
                        </label>
                        <input
                          name="jcQr"
                          defaultValue={
                            stats.paymentConfig?.jazzcash?.qrUrl || ""
                          }
                          type="url"
                          placeholder="https://..."
                          className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Platform Fee (%)
                    </label>
                    <input
                      name="platformFeePercent"
                      defaultValue={stats.platformFeePercent || 20}
                      type="number"
                      min="0"
                      max="100"
                      className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Min Withdrawal (VTX)
                    </label>
                    <input
                      name="minWithdrawal"
                      defaultValue={stats.minWithdrawal || 500}
                      type="number"
                      className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Max Withdrawal (VTX)
                    </label>
                    <input
                      name="maxWithdrawal"
                      defaultValue={stats.maxWithdrawal || 50000}
                      type="number"
                      className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Quick Battle Stakes (CSV)
                    </label>
                    <input
                      name="quickStakes"
                      defaultValue={stats.quickStakes || "500,1000,2000,5000"}
                      type="text"
                      className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Grand Battle Stakes (CSV)
                    </label>
                    <input
                      name="grandStakes"
                      defaultValue={
                        stats.grandStakes || "10000,25000,50000,100000"
                      }
                      type="text"
                      className="w-full bg-[#1A1F2E] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981] transition-colors"
                    />
                  </div>
                  <div className="flex gap-6 md:col-span-2 p-4 bg-[#0A0D14] border border-gray-800 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer text-white">
                      <input
                        type="checkbox"
                        name="enableQuickBattles"
                        defaultChecked={stats.enableQuickBattles !== false}
                        className="w-5 h-5 accent-[#10B981]"
                      />
                      <span className="font-bold text-sm">
                        Enable Quick Battles
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-white">
                      <input
                        type="checkbox"
                        name="enableGrandBattles"
                        defaultChecked={stats.enableGrandBattles !== false}
                        className="w-5 h-5 accent-[#10B981]"
                      />
                      <span className="font-bold text-sm">
                        Enable Grand Battles
                      </span>
                    </label>
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-8 bg-[#10B981] text-black font-bold py-3 rounded-xl hover:bg-[#0ea5e9] transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedReceipt && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in"
              onClick={() => setSelectedReceipt(null)}
            >
              <div
                className="relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="absolute -top-12 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={selectedReceipt}
                  alt="Receipt"
                  className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
