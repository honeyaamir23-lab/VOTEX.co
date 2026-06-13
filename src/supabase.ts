import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

const isValidSupabase = supabaseUrl && supabaseUrl.startsWith('http');

const realtimeSubscribers = new Set<() => void>();

function triggerRealtime() {
  realtimeSubscribers.forEach(cb => {
     try {
       cb();
     } catch (e) {
       console.error("Realtime callback error:", e);
     }
  });
}

function getInitialSeedData(table: string): any[] {
  const now = Date.now();
  if (table === 'users') {
    return [
      {
         id: 'admin-id-123',
         unique_id: '999999',
         username: 'Honey_Aamir',
         email: 'honeyaamir23@gmail.com',
         password: 'adminpassword',
         balance: 1000000,
         is_admin: true,
         is_bot: false
      },
      {
         id: 'user-id-1',
         unique_id: '111111',
         username: 'VortexLeader',
         email: 'user1@vtx.com',
         password: 'password123',
         balance: 12500,
         is_admin: false,
         is_bot: false
      },
      {
         id: 'user-id-2',
         unique_id: '222222',
         username: 'AlphaBet',
         email: 'user2@vtx.com',
         password: 'password123',
         balance: 800,
         is_admin: false,
         is_bot: false
      },
      {
         id: 'user-id-3',
         unique_id: '333333',
         username: 'Ludo_Champ',
         email: 'user3@vtx.com',
         password: 'password123',
         balance: 5500,
         is_admin: false,
         is_bot: false
      },
      {
         id: 'bot-1',
         unique_id: 'bot_alpha',
         username: 'VortexSniper',
         email: 'bot1@vtx.com',
         password: 'password123',
         balance: 50000,
         is_admin: false,
         is_bot: true
      },
      {
         id: 'bot-2',
         unique_id: 'bot_gamma',
         username: 'CoinMaster',
         email: 'bot2@vtx.com',
         password: 'password123',
         balance: 75000,
         is_admin: false,
         is_bot: true
      },
      {
         id: 'bot-3',
         unique_id: 'bot_apex',
         username: 'VTX_Beast',
         email: 'bot3@vtx.com',
         password: 'password123',
         balance: 120000,
         is_admin: false,
         is_bot: true
      }
    ];
  }
  if (table === 'stats') {
    return [
      {
        id: 'global',
        total_commission: 24500,
        active_battles: 1,
        pending_deposits: 1,
        pending_withdrawals: 0,
        deposit_account_number: '03001234567',
        deposit_link: 'https://sadapay.pk',
        deposit_iban: JSON.stringify({
            paymentConfig: {
                easypaisa: { iban: 'PK23EP0000003001234567', deepLink: 'https://easypaisa.com.pk', qrUrl: '' },
                sadapay: { iban: 'PK78SP0000003007654321', deepLink: 'https://sadapay.pk', qrUrl: '' },
                jazzcash: { iban: 'PK45JC0000003001122334', deepLink: '', qrUrl: '' }
            },
            platformFeePercent: 10,
            minWithdrawal: 500,
            maxWithdrawal: 50000,
            quickStakes: '500,1000,2000,5000',
            grandStakes: '10000,25000,50000,100000',
            enableQuickBattles: true,
            enableGrandBattles: true,
            signupBonus: 20
        }),
        platform_fee_percent: 10,
        min_withdrawal: 500,
        max_withdrawal: 50000
      }
    ];
  }
  if (table === 'battles') {
    return [
      {
        id: 'battle-live-1',
        player1_id: 'bot-1',
        player2_id: 'bot-2',
        player1_votes: 112,
        player2_votes: 138,
        stake: 1000,
        pot: 2000,
        status: 'LIVE',
        type: 'DISPLAY',
        created_at: now - 30000,
        duration_ms: 300000,
        winner_id: null,
        notified: false
      },
      {
        id: 'battle-completed-1',
        player1_id: 'user-id-1',
        player2_id: 'bot-3',
        player1_votes: 245,
        player2_votes: 180,
        stake: 2000,
        pot: 4000,
        status: 'COMPLETED',
        type: 'STAKE',
        created_at: now - 3600000,
        duration_ms: 600000,
        winner_id: 'user-id-1',
        notified: true
      }
    ];
  }
  if (table === 'transactions') {
    return [
      {
        id: 'trans-1',
        user_id: 'user-id-1',
        type: 'SIGNUP_BONUS',
        amount: 1000,
        date: now - 86400000
      },
      {
        id: 'trans-2',
        user_id: 'user-id-1',
        type: 'BATTLE_WIN',
        amount: 3600,
        date: now - 3600000
      }
    ];
  }
  if (table === 'challenges') {
    return [
      {
        id: 'challenge-1',
        sender_id: 'bot-1',
        receiver_id: 'user-id-1',
        status: 'PENDING',
        stake: 1000,
        type: 'STAKE',
        duration_ms: 300000,
        created_at: now - 60000
      }
    ];
  }
  if (table === 'deposits') {
    return [
      {
        id: 'deposit-1',
        user_id: 'user-id-2',
        amount: 5000,
        receipt_url: 'https://placehold.co/600x400/131823/ffffff?text=E-Receipt',
        transaction_id: 'TXN88392102',
        status: 'PENDING',
        timestamp: now - 1800000
      }
    ];
  }
  if (table === 'pending_requests') {
    return [
      {
        id: 'req-1',
        type: 'DEPOSIT',
        user_id: 'user-id-2',
        amount: 5000,
        status: 'PENDING',
        easypaisa_number: '03112233445',
        date: now - 1800000
      }
    ];
  }
  if (table === 'notifications') {
    return [
      {
        id: 'notif-1',
        user_id: 'user-id-1',
        message: 'Welcome to Vortex Gaming! Your signup bonus has been credited.',
        type: 'WELCOME',
        read: false,
        created_at: now - 86400000
      }
    ];
  }
  return [];
}

class MockBuilder {
  table: string;
  filters: Array<(item: any) => boolean> = [];
  updateData: any = null;
  insertData: any = null;
  orderField: string = '';
  selectFields: string = '*';
  isSingle: boolean = false;
  isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push(item => item[field] === value);
    return this;
  }

  or(query: string) {
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    this.orderField = field;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async then(onfulfilled?: any, onrejected?: any) {
    const result = this.execute();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }

  execute() {
    const dataKey = `mock_sb_${this.table}`;
    let list: any[] = [];
    try {
      const stored = localStorage.getItem(dataKey);
      if (stored) {
        list = JSON.parse(stored);
      } else {
        list = getInitialSeedData(this.table);
        localStorage.setItem(dataKey, JSON.stringify(list));
      }
    } catch (e) {
      list = [];
    }

    let filtered = [...list];
    for (const f of this.filters) {
      filtered = filtered.filter(f);
    }

    if (this.insertData) {
      const recordsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const newRecords = recordsToInsert.map(r => ({
        id: r.id || Math.random().toString(36).substring(2, 11),
        created_at: r.created_at || Date.now(),
        ...r
      }));
      list.push(...newRecords);
      localStorage.setItem(dataKey, JSON.stringify(list));
      filtered = newRecords;
      triggerRealtime();
    }

    if (this.updateData) {
      list = list.map(item => {
        let matches = true;
        for (const f of this.filters) {
          if (!f(item)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return { ...item, ...this.updateData };
        }
        return item;
      });
      localStorage.setItem(dataKey, JSON.stringify(list));
      
      filtered = list.filter(item => {
        let matches = true;
        for (const f of this.filters) {
          if (!f(item)) {
            matches = false;
            break;
          }
        }
        return matches;
      });
      triggerRealtime();
    }

    if (this.orderField) {
      filtered.sort((a, b) => {
        const valA = a[this.orderField];
        const valB = b[this.orderField];
        if (valA < valB) return 1; // Sort descending by default
        if (valA > valB) return -1;
        return 0;
      });
    }

    let data: any = filtered;
    if (this.isSingle || this.isMaybeSingle) {
      data = filtered[0] || null;
    }

    return { data, error: null };
  }
}

class MockChannel {
  name: string;
  callbacks: Array<() => void> = [];

  constructor(name: string) {
    this.name = name;
  }

  on(event: string, filter: any, callback: () => void) {
    this.callbacks.push(callback);
    realtimeSubscribers.add(callback);
    return this;
  }

  subscribe() {
    return this;
  }
}

const authStateListeners = new Set<(event: string, session: any) => void>();

class MockSupabaseClient {
  auth = {
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      authStateListeners.add(callback);
      
      // Trigger with current session immediately
      const sessionUser = this.getCurrentSessionUser();
      if (sessionUser) {
        setTimeout(() => callback('SIGNED_IN', { user: sessionUser }), 0);
      } else {
        setTimeout(() => callback('SIGNED_OUT', null), 0);
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authStateListeners.delete(callback);
            }
          }
        }
      };
    },

    getSession: async () => {
      const sessionUser = this.getCurrentSessionUser();
      return {
        data: {
          session: sessionUser ? { user: sessionUser } : null
        },
        error: null
      };
    },

    signUp: async ({ email, password, options }: any) => {
      const emailLower = email.toLowerCase();
      const usersKey = 'mock_sb_users';
      let users: any[] = [];
      try {
        const stored = localStorage.getItem(usersKey);
        users = stored ? JSON.parse(stored) : getInitialSeedData('users');
      } catch {
        users = getInitialSeedData('users');
      }

      if (users.some(u => u.email === emailLower)) {
        return { data: { user: null }, error: { message: "User already exists with this email" } };
      }

      const id = 'mock-user-' + Math.random().toString(36).substring(2, 11);
      const username = options?.data?.username || emailLower.split('@')[0];
      const newUser = {
        id,
        unique_id: Math.floor(100000 + Math.random() * 900000).toString(),
        username,
        email: emailLower,
        password,
        balance: (() => {
          let bonus = 20;
          try {
            const storedStats = localStorage.getItem('mock_sb_stats');
            if (storedStats) {
              const list = JSON.parse(storedStats);
              const globalS = list.find((s: any) => s.id === 'global');
              if (globalS) {
                const parsed = JSON.parse(globalS.deposit_iban);
                bonus = parsed.signupBonus ?? globalS.signup_bonus ?? 20;
              }
            }
          } catch {}
          return bonus;
        })(),
        is_admin: emailLower === 'honeyaamir23@gmail.com',
        is_bot: false
      };

      users.push(newUser);
      localStorage.setItem(usersKey, JSON.stringify(users));

      // Auto sign-in
      localStorage.setItem('mock_sb_session_user_id', id);
      localStorage.setItem('customAuthUserId', id);

      // Notify auth listeners
      authStateListeners.forEach(cb => cb('SIGNED_IN', { user: newUser }));
      triggerRealtime();

      return { data: { user: newUser }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      const emailLower = email.toLowerCase();
      const usersKey = 'mock_sb_users';
      let users: any[] = [];
      try {
        const stored = localStorage.getItem(usersKey);
        users = stored ? JSON.parse(stored) : getInitialSeedData('users');
      } catch {
        users = getInitialSeedData('users');
      }

      let user = users.find(u => u.email === emailLower);

      // Seed admin user on-the-fly with the standard password if missing
      if (!user && emailLower === 'honeyaamir23@gmail.com') {
         // Create admin user on-the-fly
         user = {
            id: 'admin-id-123',
            unique_id: '999999',
            username: 'Honey_Aamir',
            email: emailLower,
            password: 'adminpassword',
            balance: 1000000,
            is_admin: true,
            is_bot: false
         };
         users.push(user);
         localStorage.setItem(usersKey, JSON.stringify(users));
      }

      if (!user) {
         return { data: { user: null }, error: { message: "Account email not registered." } };
      }

      if (user.password !== password) {
         return { data: { user: null }, error: { message: "Invalid credentials/incorrect password." } };
      }

      // Save session
      localStorage.setItem('mock_sb_session_user_id', user.id);
      localStorage.setItem('customAuthUserId', user.id);

      // Notify auth listeners
      authStateListeners.forEach(cb => cb('SIGNED_IN', { user }));
      triggerRealtime();

      return { data: { user }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('mock_sb_session_user_id');
      localStorage.removeItem('customAuthUserId');
      authStateListeners.forEach(cb => cb('SIGNED_OUT', null));
      triggerRealtime();
      return { error: null };
    }
  };

  getCurrentSessionUser() {
    const id = localStorage.getItem('mock_sb_session_user_id');
    if (!id) return null;
    try {
      const stored = localStorage.getItem('mock_sb_users');
      const users = stored ? JSON.parse(stored) : getInitialSeedData('users');
      return users.find((u: any) => u.id === id) || null;
    } catch {
      return null;
    }
  }

  from(table: string) {
    return new MockBuilder(table);
  }

  channel(name: string) {
    return new MockChannel(name);
  }

  removeChannel(channel: any) {
    if (channel && channel.callbacks) {
      channel.callbacks.forEach((cb: () => void) => {
        realtimeSubscribers.delete(cb);
      });
    }
  }

  async rpc(func: string, params: any) {
    if (func === 'increment_balance') {
      const { row_id, amount } = params;
      const usersKey = 'mock_sb_users';
      let users: any[] = [];
      try {
        const stored = localStorage.getItem(usersKey);
        users = stored ? JSON.parse(stored) : getInitialSeedData('users');
      } catch {
        users = getInitialSeedData('users');
      }

      let updated = false;
      users = users.map(u => {
        if (u.id === row_id || u.unique_id === row_id) {
          updated = true;
          return { ...u, balance: Math.max(0, (u.balance || 0) + amount) };
        }
        return u;
      });

      if (updated) {
        localStorage.setItem(usersKey, JSON.stringify(users));
        triggerRealtime();
      }
      return { error: null };
    }
    
    if (func === 'increment_player1_votes' || func === 'increment_player2_votes') {
      const { row_id } = params;
      const battlesKey = 'mock_sb_battles';
      let battles: any[] = [];
      try {
        const stored = localStorage.getItem(battlesKey);
        battles = stored ? JSON.parse(stored) : getInitialSeedData('battles');
      } catch {
        battles = getInitialSeedData('battles');
      }

      let updated = false;
      battles = battles.map(b => {
        if (b.id === row_id) {
          updated = true;
          const voteField = func === 'increment_player1_votes' ? 'player1_votes' : 'player2_votes';
          return { ...b, [voteField]: (b[voteField] || 0) + 1 };
        }
        return b;
      });

      if (updated) {
        localStorage.setItem(battlesKey, JSON.stringify(battles));
        triggerRealtime();
      }
      return { error: null };
    }
    return { error: null };
  }
}

export const supabase: any = isValidSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new MockSupabaseClient();
