export enum BetType {
  SINGLE = 'SINGLE',
  PARLAY = 'PARLAY'
}

export interface BetLeg {
  game: string;
  betType: string;
  market: string;
  odds: number;
  result: 'Win' | 'Lose';
}

export interface Bet {
  id: string;
  type: BetType;
  datePlaced: Date;
  status: 'Won' | 'Lost';
  wager: number;
  potentialPayout: number;
  actualPayout: number;
  legs: BetLeg[];
}