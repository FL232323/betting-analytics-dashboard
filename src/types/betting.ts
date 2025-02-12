export interface Bet {
  datePlaced: Date;
  status: string;
  league: string;
  match: string;
  betType: string;
  market: string;
  price: number;
  wager: number;
  winnings: number;
  payout: number;
  potentialPayout: number;
  result: string;
  betSlipId: string;
}

export interface Metrics {
  totalBets: number;
  totalWagered: number;
  totalWinnings: number;
  profitLoss: number;
  winRate: number;
  leagueBreakdown: LeagueMetrics[];
  monthlyPerformance: MonthlyMetrics[];
}

export interface LeagueMetrics {
  league: string;
  totalBets: number;
  wagered: number;
  winnings: number;
  profitLoss: number;
}

export interface MonthlyMetrics {
  month: string;
  wagered: number;
  winnings: number;
  profitLoss: number;
  totalBets: number;
}