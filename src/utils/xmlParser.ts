import { BettingDataStore, ParentBet, BetLeg } from '@/types/betting';
import { initializeDataStore, CHUNK_SIZE, processChunk } from '@/lib/dataStore';

interface RawBetRow {
  'Date Placed': string;
  'Status': string;
  'League': string;
  'Match': string;
  'Bet Type': string;
  'Market': string;
  'Price': string;
  'Wager': string;
  'Winnings': string;
  'Payout': string;
  'Potential Payout': string;
  'Result': string;
  'Bet Slip ID': string;
}

const extractCellValue = (cell: Element): string => {
  const dataElement = cell.getElementsByTagName('ss:Data')[0];
  return dataElement?.textContent || '';
};

const parseDateTime = (dateStr: string): Date => {
  try {
    // Parse: "9 Feb 2025 @ 4:08pm"
    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+@\s+(\d{1,2}):(\d{2})(am|pm)/i);
    if (!match) {
      console.error('Invalid date format:', dateStr);
      return new Date();
    }

    const [_, day, month, year, hour, minute, meridiem] = match;
    const monthMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    let hours = parseInt(hour);
    if (meridiem.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (meridiem.toLowerCase() === 'am' && hours === 12) hours = 0;

    return new Date(
      parseInt(year),
      monthMap[month.toLowerCase()],
      parseInt(day),
      hours,
      parseInt(minute)
    );
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

const parseXMLToRows = (xmlText: string): RawBetRow[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const rows = Array.from(xmlDoc.getElementsByTagName('ss:Row'));
  
  // Get headers from first row
  const headers = Array.from(rows[0].getElementsByTagName('ss:Cell')).map(extractCellValue);
  const betRows: RawBetRow[] = [];
  
  // Process each row after headers
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].getElementsByTagName('ss:Cell'));
    const rowData: Partial<RawBetRow> = {};
    
    cells.forEach((cell, index) => {
      if (headers[index]) {
        rowData[headers[index] as keyof RawBetRow] = extractCellValue(cell);
      }
    });
    
    betRows.push(rowData as RawBetRow);
  }
  
  return betRows;
};

const processParentRow = (row: RawBetRow): ParentBet => {
  return {
    id: row['Bet Slip ID'],
    datePlaced: parseDateTime(row['Date Placed']),
    sport: row['League'] || 'Unknown',
    wager: parseFloat(row['Wager']) || 0,
    potentialPayout: parseFloat(row['Potential Payout']) || 0,
    status: row['Status'] || '',
    numberOfLegs: 0,  // Will be updated when processing legs
    legs: [],         // Will be populated with child rows
  };
};

const processLegRow = (row: RawBetRow, gameTime: string): BetLeg => {
  // Extract player name and prop type from Bet Type
  const [player, ...propParts] = (row['Bet Type'] || '').split(' - ');
  const propType = propParts.join(' - ');

  // Extract team from Match
  const teams = row['Match']?.split(' vs ') || ['Unknown', 'Unknown'];
  const team = teams[0]; // Take first team as default

  return {
    player,
    team,
    propType,
    line: row['Market'] || '',
    odds: parseFloat(row['Price']) || 1,
    result: row['Status'] || '',
    gameTime: parseDateTime(gameTime),
    sport: row['League'] || 'Unknown',
    league: row['League'] || 'Unknown',
    market: getMarketCategory(row['Market'] || ''),
    betCategory: getBetCategory(row['Market'] || '')
  };
};

const getMarketCategory = (market: string): string => {
  if (market.toLowerCase().includes('over') || market.toLowerCase().includes('under')) return 'Over/Under';
  if (market.toLowerCase() === 'yes' || market.toLowerCase() === 'no') return 'Yes/No';
  if (market.toLowerCase().includes('anytime')) return 'Anytime';
  return 'Other';
};

const getBetCategory = (market: string): string => {
  if (market.toLowerCase().includes('rushing')) return 'Rushing';
  if (market.toLowerCase().includes('passing')) return 'Passing';
  if (market.toLowerCase().includes('receiving')) return 'Receiving';
  if (market.toLowerCase().includes('td')) return 'Touchdown';
  if (market.toLowerCase().includes('sacks')) return 'Defense';
  return 'Other';
};

const splitIntoChunks = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const processBettingHistory = async (
  file: File,
  updateProgress: (progress: number) => void
): Promise<BettingDataStore> => {
  try {
    const text = await file.text();
    console.log('Processing file...', file.name);
    
    // Parse XML to rows
    const rows = parseXMLToRows(text);
    console.log(`Found ${rows.length} rows`);
    
    // Initialize data store
    const store = initializeDataStore();
    
    // Split into chunks for processing
    const chunks = splitIntoChunks(rows, CHUNK_SIZE);
    const totalChunks = chunks.length;
    
    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      await processChunk(chunks[i], store, (chunkProgress) => {
        const overallProgress = ((i / totalChunks) * 100) + (chunkProgress / totalChunks);
        updateProgress(overallProgress);
      });
      
      // Allow UI updates between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    console.log('Processing complete');
    return store;
  } catch (error) {
    console.error('Error processing betting history:', error);
    throw error;
  }
};