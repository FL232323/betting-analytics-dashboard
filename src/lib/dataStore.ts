import type { BettingDataStore, ParentBet, BetLeg } from '@/types/betting';

export const initializeDataStore = (): BettingDataStore => ({
  parlays: {
    byId: new Map(),
    byDate: new Map(),
    bySport: new Map(),
    byYear: new Map(),
    byMonth: new Map(),
    byTeam: new Map(),
  },
  metadata: {
    dateRange: { start: new Date(), end: new Date() },
    sports: new Set(),
    teams: new Set(),
    players: new Set(),
    propTypes: new Set(),
    totalBets: 0,
    totalWagered: 0,
  },
  indices: {
    playerProps: new Map(),
    propTypes: new Map(),
    odds: new Map(),
  },
});

export const updateStoreIndices = (store: BettingDataStore, bet: ParentBet) => {
  // Update date indices
  const dateStr = bet.datePlaced.toISOString().split('T')[0];
  const year = bet.datePlaced.getFullYear();
  const month = `${year}-${String(bet.datePlaced.getMonth() + 1).padStart(2, '0')}`;

  updateMapArray(store.parlays.byDate, dateStr, bet.id);
  updateMapArray(store.parlays.byYear, year, bet.id);
  updateMapArray(store.parlays.byMonth, month, bet.id);
  updateMapArray(store.parlays.bySport, bet.sport, bet.id);

  // Update metadata
  store.metadata.sports.add(bet.sport);
  store.metadata.totalBets++;
  store.metadata.totalWagered += bet.wager;

  // Update date range
  if (bet.datePlaced < store.metadata.dateRange.start) {
    store.metadata.dateRange.start = bet.datePlaced;
  }
  if (bet.datePlaced > store.metadata.dateRange.end) {
    store.metadata.dateRange.end = bet.datePlaced;
  }

  // Process legs
  bet.legs.forEach(leg => updateLegIndices(store, leg, bet.id));
};

const updateLegIndices = (store: BettingDataStore, leg: BetLeg, betId: string) => {
  // Update player indices
  if (leg.player) {
    store.metadata.players.add(leg.player);
    updateSetMap(store.indices.playerProps, leg.player, betId);
  }

  // Update team indices
  if (leg.team) {
    store.metadata.teams.add(leg.team);
    updateMapArray(store.parlays.byTeam, leg.team, betId);
  }

  // Update prop type indices
  if (leg.propType) {
    store.metadata.propTypes.add(leg.propType);
    updateSetMap(store.indices.propTypes, leg.propType, betId);
  }

  // Update odds indices
  const oddsRange = getOddsRange(leg.odds);
  updateSetMap(store.indices.odds, oddsRange, betId);
};

const updateMapArray = <K>(map: Map<K, string[]>, key: K, value: string) => {
  const existing = map.get(key) || [];
  map.set(key, [...existing, value]);
};

const updateSetMap = (map: Map<string, Set<string>>, key: string, value: string) => {
  const existing = map.get(key) || new Set();
  existing.add(value);
  map.set(key, existing);
};

const getOddsRange = (odds: number): string => {
  if (odds < 1.5) return '<1.5';
  if (odds < 2.0) return '1.5-2.0';
  if (odds < 3.0) return '2.0-3.0';
  if (odds < 5.0) return '3.0-5.0';
  return '5.0+';
};

export const CHUNK_SIZE = 1000;

export const processChunk = async (
  chunk: any[],
  store: BettingDataStore,
  updateProgress: (progress: number) => void
) => {
  const total = chunk.length;
  let processed = 0;

  for (const row of chunk) {
    try {
      if (isParentBet(row)) {
        const parentBet = await processParentBet(row);
        store.parlays.byId.set(parentBet.id, parentBet);
        updateStoreIndices(store, parentBet);
      }
      processed++;
      if (processed % 100 === 0) {
        updateProgress((processed / total) * 100);
        // Allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Error processing row:', error);
    }
  }
};

const isParentBet = (row: any): boolean => {
  // Check if this row represents a parent bet (has Bet Slip ID and wager)
  return Boolean(
    row['Bet Slip ID'] &&
    row['Wager'] &&
    row['Date Placed']
  );
};

const processParentBet = async (row: any): Promise<ParentBet> => {
  return {
    id: row['Bet Slip ID'],
    datePlaced: new Date(row['Date Placed']),
    sport: row['League'] || 'Unknown',
    wager: parseFloat(row['Wager']) || 0,
    potentialPayout: parseFloat(row['Potential Payout']) || 0,
    status: row['Status'] || '',
    numberOfLegs: 0, // Will be updated when processing legs
    legs: [], // Will be populated when processing legs
  };
};

export const getQuickStats = (store: BettingDataStore) => {
  let totalWon = 0;
  let winningBets = 0;

  store.parlays.byId.forEach(bet => {
    if (bet.status.toLowerCase() === 'won') {
      totalWon += bet.potentialPayout;
      winningBets++;
    }
  });

  return {
    totalBets: store.metadata.totalBets,
    totalWagered: store.metadata.totalWagered,
    totalWon,
    profitLoss: totalWon - store.metadata.totalWagered,
    winRate: (winningBets / store.metadata.totalBets) * 100,
    mostBetSport: getMostFrequent(store.parlays.bySport),
    mostBetPlayer: getMostFrequent(store.indices.playerProps),
    averageOdds: calculateAverageOdds(store)
  };
};

const getMostFrequent = (map: Map<string, any>): string => {
  let maxCount = 0;
  let mostFrequent = '';

  map.forEach((value, key) => {
    const count = Array.isArray(value) ? value.length : value.size;
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = key;
    }
  });

  return mostFrequent;
};

const calculateAverageOdds = (store: BettingDataStore): number => {
  let totalOdds = 0;
  let count = 0;

  store.parlays.byId.forEach(bet => {
    bet.legs.forEach(leg => {
      totalOdds += leg.odds;
      count++;
    });
  });

  return count > 0 ? totalOdds / count : 0;
};