export interface BettingDataStore {
  parlays: {
    byId: Map<string, ParentBet>;
    byDate: Map<string, string[]>;     // Date -> Bet IDs
    bySport: Map<string, string[]>;    // Sport -> Bet IDs
    byYear: Map<number, string[]>;     // Year -> Bet IDs
    byMonth: Map<string, string[]>;    // YYYY-MM -> Bet IDs
    byTeam: Map<string, string[]>;     // Team -> Bet IDs
  };
  
  metadata: {
    dateRange: { start: Date; end: Date };
    sports: Set<string>;
    teams: Set<string>;
    players: Set<string>;
    propTypes: Set<string>;
    totalBets: number;
    totalWagered: number;
  };

  indices: {
    playerProps: Map<string, Set<string>>;  // Player -> Bet IDs
    propTypes: Map<string, Set<string>>;    // Prop Type -> Bet IDs
    odds: Map<string, Set<string>>;         // Odds Range -> Bet IDs
  };
}

export interface ParentBet {
  id: string;
  datePlaced: Date;
  sport: string;
  wager: number;
  potentialPayout: number;
  status: string;
  numberOfLegs: number;
  legs: BetLeg[];
  season?: string;
  tournament?: string;
}

export interface BetLeg {
  player: string;
  team: string;
  propType: string;
  line: string;
  odds: number;
  result: string;
  gameTime: Date;
  sport: string;
  league: string;
  market: string;
  betCategory: string;
}

export interface FilterOptions {
  dateRange?: { start: Date; end: Date };
  sports?: string[];
  teams?: string[];
  players?: string[];
  propTypes?: string[];
  oddsRange?: { min: number; max: number };
  wagerRange?: { min: number; max: number };
  result?: string[];
}

export interface QuickStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  profitLoss: number;
  winRate: number;
  averageOdds: number;
  mostBetSport: string;
  mostBetPlayer: string;
}

export interface DetailedStats {
  byMonth: MonthlyStats[];
  bySport: SportStats[];
  byPlayer: PlayerStats[];
  byPropType: PropTypeStats[];
  byOddsRange: OddsRangeStats[];
  streaks: StreakStats;
}

interface MonthlyStats {
  month: string;
  bets: number;
  wagered: number;
  won: number;
  profitLoss: number;
  winRate: number;
}

interface SportStats {
  sport: string;
  bets: number;
  wagered: number;
  won: number;
  profitLoss: number;
  winRate: number;
  averageOdds: number;
}

interface PlayerStats {
  player: string;
  sport: string;
  bets: number;
  wagered: number;
  won: number;
  profitLoss: number;
  winRate: number;
  propTypes: {
    type: string;
    bets: number;
    winRate: number;
  }[];
}

interface PropTypeStats {
  type: string;
  bets: number;
  wagered: number;
  won: number;
  profitLoss: number;
  winRate: number;
  averageOdds: number;
}

interface OddsRangeStats {
  range: string;
  bets: number;
  wagered: number;
  won: number;
  profitLoss: number;
  winRate: number;
}

interface StreakStats {
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  bestDay: string;
  worstDay: string;
}