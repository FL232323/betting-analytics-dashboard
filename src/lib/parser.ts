export interface BetData {
  parentBet: {
    datePlaced: string;
    status: string;
    wager: number;
    potentialPayout: number;
    betSlipId: string;
  };
  legs: Array<{
    player: string;
    market: string;
    line: string;
    result: string;
    gameTime: string;
  }>;
}

export const parseXMLFile = async (file: File): Promise<BetData[]> => {
  try {
    // Read file as text
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // Get all rows
    const rows = Array.from(xmlDoc.getElementsByTagName('ss:Row'));
    
    // First row contains headers
    const headers = getHeaders(rows[0]);
    console.log('Headers found:', headers);

    const bets: BetData[] = [];
    let currentBet: Partial<BetData> | null = null;

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      const rowData = extractRowData(rows[i], headers);
      
      // If this row has a Bet Slip ID, it's a parent bet
      if (rowData['Bet Slip ID']) {
        if (currentBet) {
          bets.push(currentBet as BetData);
        }
        currentBet = {
          parentBet: {
            datePlaced: rowData['Date Placed'] || '',
            status: rowData['Status'] || '',
            wager: parseFloat(rowData['Wager'] || '0'),
            potentialPayout: parseFloat(rowData['Potential Payout'] || '0'),
            betSlipId: rowData['Bet Slip ID']
          },
          legs: []
        };
      } 
      // Otherwise it's a leg of the current bet
      else if (currentBet) {
        currentBet.legs = currentBet.legs || [];
        currentBet.legs.push({
          player: extractPlayerFromBetType(rowData['Bet Type']),
          market: rowData['Market'] || '',
          line: `${rowData['Bet Type']} ${rowData['Market']}`,
          result: rowData['Result'] || rowData['Status'] || '',
          gameTime: rowData['Result'] || '' // Usually contains game time
        });
      }
    }

    // Add the last bet
    if (currentBet) {
      bets.push(currentBet as BetData);
    }

    return bets;
  } catch (error) {
    console.error('Error parsing XML:', error);
    throw error;
  }
};

const getHeaders = (headerRow: Element): string[] => {
  return Array.from(headerRow.getElementsByTagName('ss:Cell'))
    .map(cell => {
      const dataEl = cell.getElementsByTagName('ss:Data')[0];
      return dataEl?.textContent || '';
    });
};

const extractRowData = (row: Element, headers: string[]): Record<string, string> => {
  const cells = Array.from(row.getElementsByTagName('ss:Cell'));
  const data: Record<string, string> = {};
  
  cells.forEach((cell, index) => {
    if (headers[index]) {
      const dataEl = cell.getElementsByTagName('ss:Data')[0];
      data[headers[index]] = dataEl?.textContent || '';
    }
  });
  
  return data;
};

const extractPlayerFromBetType = (betType: string = ''): string => {
  // Handle formats like "Player Name - Prop Type"
  const parts = betType.split(' - ');
  return parts[0] || '';
};