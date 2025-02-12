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

const debugDate = (dateStr: string, parsedDate: Date) => {
  console.log({
    original: dateStr,
    parsed: parsedDate,
    isoString: parsedDate.toISOString(),
    getTime: parsedDate.getTime(),
    year: parsedDate.getFullYear(),
    month: parsedDate.getMonth(),
    day: parsedDate.getDate(),
    hours: parsedDate.getHours(),
    minutes: parsedDate.getMinutes(),
    isValid: !isNaN(parsedDate.getTime())
  });
};

export const parseDateString = (dateStr: string | null) => {
  if (!dateStr) {
    console.log('Empty date string received');
    return new Date();
  }

  try {
    console.log('Parsing date string:', dateStr);
    
    // Parse date format: "9 Feb 2025 @ 4:08pm"
    const parts = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4})\s+@\s+(\d+):(\d+)(am|pm)/i);
    if (!parts) {
      console.log('Failed to match date pattern for:', dateStr);
      return new Date();
    }

    const [_, day, month, year, hours, minutes, ampm] = parts;
    console.log('Matched parts:', { day, month, year, hours, minutes, ampm });

    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    let hour = parseInt(hours);
    if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;

    console.log('Calculated values:', {
      year: parseInt(year),
      month: monthMap[month],
      day: parseInt(day),
      hour,
      minutes: parseInt(minutes)
    });

    const date = new Date(
      parseInt(year),
      monthMap[month],
      parseInt(day),
      hour,
      parseInt(minutes)
    );

    debugDate(dateStr, date);
    return date;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

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

  console.log('Headers found:', headers);

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('ss:Cell');
    const firstCell = cells[0]?.getElementsByTagName('ss:Data')[0]?.textContent;

    if (firstCell) {
      console.log(`Row ${i} first cell:`, firstCell);
    }

    // If first cell has a date, start a new record
    if (firstCell?.match(/\d+\s+\w+\s+\d{4}\s+@\s+\d+:\d+[ap]m/i)) {
      if (currentRecord) {
        console.log('Completed record:', currentRecord);
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
    console.log('Final record:', currentRecord);
    records.push(currentRecord as BetRecord);
  }

  return records;
};

export const cleanBetRecords = (records: BetRecord[]) => {
  return records.map((record, index) => {
    console.log(`Cleaning record ${index}:`, record);
    const cleaned = {
      datePlaced: parseDateString(record['Date Placed']),
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
    };
    console.log(`Cleaned record ${index}:`, cleaned);
    return cleaned;
  });
};