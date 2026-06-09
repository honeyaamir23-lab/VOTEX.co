import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  uniqueId: string;
  username: string;
  email: string;
  password?: string;
  balance: number;
  is_admin: boolean;
  is_bot: boolean;
}

interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: number;
}

interface Battle {
  id: string;
  player1Id: string;
  player2Id: string;
  stake: number;
  pot: number;
  status: string;
  player1Votes: number;
  player2Votes: number;
  type: string;
  createdAt: number;
  durationMs: number;
  winnerId?: string;
  notified?: boolean;
}

interface PlatformStats {
  totalCommission: number;
  activeBattles: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  depositAccountNumber?: string;
  depositLink?: string;
  depositIban?: string;
  paymentConfig: {
    easypaisa: { iban: string, deepLink: string, qrUrl: string },
    sadapay: { iban: string, deepLink: string, qrUrl: string }
  };
  platformFeePercent: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  quickStakes: string;
  grandStakes: string;
  enableQuickBattles: boolean;
  enableGrandBattles: boolean;
  signupBonus: number;
}

interface Challenge {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  stake: number;
  type: string;
  durationMs: number;
  createdAt: number;
}

interface State {
  users: User[];
  battles: Battle[];
  transactions: any[];
  challenges: Challenge[];
  pendingRequests: { id: string, type: 'DEPOSIT' | 'WITHDRAWAL' | 'SUPPORT_TICKET', userId: string, amount: number, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED', easypaisaNumber?: string, date: number }[];
  deposits: { id: string, userId: string, amount: number, receiptUrl?: string, transactionId?: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', timestamp: number }[];
  platformStats: PlatformStats;
  notifications: Notification[];
}

interface GameContextType {
  state: State;
  currentUser: User | null;
  isAuthLoading: boolean;
  globalError: string | null;
  vote: (battleId: string, targetPlayerId: string, isPaid: boolean) => void;
  createBattle: (battleData: any) => void;
  sendChallenge: (receiverUniqueId: string, stake: number, type: string, durationMs: number) => Promise<void>;
  updateChallenge: (challengeId: string, status: 'ACCEPTED' | 'REJECTED') => Promise<void>;
  startChallengeBattle: (challengeId: string) => Promise<void>;
  submitDeposit: (amount: number, receiptUrl: string, transactionId: string) => Promise<void>;
  adminAction: (type: string, payload: any) => void;
  userRequest: (type: string, payload: any) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string, newPass: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const defaultState: State = {
  users: [],
  battles: [],
  transactions: [],
  challenges: [],
  pendingRequests: [],
  deposits: [],
  platformStats: { totalCommission: 0, activeBattles: 0, pendingDeposits: 0, pendingWithdrawals: 0, depositAccountNumber: "03001234567", platformFeePercent: 20, minWithdrawal: 500, maxWithdrawal: 50000, quickStakes: '500,1000,2000,5000', grandStakes: '10000,25000,50000,100000', enableQuickBattles: true, enableGrandBattles: true, signupBonus: 1000, paymentConfig: { easypaisa: { iban: '', deepLink: '', qrUrl: '' }, sadapay: { iban: '', deepLink: '', qrUrl: '' } } },
  notifications: []
};

const GameContext = createContext<GameContextType>({} as GameContextType);

// Generate a random 6-digit ID
const generateUniqueId = () => Math.floor(100000 + Math.random() * 900000).toString();

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<State>(defaultState);
  const [authUserId, setAuthUserId] = useState<string | null>(localStorage.getItem('customAuthUserId'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      try {
          const cached = localStorage.getItem('currentUserCached');
          return cached ? JSON.parse(cached) : null;
      } catch {
          return null;
      }
  });
  const [isInitializing, setIsInitializing] = useState(() => !localStorage.getItem('currentUserCached'));
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
      if (currentUser) {
          localStorage.setItem('currentUserCached', JSON.stringify(currentUser));
      } else {
          localStorage.removeItem('currentUserCached');
      }
  }, [currentUser]);

  // Dedicated service to verify auth session status
  useEffect(() => {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user && session.user.id !== authUserId) {
              setAuthUserId(session.user.id);
              localStorage.setItem('customAuthUserId', session.user.id);
          } else if (event === 'SIGNED_OUT') {
              setAuthUserId(null);
              localStorage.removeItem('customAuthUserId');
              setCurrentUser(null);
          }
      });
      return () => {
          authListener.subscription.unsubscribe();
      };
  }, [authUserId]);

  useEffect(() => {
     let mounted = true;
     const loadAuth = async () => {
         if (!localStorage.getItem('currentUserCached')) {
             setIsInitializing(true);
         }
         
         // Verify auth session status immediately before mounting to prevent UI flickering
         const { data: { session } } = await supabase.auth.getSession();
         const activeUserId = session?.user?.id || authUserId;

         if (session?.user && session.user.id !== authUserId) {
             setAuthUserId(session.user.id);
             localStorage.setItem('customAuthUserId', session.user.id);
         }

         if (activeUserId) {
             fetchInitialData();
             const { data, error } = await supabase.from('users').select('*').eq('id', activeUserId).maybeSingle();
             if (!mounted) return;
             if (error && error.message.includes('schema cache')) {
                 setGlobalError("Database schema not found. Please run the supabase_schema.sql file in your Supabase SQL Editor.");
             }
             if (data) {
                 setCurrentUser(mapUser(data));
             } else {
                 console.error("Auth Load Data Missing", error);
                 if (error) {
                     toast.error("Session Sync Error: " + error.message);
                 }
                 setAuthUserId(null);
                 localStorage.removeItem('customAuthUserId');
                 setCurrentUser(null);
             }
         } else {
             if (!mounted) return;
             setCurrentUser(null);
         }
         setIsInitializing(false);
     };
     loadAuth();

     return () => { mounted = false; };
  }, [authUserId]);

  const mapUser = (u: any) => ({ ...u, uniqueId: u.unique_id, is_bot: u.unique_id?.startsWith('bot_') || !!u.is_bot });
  const mapBattle = (b: any) => ({ ...b, player1Id: b.player1_id, player2Id: b.player2_id, player1Votes: b.player1_votes, player2Votes: b.player2_votes, createdAt: b.created_at, durationMs: b.duration_ms, winnerId: b.winner_id, notified: b.notified });
  const mapChallenge = (c: any) => ({ ...c, senderId: c.sender_id, receiverId: c.receiver_id, createdAt: c.created_at, durationMs: c.duration_ms });
  const mapTransaction = (t: any) => ({ ...t, userId: t.user_id });
  const mapDeposit = (d: any) => ({ ...d, userId: d.user_id, receiptUrl: d.receipt_url, transactionId: d.transaction_id });
  const mapPendingReq = (p: any) => ({ ...p, userId: p.user_id, easypaisaNumber: p.easypaisa_number });
  const mapNotification = (n: any) => ({ ...n, userId: n.user_id, createdAt: n.created_at });
  const parsePaymentConfig = (ibanStr: any) => {
      try {
          const parsed = JSON.parse(ibanStr);
          if (parsed && (parsed.paymentConfig || parsed.easypaisa)) {
              return parsed;
          }
      } catch {}
      return {
          paymentConfig: {
              easypaisa: { iban: '', deepLink: '', qrUrl: '' },
              sadapay: { iban: '', deepLink: '', qrUrl: '' }
          }
      };
  };

  const mapStats = (s: any) => {
      const extraSettings = parsePaymentConfig(s.deposit_iban);
      return { 
          totalCommission: s.total_commission, activeBattles: s.active_battles, 
          pendingDeposits: s.pending_deposits, pendingWithdrawals: s.pending_withdrawals, 
          depositAccountNumber: s.deposit_account_number, depositLink: s.deposit_link, depositIban: s.deposit_iban,
          paymentConfig: extraSettings.paymentConfig || extraSettings,
          platformFeePercent: extraSettings.platformFeePercent ?? s.platform_fee_percent ?? 20,
          minWithdrawal: extraSettings.minWithdrawal ?? s.min_withdrawal ?? 500,
          maxWithdrawal: extraSettings.maxWithdrawal ?? s.max_withdrawal ?? 50000,
          quickStakes: extraSettings.quickStakes ?? s.quick_stakes ?? '500,1000,2000,5000',
          grandStakes: extraSettings.grandStakes ?? s.grand_stakes ?? '10000,25000,50000,100000',
          enableQuickBattles: extraSettings.enableQuickBattles ?? s.enable_quick_battles !== false,
          enableGrandBattles: extraSettings.enableGrandBattles ?? s.enable_grand_battles !== false,
          signupBonus: extraSettings.signupBonus ?? s.signup_bonus ?? 1000
      };
  };

  const fetchInitialData = async () => {
      const [uRes, bRes, tRes, cRes, dRes, pRes, sRes, nRes] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('battles').select('*'),
          supabase.from('transactions').select('*'),
          supabase.from('challenges').select('*'),
          supabase.from('deposits').select('*'),
          supabase.from('pending_requests').select('*'),
          supabase.from('stats').select('*').eq('id', 'global').maybeSingle(),
          supabase.from('notifications').select('*').eq('user_id', authUserId)
      ]);

      if (uRes.error && uRes.error.message.includes('schema cache')) {
          setGlobalError("Database schema not found. Please run the supabase_schema.sql file in your Supabase SQL Editor to create the 'users' and other tables.");
      }

      setState(prev => ({
          ...prev,
          users: uRes.data?.map(mapUser) || [],
          battles: bRes.data?.map(mapBattle) || [],
          transactions: tRes.data?.map(mapTransaction) || [],
          challenges: cRes.data?.map(mapChallenge) || [],
          deposits: dRes.data?.map(mapDeposit) || [],
          pendingRequests: pRes.data?.map(mapPendingReq) || [],
          platformStats: sRes.data ? mapStats(sRes.data) : prev.platformStats,
          notifications: nRes.data?.map(mapNotification) || []
      }));
  };

  useEffect(() => {
     if (!authUserId) return;

     fetchInitialData();

     let debounceTimer: any;
     const fetchDebounced = () => {
         clearTimeout(debounceTimer);
         debounceTimer = setTimeout(() => {
             fetchInitialData();
         }, 100);
     };

     const channel = supabase.channel(`realtime_all_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public' }, fetchDebounced)
        .subscribe();

     // Fast poll for current user to keep balance snappy, ignoring RLS delays if any
     const pollUser = setInterval(async () => {
         const { data } = await supabase.from('users').select('*').eq('id', authUserId).single();
         if (data) setCurrentUser(mapUser(data));
     }, 4000);

     return () => {
         supabase.removeChannel(channel);
         clearInterval(pollUser);
         clearTimeout(debounceTimer);
     };
  }, [authUserId]);

  const resolveBattle = async (battle: Battle) => {
    // Only proceed if it is strictly LIVE
    if (battle.status !== 'LIVE') return;
    
    // Atomically mark as COMPLETED. Only the first client to succeed gets the row.
    const { data: updatedRows } = await supabase
       .from('battles')
       .update({ status: 'COMPLETED' })
       .eq('id', battle.id)
       .eq('status', 'LIVE')
       .select();
       
    if (!updatedRows || updatedRows.length === 0) {
        // Another client already resolved this battle
        return;
    }

    let winnerId: string | null = null;
    if (battle.player1Votes > battle.player2Votes) winnerId = battle.player1Id;
    else if (battle.player2Votes > battle.player1Votes) winnerId = battle.player2Id;

    // Optimistically hide the battle globally
    setState(s => ({
       ...s,
       battles: s.battles.map(b => b.id === battle.id ? { ...b, status: 'COMPLETED', winnerId: winnerId || 'TIE' } : b)
    }));

    // DEMO BATTLE CHECK
    if (battle.type === 'DISPLAY' || battle.type === 'ADMIN') {
         await supabase.from('battles').update({ winner_id: winnerId || 'TIE' }).eq('id', battle.id);
         const { data: stats } = await supabase.from('stats').select('active_battles').eq('id', 'global').single();
         if (stats) {
             await supabase.from('stats').update({ active_battles: Math.max(0, stats.active_battles - 1) }).eq('id', 'global');
         }
         return; // Do not distribute any real coins
    }

    const feePercent = state.platformStats.platformFeePercent || 20;
    const adminCommission = Math.floor((battle.pot || (battle.stake * 2)) * (feePercent / 100));
    const admin = state.users.find(u => u.is_admin);

    if (!winnerId) {
      // Tie - deduct platform fee and refund the remainder equally
      const remainingPot = (battle.pot || (battle.stake * 2)) - adminCommission;
      const splitAmount = Math.floor(remainingPot / 2);

      const updates: any[] = [
         battle.player1Id ? supabase.rpc('increment_balance', { row_id: battle.player1Id, amount: splitAmount }) : Promise.resolve(),
         battle.player2Id ? supabase.rpc('increment_balance', { row_id: battle.player2Id, amount: splitAmount }) : Promise.resolve(),
         supabase.from('battles').update({ winner_id: 'TIE' }).eq('id', battle.id),
         battle.player1Id ? supabase.from('transactions').insert({ type: 'BATTLE_TIE_REFUND', amount: splitAmount, user_id: battle.player1Id, date: Date.now() }) : Promise.resolve(),
         battle.player2Id ? supabase.from('transactions').insert({ type: 'BATTLE_TIE_REFUND', amount: splitAmount, user_id: battle.player2Id, date: Date.now() }) : Promise.resolve(),
         battle.player1Id ? supabase.from('notifications').insert({ user_id: battle.player1Id, message: `Your battle ended in a tie. You received a refund of ${splitAmount} VTX.`, type: 'BATTLE_TIE', created_at: Date.now() }) : Promise.resolve(),
         battle.player2Id ? supabase.from('notifications').insert({ user_id: battle.player2Id, message: `Your battle ended in a tie. You received a refund of ${splitAmount} VTX.`, type: 'BATTLE_TIE', created_at: Date.now() }) : Promise.resolve()
      ];

      if (admin) {
         updates.push(supabase.rpc('increment_balance', { row_id: admin.id, amount: adminCommission }));
         updates.push(supabase.from('transactions').insert({ type: 'PLATFORM_FEE', amount: adminCommission, user_id: admin.id, date: Date.now() }));
      }
      
      const { data: stats } = await supabase.from('stats').select('total_commission, active_battles').eq('id', 'global').single();
      if (stats) {
          updates.push(supabase.from('stats').update({
             total_commission: stats.total_commission + adminCommission,
             active_battles: Math.max(0, stats.active_battles - 1)
          }).eq('id', 'global'));
      }

      await Promise.all(updates);
    } else {
      // Winner
      const winnerPrize = (battle.pot || (battle.stake * 2)) - adminCommission;
      
      const updates: any[] = [
         supabase.rpc('increment_balance', { row_id: winnerId, amount: winnerPrize }),
         supabase.from('battles').update({ winner_id: winnerId }).eq('id', battle.id),
         supabase.from('transactions').insert({ type: 'BATTLE_WIN', amount: winnerPrize, user_id: winnerId, date: Date.now() }),
         supabase.from('notifications').insert({ user_id: winnerId, message: `You won the battle and received ${winnerPrize} VTX!`, type: 'BATTLE_WIN', created_at: Date.now() })
      ];

      const loserId = winnerId === battle.player1Id ? battle.player2Id : battle.player1Id;
      if (loserId) {
          updates.push(supabase.from('notifications').insert({ user_id: loserId, message: `You lost the battle. Better luck next time!`, type: 'BATTLE_LOSS', created_at: Date.now() }));
      }

      if (admin) {
         updates.push(supabase.rpc('increment_balance', { row_id: admin.id, amount: adminCommission }));
         updates.push(supabase.from('transactions').insert({ type: 'PLATFORM_FEE', amount: adminCommission, user_id: admin.id, date: Date.now() }));
      }
      
      // Update stats
      const { data: stats } = await supabase.from('stats').select('total_commission, active_battles').eq('id', 'global').single();
      if (stats) {
          updates.push(supabase.from('stats').update({
             total_commission: stats.total_commission + adminCommission,
             active_battles: Math.max(0, stats.active_battles - 1)
          }).eq('id', 'global'));
      }

      await Promise.all(updates);
    }
  };

  // Check for expired battles every few seconds
  const battlesRef = useRef(state.battles);
  useEffect(() => {
     battlesRef.current = state.battles;
  }, [state.battles]);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
       const now = Date.now();
       battlesRef.current.forEach(b => {
          if (b.status === 'LIVE' && b.createdAt + b.durationMs <= now) {
             resolveBattle(b);
          }
       });
    }, 1000); // Check every second for exact precision
    return () => clearInterval(interval);
  }, [currentUser]);

  const loginWithEmail = async (email: string, pass: string) => {
      const emailLower = email.toLowerCase();
      
      // Auto-bypass for the admin user to ensure instant access and avoid Email Not Confirmed issues
      if (emailLower === 'honeyaamir23@gmail.com') {
         let { data: adminUser } = await supabase.from('users').select('*').eq('email', emailLower).maybeSingle();
         
         // If admin doesn't exist in public.users yet, create them:
         if (!adminUser) {
             const { data: newUser, error: insertErr } = await supabase.from('users').insert({
                unique_id: generateUniqueId(),
                username: 'Admin',
                email: emailLower,
                password: 'adminpassword',
                balance: 1000000,
                is_admin: true
             }).select('*').single();
             if (insertErr) {
                if (insertErr.message.includes('schema cache') || insertErr.message.includes('relation "public.users" does not exist')) {
                    setGlobalError("Database schema not found. Please run the SQL setup script in your Supabase SQL Editor.");
                    return;
                }
                throw new Error("Failed to create admin bypass account: " + insertErr.message);
             }
             adminUser = newUser;
         } else {
             // strictly check password
             if (adminUser.password !== pass) {
                 throw new Error("Incorrect password for Admin account. Access denied.");
             }
             // ensure they have admin
             if (!adminUser.is_admin) {
                 const { error: updateErr } = await supabase.from('users').update({ is_admin: true }).eq('id', adminUser.id);
                 if (updateErr) throw new Error("Failed to set admin flags: " + updateErr.message);
                 adminUser.is_admin = true;
             }
         }
         
         if (adminUser) {
             setAuthUserId(adminUser.id);
             localStorage.setItem('customAuthUserId', adminUser.id);
             return;
         }
      }

      // First check custom table if user exists by email at all
      const { data: existingUser, error: selectErr } = await supabase.from('users').select('*').eq('email', emailLower).maybeSingle();
      if (selectErr && (selectErr.message.includes('schema cache') || selectErr.message.includes('relation "public.users" does not exist'))) {
          setGlobalError("Database schema not found. Please run the SQL setup script in your Supabase SQL Editor.");
          return;
      }
      
      if (existingUser) {
          // If they exist in our custom users database, strictly require matching password
          if (existingUser.password !== pass) {
              throw new Error("Incorrect password. Please enter the correct password for your account.");
          }
          setAuthUserId(existingUser.id);
          localStorage.setItem('customAuthUserId', existingUser.id);
          return;
      }

      // Try Supabase Auth as a fallback if they don't exist in our custom users table yet
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password: pass });
      
      if (error) {
         if (error.message.includes("Email not confirmed")) {
             throw new Error("Your account was created via Supabase, but your email is not confirmed. Please check your email inbox to verify your account before logging in. If you did not receive an email, creating a custom bypass account is not possible at this time.");
         }
         throw new Error("No existing account or incorrect login details.");
      }
      
      if (data.user) {
          // Ensure they exist in public.users to prevent loadAuth from rejecting them immediately
          const { data: existingPublicUser } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
          if (!existingPublicUser) {
              const { error: insertErr } = await supabase.from('users').insert({
                 id: data.user.id,
                 unique_id: generateUniqueId(),
                 username: emailLower.split('@')[0],
                 email: emailLower,
                 password: pass,
                 balance: 1000,
                 is_admin: emailLower === 'honeyaamir23@gmail.com'
              });
              if (insertErr) throw new Error("Could not sync user profile: " + insertErr.message);
          }
          setAuthUserId(data.user.id);
          localStorage.setItem('customAuthUserId', data.user.id);
      }
  };

  const resetPassword = async (email: string, newPass: string) => {
      const emailLower = email.toLowerCase();
      if (newPass.length < 6) throw new Error("Password must be at least 6 characters long for security.");
      
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', emailLower).maybeSingle();
      if (!existingUser) {
          throw new Error("No account found with this email address.");
      }
      
      const { error } = await supabase.from('users').update({ password: newPass }).eq('email', emailLower);
      if (error) {
          throw new Error("Failed to reset password: " + error.message);
      }
  };

  const signupWithEmail = async (name: string, email: string, pass: string) => {
      if (pass.length < 6) throw new Error("Password must be at least 6 characters.");
      const emailLower = email.toLowerCase();
      
      // Before trying Supabase auth (which will block unconfirmed emails), create the user in our public.users!
      const { data: existingUser } = await supabase.from('users').select('*').eq('email', emailLower).maybeSingle();
      if (existingUser) {
          throw new Error("Email already exists");
      }

      let newUserId;
      // Use Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email: emailLower, password: pass });
      
      if (error && !error.message.includes("User already registered")) {
          throw new Error(error.message);
      }

      newUserId = data?.user?.id;

      let insertedUser;
      if (newUserId) {
          const { data: inserted, error: insertError } = await supabase.from('users').insert({
              id: newUserId,
              unique_id: generateUniqueId(),
              username: name || emailLower.split('@')[0],
              email: emailLower,
              password: pass,
              balance: state.platformStats?.signupBonus ?? 1000,
              is_admin: emailLower === 'honeyaamir23@gmail.com'
          }).select('*').single();
          if (insertError) throw new Error("Failed to create profile: " + insertError.message);
          insertedUser = inserted;
      } else {
          // If Supabase Auth failed but we still want to let them in (custom sign up)
          const { data: inserted, error: insertError } = await supabase.from('users').insert({
              unique_id: generateUniqueId(),
              username: name || emailLower.split('@')[0],
              email: emailLower,
              password: pass,
              balance: 1000,
              is_admin: emailLower === 'honeyaamir23@gmail.com'
          }).select('*').single();
          if (insertError) throw new Error("Failed to create profile: " + insertError.message);
          insertedUser = inserted;
      }
      
      if (insertedUser) {
          setAuthUserId(insertedUser.id);
          localStorage.setItem('customAuthUserId', insertedUser.id);
      }
  };

  const logoutUser = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('customAuthUserId');
      setAuthUserId(null);
      setCurrentUser(null);
  };

  const vote = async (battleId: string, targetPlayerId: string, isPaid: boolean = false) => {
    if (!currentUser) return toast.error("Must be logged in.");
    const battle = state.battles.find(b => b.id === battleId);
    if (!battle) return;

    const isDemo = battle.type === 'ADMIN' || battle.type === 'DISPLAY';
    let cost = isPaid ? 10 : 0;

    // Backup current state for potential rollback
    const prevBattles = state.battles;
    const prevUser = currentUser;

    // Optimistically update votes immediately for lag-free performance
    setState(prev => ({
       ...prev,
       battles: prev.battles.map(b => {
          if (b.id !== battleId) return b;
          return {
             ...b,
             player1Votes: targetPlayerId === b.player1Id ? b.player1Votes + 1 : b.player1Votes,
             player2Votes: targetPlayerId === b.player2Id ? b.player2Votes + 1 : b.player2Votes,
          };
       })
    }));

    if (isPaid && !isDemo) {
       setCurrentUser(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - cost) } : null);
    }

    try {
      // Admin direct bypass to allow unlimited real-time clicking of votes
      if (currentUser.is_admin) {
        if (targetPlayerId === battle.player1Id) {
            const { error } = await supabase.rpc('increment_player1_votes', { row_id: battle.id });
            if (error) throw error;
        } else if (targetPlayerId === battle.player2Id) {
            const { error } = await supabase.rpc('increment_player2_votes', { row_id: battle.id });
            if (error) throw error;
        }
        return;
      }

      if (!isPaid) {
         const { data: existingFreeVote, error: checkError } = await supabase.from('transactions')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('type', `FREE_VOTE_${battleId}`)
            .maybeSingle();

         if (checkError) throw checkError;
         if (existingFreeVote) {
             // Rollback optimistic update
             setState(prev => ({ ...prev, battles: prevBattles }));
             setCurrentUser(prevUser);
             return toast.error("You have already used your free vote for this battle.");
         }
      }
      
      if (isPaid && !isDemo) {
         const { data: userData, error: userError } = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
         if (userError) throw userError;
         if (!userData || userData.balance < cost) {
            // Rollback optimistic update
            setState(prev => ({ ...prev, battles: prevBattles }));
            setCurrentUser(prevUser);
            return toast.error("Insufficient balance");
         }
      }

      if (isPaid && !isDemo) {
         const { error: deductionError } = await supabase.rpc('increment_balance', { row_id: currentUser.id, amount: -cost });
         if (deductionError) throw deductionError;

         const { error: txError } = await supabase.from('transactions').insert({ type: `PAID_VOTE_${battleId}`, amount: -cost, user_id: currentUser.id, date: Date.now() });
         if (txError) throw txError;
         
         const admin = state.users.find(u => u.is_admin);
         if (admin) {
             const { error: adminError } = await supabase.rpc('increment_balance', { row_id: admin.id, amount: cost });
             if (adminError) throw adminError;
         }
      } else if (!isPaid && !isDemo) {
         const { error: txError } = await supabase.from('transactions').insert({ type: `FREE_VOTE_${battleId}`, amount: 0, user_id: currentUser.id, date: Date.now() });
         if (txError) throw txError;
      }

      if (targetPlayerId === battle.player1Id) {
          const { error } = await supabase.rpc('increment_player1_votes', { row_id: battle.id });
          if (error) throw error;
      } else if (targetPlayerId === battle.player2Id) {
          const { error } = await supabase.rpc('increment_player2_votes', { row_id: battle.id });
          if (error) throw error;
      }
      
      const { data: updatedUser, error: updateError } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
      if (updateError) throw updateError;
      if (updatedUser) setCurrentUser(mapUser(updatedUser));
    } catch (err: any) {
      console.error("Database error during vote operation:", err);
      // Rollback optimistic update
      setState(prev => ({ ...prev, battles: prevBattles }));
      setCurrentUser(prevUser);
      toast.error(`Transaction failed: ${err.message || 'database error'}`);
    }
  };

  const createBattle = async (battleData: any) => {
    if (!currentUser) return;
    try {
      const { data: userData, error: userError } = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
      if (userError) throw userError;
      if (!userData || userData.balance < battleData.stake) {
         return toast.error("Insufficient balance to challenge");
      }

      const { error: deductionError } = await supabase.rpc('increment_balance', { row_id: currentUser.id, amount: -battleData.stake });
      if (deductionError) throw deductionError;

      const results = await Promise.all([
        supabase.from('transactions').insert({ type: 'BATTLE_STAKE', amount: -battleData.stake, user_id: currentUser.id, date: Date.now() }),
        supabase.from('notifications').insert({ user_id: currentUser.id, message: `You created a battle and staked ${battleData.stake} VTX.`, type: 'BATTLE_CREATED', created_at: Date.now() }),
        supabase.from('battles').insert({
            ...battleData,
            player1_id: currentUser.id,
            player1_votes: 0,
            player2_votes: 0,
            status: "LIVE",
            created_at: Date.now()
        })
      ]);

      for (const res of results) {
         if (res.error) throw res.error;
      }
      
      const { data: updatedUser, error: updateError } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
      if (updateError) throw updateError;
      if (updatedUser) setCurrentUser(mapUser(updatedUser));
    } catch (err: any) {
      console.error("Database error during createBattle:", err);
      toast.error(`Failed to create battle: ${err.message || 'database error'}`);
    }
  };

  const startChallengeBattle = async (challengeId: string) => {
    if (!currentUser) return;
    try {
      const { data: challengeData, error: challengeErr } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
      if (challengeErr) throw challengeErr;
      if (!challengeData) throw new Error("Challenge not found.");
      if (challengeData.status !== 'PENDING') throw new Error("Challenge already processed.");
      
      const { sender_id, receiver_id, stake, type, duration_ms } = challengeData;
      if (receiver_id !== currentUser.id) throw new Error("Unauthorized");

      // Atomically update challenge to ACCEPTED first so no other concurrent click can trigger a double deduction!
      const { data: updatedChallenge, error: acceptError } = await supabase
         .from('challenges')
         .update({ status: 'ACCEPTED' })
         .eq('id', challengeId)
         .eq('status', 'PENDING')
         .select();

      if (acceptError) throw acceptError;
      if (!updatedChallenge || updatedChallenge.length === 0) {
         throw new Error("Challenge already accepted or aborted by another request.");
      }

      const { data: p1Data, error: p1DataErr } = await supabase.from('users').select('balance').eq('id', sender_id).single();
      if (p1DataErr) throw p1DataErr;
      if (!p1Data || p1Data.balance < stake) {
         // Revert challenge status
         await supabase.from('challenges').update({ status: 'PENDING' }).eq('id', challengeId);
         throw new Error("Opponent has insufficient balance.");
      }

      const { data: p2Data, error: p2DataErr } = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
      if (p2DataErr) throw p2DataErr;
      if (!p2Data || p2Data.balance < stake) {
         // Revert challenge status
         await supabase.from('challenges').update({ status: 'PENDING' }).eq('id', challengeId);
         throw new Error("You have insufficient balance.");
      }

      const { error: p2Error } = await supabase.rpc('increment_balance', { row_id: currentUser.id, amount: -stake });
      if (p2Error) {
         await supabase.from('challenges').update({ status: 'PENDING' }).eq('id', challengeId);
         throw new Error("Failed to deduct your balance.");
      }

      const { error: p1Error } = await supabase.rpc('increment_balance', { row_id: sender_id, amount: -stake });
      if (p1Error) {
         await supabase.rpc('increment_balance', { row_id: currentUser.id, amount: stake });
         await supabase.from('challenges').update({ status: 'PENDING' }).eq('id', challengeId);
         throw new Error("Failed to deduct opponent balance.");
      }

      const results = await Promise.all([
         supabase.from('transactions').insert({ type: 'BATTLE_STAKE', amount: -stake, user_id: currentUser.id, date: Date.now() }),
         supabase.from('transactions').insert({ type: 'BATTLE_STAKE', amount: -stake, user_id: sender_id, date: Date.now() }),
         supabase.from('battles').insert({
             player1_id: sender_id,
             player2_id: currentUser.id,
             stake: stake,
             pot: stake * 2,
             type: type,
             player1_votes: 0,
             player2_votes: 0,
             status: "LIVE",
             created_at: Date.now(),
             duration_ms: duration_ms
         })
      ]);

      for (const res of results) {
         if (res.error) throw res.error;
      }
      
      const { data: updatedUser, error: uError } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
      if (uError) throw uError;
      if (updatedUser) setCurrentUser(mapUser(updatedUser));
    } catch (err: any) {
      console.error("Database error during startChallengeBattle:", err);
      toast.error(err.message || "Failed to accept challenge.");
      throw err;
    }
  };

  const updateChallenge = async (challengeId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const { error } = await supabase.from('challenges').update({ status }).eq('id', challengeId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Error updating challenge status:", err);
      toast.error("Failed to update challenge.");
    }
  };

  const sendChallenge = async (receiverUniqueId: string, stake: number, type: string, durationMs: number) => {
    if (!currentUser) return;
    try {
      const { data: senderData, error: sErr } = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
      if (sErr) throw sErr;
      if (!senderData || senderData.balance < stake) {
         throw new Error("You have insufficient balance.");
      }

      const { data: receiver, error: rErr } = await supabase.from('users').select('id, balance').eq('unique_id', receiverUniqueId).single();
      if (rErr) throw rErr;
      if (!receiver) {
         throw new Error("User with this Unique ID not found.");
      }
      if (receiver.id === currentUser.id) {
         throw new Error("You cannot challenge yourself.");
      }
      if (receiver.balance < stake) {
         throw new Error("Opponent has insufficient balance.");
      }
      
      const { data: existing, error: eErr } = await supabase.from('challenges')
          .select('id')
          .eq('status', 'PENDING')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${currentUser.id})`)
          .maybeSingle();
      
      if (eErr) throw eErr;
      if (existing) {
         throw new Error("A pending challenge already exists between you.");
      }

      const { error: insErr } = await supabase.from('challenges').insert({
         sender_id: currentUser.id,
         receiver_id: receiver.id,
         stake,
         type,
         duration_ms: durationMs,
         status: 'PENDING',
         created_at: Date.now()
      });
      if (insErr) throw insErr;
    } catch (err: any) {
      console.error("Database error in sendChallenge:", err);
      toast.error(err.message || "Failed to send challenge.");
      throw err;
    }
  };

  const submitDeposit = async (amount: number, receiptUrl: string, transactionId: string) => {
    if (!currentUser) return;
    await Promise.all([
      supabase.from('deposits').insert({
        user_id: currentUser.id,
        amount,
        receipt_url: receiptUrl,
        transaction_id: transactionId,
        status: 'PENDING',
        timestamp: Date.now()
      }),
      supabase.from('notifications').insert({
        user_id: currentUser.id,
        message: `Your deposit request for ${amount} VTX has been submitted and is pending admin approval.`,
        type: 'DEPOSIT_PENDING',
        created_at: Date.now()
      })
    ]);
  };

  const adminAction = async (type: string, payload: any) => {
     if (!currentUser?.is_admin) return;

     try {
         if (type === 'APPROVE_DEPOSIT' || type === 'REJECT_DEPOSIT') {
             const { data: req, error: reqErr } = await supabase.from('deposits').select('*').eq('id', payload.requestId).single();
             if (reqErr || !req) throw new Error("Deposit request not found.");
             if (req.status !== 'PENDING') throw new Error("Deposit session has already been processed.");

             if (type === 'APPROVE_DEPOSIT') {
                 const { error: updateStatusErr } = await supabase.from('deposits').update({ status: 'APPROVED' }).eq('id', req.id);
                 if (updateStatusErr) throw updateStatusErr;
                 
                 const depositAmount = Number(payload.amount || req.amount || 0);
                 if (req.user_id && depositAmount > 0) {
                     const { error: incErr } = await supabase.rpc('increment_balance', { row_id: req.user_id, amount: depositAmount });
                     if (incErr) throw incErr;
                     const { error: txErr } = await supabase.from('transactions').insert({ type: 'DEPOSIT', amount: depositAmount, user_id: req.user_id, date: Date.now() });
                     if (txErr) throw txErr;
                     const { error: notifErr } = await supabase.from('notifications').insert({ user_id: req.user_id, message: `Your deposit of ${depositAmount} VTX has been approved.`, type: 'DEPOSIT_APPROVED', created_at: Date.now() });
                     if (notifErr) throw notifErr;
                 }
                 toast.success("Deposit approved successfully!");
             } else if (type === 'REJECT_DEPOSIT') {
                 const { error: updateStatusErr } = await supabase.from('deposits').update({ status: 'REJECTED' }).eq('id', req.id);
                 if (updateStatusErr) throw updateStatusErr;
                 const { error: notifErr } = await supabase.from('notifications').insert({ user_id: req.user_id, message: `Your deposit request was rejected.`, type: 'DEPOSIT_REJECTED', created_at: Date.now() });
                 if (notifErr) throw notifErr;
                 toast.success("Deposit request rejected.");
             }
             return;
         }

         if (type === 'ADMIN_ADJUST_BALANCE') {
             const amountNum = Number(payload.amount);
             if (isNaN(amountNum)) throw new Error("Invalid transfer amount");
             const { error: incErr } = await supabase.rpc('increment_balance', { row_id: payload.userId, amount: amountNum });
             if (incErr) throw incErr;
             const { error: txErr } = await supabase.from('transactions').insert({ type: 'ADMIN_ADJUSTMENT', amount: amountNum, user_id: payload.userId, date: Date.now() });
             if (txErr) throw txErr;
             const { error: notifErr } = await supabase.from('notifications').insert({ user_id: payload.userId, message: `Admin adjusted your balance by ${amountNum} VTX.`, type: 'ADMIN_ADJUSTMENT', created_at: Date.now() });
             if (notifErr) throw notifErr;
             toast.success("Balance adjusted successfully!");
             return;
         }

         if (type === 'CREATE_BOT') {
             const { error: insertErr } = await supabase.from('users').insert({
                unique_id: `bot_${Math.random().toString(36).substr(2, 9)}`,
                username: payload.name,
                email: `bot_${Date.now()}@bot.local`,
                password: 'bot_password',
                balance: 0,
                is_admin: false
             });
             if (insertErr) throw insertErr;
             toast.success("Bot created successfully!");
             return;
         }

         if (type === 'CREATE_ADMIN_BATTLE') {
             const duration = payload.type === 'QUICK' ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000;
             const { error: insertErr } = await supabase.from('battles').insert({
                 player1_id: payload.player1Id,
                 player2_id: payload.player2Id,
                 stake: payload.stake,
                 pot: payload.stake * 2,
                 status: 'LIVE',
                 type: 'ADMIN',
                 duration_ms: duration,
                 created_at: Date.now(),
                 player1_votes: payload.p1Votes || 0,
                 player2_votes: payload.p2Votes || 0
             });
             if (insertErr) throw insertErr;
             toast.success("Admin battle created!");
             return;
         }

         if (type === 'CANCEL_BATTLE') {
             const { error: cancelErr } = await supabase.from('battles').update({ status: 'CANCELLED' }).eq('id', payload.battleId);
             if (cancelErr) throw cancelErr;
             toast.success("Battle cancelled successfully.");
             return;
         }

         if (type === 'ADMIN_UPDATE_BATTLE_VOTES') {
             const { error: updateErr } = await supabase.from('battles').update({
                 player1_votes: Number(payload.player1Votes),
                 player2_votes: Number(payload.player2Votes)
             }).eq('id', payload.battleId);
             if (updateErr) throw updateErr;
             return;
         }

         if (type === 'UPDATE_SETTINGS') {
            const settingsJson = {
               paymentConfig: payload.paymentConfig,
               platformFeePercent: payload.platformFeePercent,
               minWithdrawal: payload.minWithdrawal,
               maxWithdrawal: payload.maxWithdrawal,
               quickStakes: payload.quickStakes,
               grandStakes: payload.grandStakes,
               signupBonus: payload.signupBonus,
               enableQuickBattles: payload.enableQuickBattles,
               enableGrandBattles: payload.enableGrandBattles
            };
            const updateData: any = {
               deposit_account_number: payload.depositAccountNumber,
               deposit_iban: JSON.stringify(settingsJson)
            };

            if (payload.depositLink !== undefined) {
                 updateData.deposit_link = payload.depositLink;
            }

            const { error: updateErr } = await supabase.from('stats').update(updateData).eq('id', 'global');
            if (updateErr) throw updateErr;
            toast.success("Settings updated successfully!");
            return;
         }

         if (type === 'RESOLVE_TICKET') {
            const { error } = await supabase.from('pending_requests').update({ status: 'RESOLVED' }).eq('id', payload.ticketId);
            if (error) throw error;
            
            // Notify user
            const reqState = state.pendingRequests.find(r => r.id === payload.ticketId);
            if (reqState) {
                await supabase.from('notifications').insert({ user_id: reqState.userId, message: `Your support ticket has been reviewed and resolved by an Admin.`, type: 'TICKET_RESOLVED', created_at: Date.now() });
            }
            toast.success("Ticket marked as resolved");
            return;
         }

         const { data: req, error: reqErr } = await supabase.from('pending_requests').select('*').eq('id', payload.requestId).single();
         if (reqErr || !req) throw new Error("Pending withdrawal request not found.");
         if (req.status !== 'PENDING') throw new Error("Request already processed.");

         if (type === 'APPROVE_WITHDRAWAL') {
             if (req.user_id) {
                 const { error: updateStatusErr } = await supabase.from('pending_requests').update({ status: 'PAID' }).eq('id', req.id);
                 if (updateStatusErr) throw updateStatusErr;
                 
                 const { error: txErr } = await supabase.from('transactions').insert({ type: 'WITHDRAWAL', amount: -Number(req.amount), user_id: req.user_id, date: Date.now() });
                 if (txErr) throw txErr;
                 const { error: notifErr } = await supabase.from('notifications').insert({ user_id: req.user_id, message: `Your withdrawal of ${req.amount} VTX has been paid.`, type: 'WITHDRAWAL_APPROVED', created_at: Date.now() });
                 if (notifErr) throw notifErr;
                 toast.success("Withdrawal approved and marked as paid.");
             }
         } else if (type === 'REJECT_WITHDRAWAL') {
             const { error: updateStatusErr } = await supabase.from('pending_requests').update({ status: 'REJECTED' }).eq('id', req.id);
             if (updateStatusErr) throw updateStatusErr;
             
             // Refund
             const { error: incErr } = await supabase.rpc('increment_balance', { row_id: req.user_id, amount: Number(req.amount) });
             if (incErr) throw incErr;
             
             const { error: notifErr } = await supabase.from('notifications').insert({ user_id: req.user_id, message: `Your withdrawal request was rejected. ${req.amount} VTX refunded.`, type: 'WITHDRAWAL_REJECTED', created_at: Date.now() });
             if (notifErr) throw notifErr;
             toast.success("Withdrawal rejected; funds refunded safely.");
         }
     } catch (err: any) {
         console.error("Admin action failed:", err);
         toast.error(err.message || "Failed to execute administrative action safely.");
     }
  };

  const userRequest = async (type: string, payload: any) => {
    if (!currentUser) return;
    
    try {
        if (type === 'MARK_NOTIFICATIONS_READ') {
            const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.id).eq('read', false);
            if (error) throw error;
            return;
        }
        if (type === 'MARK_BATTLE_NOTIFIED') {
            const { error } = await supabase.from('battles').update({ notified: true }).eq('id', payload.battleId);
            if (error) throw error;
            return;
        }
        if (type === 'SEND_GIFT') {
            const amount = Number(payload.amount);
            if (isNaN(amount) || amount <= 0) throw new Error("Invalid gift amount.");

            // Perform dynamic database read to prevent front-end manipulation / stale state
            const { data: userData, error: userLookupError } = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
            if (userLookupError || !userData) throw new Error("Failed to verify sender account balance.");
            if (userData.balance < amount) throw new Error("Insufficient VTX balance to send this gift.");

            const { error: deductionError } = await supabase.rpc('increment_balance', { row_id: currentUser.id, amount: -amount });
            if (deductionError) throw new Error("Deduction failed: " + deductionError.message);

            const results = await Promise.all([
                supabase.rpc('increment_balance', { row_id: payload.targetUserId, amount: amount }),
                supabase.from('transactions').insert({ type: 'GIFT_SENT', amount: -amount, user_id: currentUser.id, date: Date.now() }),
                supabase.from('transactions').insert({ type: 'GIFT_RECEIVED', amount: amount, user_id: payload.targetUserId, date: Date.now() }),
                supabase.from('notifications').insert({ user_id: payload.targetUserId, message: `You received a gift of ${amount} VTX from @${currentUser.username}.`, type: 'GIFT_RECEIVED', created_at: Date.now() })
            ]);
            
            for (const res of results) {
               if (res.error) throw res.error;
            }
            
            const { data: updatedUser } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
            if (updatedUser) setCurrentUser(mapUser(updatedUser));
            
            toast.success(`Sent ${amount} VTX successfully!`);
            return;
        }

        if (type === 'SUBMIT_SUPPORT_TICKET') {
            const { error } = await supabase.from('pending_requests').insert({
                type: 'SUPPORT_TICKET',
                user_id: currentUser.id,
                amount: 0,
                easypaisa_number: payload.message, // reusing this field for message
                status: 'PENDING',
                date: Date.now()
            });
            if (error) throw error;
            toast.success("Support ticket submitted successfully.");
            return;
        }

        if (type === 'SUBMIT_TID_DEPOSIT') {
            const results = await Promise.all([
               supabase.from('deposits').insert({
                   user_id: currentUser.id,
                   amount: payload.amount,
                   transaction_id: payload.transactionId,
                   status: 'PENDING',
                   timestamp: Date.now()
               }),
               supabase.from('notifications').insert({ user_id: currentUser.id, message: `Your deposit (TID: ${payload.transactionId}) for ${payload.amount} VTX is pending approval.`, type: 'DEPOSIT_PENDING', created_at: Date.now() })
            ]);
            for (const res of results) {
               if (res.error) throw res.error;
            }
            toast.success("Deposit TID submitted successfully.");
            return;
        }
        if (type === 'REQUEST_DEPOSIT') {
            const results = await Promise.all([
               supabase.from('pending_requests').insert({
                   type: 'DEPOSIT', user_id: currentUser.id, amount: payload.amount, status: 'PENDING', date: Date.now()
               }),
               supabase.from('notifications').insert({ user_id: currentUser.id, message: `Your deposit request for ${payload.amount} VTX is pending.`, type: 'DEPOSIT_PENDING', created_at: Date.now() })
            ]);
            for (const res of results) {
               if (res.error) throw res.error;
            }
            toast.success("Deposit requested successfully!");
        } else if (type === 'REQUEST_WITHDRAWAL') {
            // Fetch fresh user balance from database
            const { data: userData, error: userLookupError } = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
            if (userLookupError || !userData) throw new Error("Failed to verify balance details.");
            if (userData.balance < payload.amount) {
               throw new Error("Insufficient balance to request withdrawal.");
            }
            
            // Check limits
            const minAmount = state.platformStats.minWithdrawal || 500;
            const maxAmount = state.platformStats.maxWithdrawal || 50000;
            if (payload.amount < minAmount || payload.amount > maxAmount) {
               throw new Error(`Withdrawal must be between ${minAmount} and ${maxAmount} VTX Coins`);
            }

            // Deduct from balance atomically via RPC increment_balance
            const { error: deductionError } = await supabase.rpc('increment_balance', { row_id: currentUser.id, amount: -payload.amount });
            if (deductionError) throw new Error("Failed to deduct withdrawal funds: " + deductionError.message);

            const results = await Promise.all([
               supabase.from('pending_requests').insert({
                  type: 'WITHDRAWAL', user_id: currentUser.id, amount: payload.amount, easypaisa_number: payload.easypaisaNumber, status: 'PENDING', date: Date.now()
               }),
               supabase.from('notifications').insert({ user_id: currentUser.id, message: `Your withdrawal request for ${payload.amount} VTX has been submitted.`, type: 'WITHDRAWAL_PENDING', created_at: Date.now() })
            ]);
            for (const res of results) {
               if (res.error) throw res.error;
            }
            
            const { data: updatedUser } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
            if (updatedUser) setCurrentUser(mapUser(updatedUser));

            toast.success("Withdrawal requested");
        }
    } catch (err: any) {
        console.error("User request error:", err);
        toast.error(err.message || "Failed to process the request safely.");
    }
  };

  return (
    <GameContext.Provider value={{ state, currentUser, isAuthLoading: isInitializing, globalError, vote, createBattle, sendChallenge, updateChallenge, startChallengeBattle, submitDeposit, adminAction, userRequest, loginWithEmail, signupWithEmail, resetPassword, logoutUser }}>
       {isInitializing && !currentUser ? (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#050505] p-6 text-center text-white select-none relative overflow-hidden font-sans">
             {/* Glowing orb animations */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#10B981]/15 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
             
             <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                {/* Brand title */}
                <h1 className="text-4xl sm:text-5xl font-black tracking-widest flex items-center gap-1.5 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                   <span className="text-yellow-400">VO</span>
                   <span className="text-[#10B981]">TEX</span>
                </h1>
                
                {/* Professional Loading Spinner */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                   <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-[#10B981] animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                </div>

                <div className="space-y-1.5">
                   <p className="text-sm font-bold text-gray-300 uppercase tracking-widest animate-pulse">Loading Votex...</p>
                   <p className="text-[10px] text-gray-500 font-medium">Connecting to competitive network</p>
                </div>
             </div>
          </div>
       ) : children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
