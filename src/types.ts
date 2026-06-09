export interface TokenDetails {
  name: string;
  symbol: string;
  logoUrl: string;
  votes: number;
  color: string; // Tailwind color classes or hex code for themes
}

export type BattleType = 'quick' | 'grand';

export interface Battle {
  id: string;
  title: string;
  type: BattleType;
  contestantA: TokenDetails;
  contestantB: TokenDetails;
  totalVotes: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  category: string;
}

export interface UserProfile {
  email: string;
  balance: number; // in virtual coins
  votedBattles: {
    [battleId: string]: {
      hasVotedFree: boolean;
      paidVotesCount: number;
      votedFor: 'A' | 'B';
    };
  };
}

export interface VoteTransaction {
  id: string;
  email: string;
  battleId: string;
  battleTitle: string;
  votedFor: 'A' | 'B';
  tokenSymbol: string;
  voteType: 'free' | 'paid';
  cost: number;
  timestamp: string;
}

export interface AppState {
  battles: Battle[];
}
