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

const parseDateTime = (dateStr: string): Date => {
  // Parse: "26 Jan 2025 @ 6:40pm" or "19 Nov 2023 @ 3:41pm"
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+@\s+(\d{1,2}):(\d{2})(am|pm)/i);
  if (!match) {
    console.error('Failed to parse date:', dateStr);
    return new Date();
  }

  const [_, dayStr, monthStr, yearStr, hourStr, minuteStr, meridiem] = match;

  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  let hour = parseInt(hourStr, 10);

  // Convert to 24-hour format
  if (meridiem.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12;
  } else if (meridiem.toLowerCase() === 'am' && hour === 12) {
    hour = 0;
  }

  const monthMap: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };

  const month = monthMap[monthStr.toLowerCase()];
  const minutes = parseInt(minuteStr, 10);

  // Use UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month, day, hour, minutes));

  // Debug logging
  console.log('Date parsing:', {
    original: dateStr,
    parsed: {
      year,
      month: monthStr,
      monthIndex: month,
      day,
      hour,
      minutes,
      meridiem
    },
    result: date.toISOString()
  });

  return date;
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

  console.log('Found headers:', headers);

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('ss:Cell');
    const firstCell = cells[0]?.getElementsByTagName('ss:Data')[0]?.textContent || '';

    // If we see a date in the first cell, start a new record
    if (firstCell.match(/\d{1,2}\s+\w+\s+\d{4}\s+@/)) {
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
      cells.forEach((cell, index) => {
        const data = cell.getElementsByTagName('ss:Data')[0]?.textContent || '';
        if (data && headers[index]) {
          currentRecord![headers[index] as keyof BetRecord] = data;
        }
      });
    }
  }

  // Add the last record if there is one
  if (currentRecord) {
    records.push(currentRecord as BetRecord);
  }

  return records;
};

export const cleanBetRecords = (records: BetRecord[]) => {
  return records.map(record => {
    // Parse the date first to validate it
    const date = record['Date Placed'] ? parseDateTime(record['Date Placed']) : new Date();
    
    // Only proceed if we got a valid date
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', record['Date Placed']);
      return null;
    }

    return {
      datePlaced: date,
      status: record['Status'] || '',
      league: record['League'] || '',
      match: record['Match'] || '',
      betType: record['Bet Type'] || '',
      market: record['Market'] || '',
      price: parseFloat(record['Price']?.toString() || '0') || 0,
      wager: parseFloat(record['Wager']?.toString() || '0') || 0,
      winnings: parseFloat(record['Winnings']?.toString() || '0') || 0,
      payout: parseFloat(record['Payout']?.toString() || '0') || 0,
      potentialPayout: parseFloat(record['Potential Payout']?.toString() || '0') || 0,
      result: record['Result'] || '',
      betSlipId: record['Bet Slip ID']?.toString() || ''
    };
  }).filter((record): record is NonNullable<typeof record> => record !== null);
};