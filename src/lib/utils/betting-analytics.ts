import { Bet } from '@/types/betting';

export function calculateWinRate(bets: Bet[]): number {
  if (!bets.length) return 0;
  const wins = bets.filter(bet => bet.status === 'Won').length;
  return (wins / bets.length) * 100;
}

export function calculateROI(bets: Bet[]): number {
  if (!bets.length) return 0;
  const totalWagered = bets.reduce((sum, bet) => sum + bet.wager, 0);
  const totalReturned = bets.reduce((sum, bet) => sum + bet.actualPayout, 0);
  return ((totalReturned - totalWagered) / totalWagered) * 100;
}