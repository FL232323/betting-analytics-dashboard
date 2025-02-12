export interface BetRecord {
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

export const parseXMLToRecords = (xmlText: string): BetRecord[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const rows = xmlDoc.getElementsByTagName('ss:Row');
  const records: BetRecord[] = [];
  let currentRecord: Partial<BetRecord> | null = null;

  // Get headers
  const headers = Array.from(rows[0].getElementsByTagName('ss:Cell')).map(cell => {
    const data = cell.getElementsByTagName('ss:Data')[0];
    return data?.textContent || '';
  });

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('ss:Cell');
    const firstCell = cells[0]?.getElementsByTagName('ss:Data')[0]?.textContent;

    // If first cell has a date, start a new record
    if (firstCell?.match(/\d+\s+\w+\s+\d{4}\s+@\s+\d+:\d+[ap]m/i)) {
      if (currentRecord) {
        records.push(currentRecord as BetRecord);
      }
      currentRecord = {
        'Date Placed': '',
        'Status': '',
        'League': '',
        'Match': '',
        'Bet Type': '',
        'Market': '',
        'Price': '',
        'Wager': '',
        'Winnings': '',
        'Payout': '',
        'Potential Payout': '',
        'Result': '',
        'Bet Slip ID': ''
      };
    }

    if (currentRecord) {
      Array.from(cells).forEach((cell, index) => {
        const data = cell.getElementsByTagName('ss:Data')[0]?.textContent || '';
        if (data && headers[index]) {
          currentRecord![headers[index] as keyof BetRecord] = data;
        }
      });
    }
  }

  // Add the last record
  if (currentRecord) {
    records.push(currentRecord as BetRecord);
  }

  return records;
};

export const cleanBetRecords = (records: BetRecord[]) => {
  return records.map(record => ({
    datePlaced: new Date(record['Date Placed']),
    status: record['Status'],
    league: record['League'],
    match: record['Match'],
    betType: record['Bet Type'],
    market: record['Market'],
    price: parseFloat(record['Price']) || 0,
    wager: parseFloat(record['Wager']) || 0,
    winnings: parseFloat(record['Winnings']) || 0,
    payout: parseFloat(record['Payout']) || 0,
    potentialPayout: parseFloat(record['Potential Payout']) || 0,
    result: record['Result'],
    betSlipId: record['Bet Slip ID']
  }));
};