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

interface BetPart {
  'Date Placed'?: string;
  'Status'?: string;
  'League'?: string;
  'Match'?: string;
  'Bet Type'?: string;
  'Market'?: string;
  'Price'?: string;
  'Wager'?: string;
  'Winnings'?: string;
  'Payout'?: string;
  'Potential Payout'?: string;
  'Result'?: string;
  'Bet Slip ID'?: string;
}

const parseDateTime = (dateStr: string): Date => {
  try {
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
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

const extractCellValue = (cell: Element): string => {
  const dataElement = cell.getElementsByTagName('ss:Data')[0];
  return dataElement?.textContent || '';
};

export const parseXMLToRecords = (xmlText: string): BetRecord[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Get all rows and convert to array
  const rows = Array.from(xmlDoc.getElementsByTagName('ss:Row'));
  if (rows.length === 0) {
    console.error('No rows found in XML');
    return [];
  }

  // Get headers from first row
  const headerRow = rows[0];
  const headers = Array.from(headerRow.getElementsByTagName('ss:Cell')).map(extractCellValue);
  console.log('Found headers:', headers);

  const records: BetRecord[] = [];
  let currentBet: BetPart = {};
  let isNewBet = false;

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].getElementsByTagName('ss:Cell'));
    const rowValues = cells.map(extractCellValue);
    
    // Debug log for each row
    console.log(`Row ${i}:`, rowValues);

    // Check if this row starts a new bet (has a date in first column)
    isNewBet = rowValues[0]?.match(/\d{1,2}\s+\w+\s+\d{4}\s+@/) !== null;

    if (isNewBet && Object.keys(currentBet).length > 0) {
      // Save previous bet if it exists
      records.push(currentBet as BetRecord);
      currentBet = {};
    }

    // Process each cell in the row
    rowValues.forEach((value, index) => {
      if (value && headers[index]) {
        const header = headers[index] as keyof BetRecord;
        // For new bets, always update. For bet parts, only update if empty or if the field has a value
        if (isNewBet || !currentBet[header]) {
          currentBet[header] = value;
        }
      }
    });
  }

  // Add the last bet if exists
  if (Object.keys(currentBet).length > 0) {
    records.push(currentBet as BetRecord);
  }

  console.log(`Parsed ${records.length} total bets`);
  records.forEach((record, index) => {
    console.log(`Bet ${index + 1}:`, record);
  });

  return records;
};

export const cleanBetRecords = (records: BetRecord[]) => {
  console.log('Cleaning records...');
  return records.map((record, index) => {
    try {
      // Parse the date first to validate it
      const date = record['Date Placed'] ? parseDateTime(record['Date Placed']) : new Date();
      
      // Only proceed if we got a valid date
      if (isNaN(date.getTime())) {
        console.error('Invalid date for record:', index, record['Date Placed']);
        return null;
      }

      const cleaned = {
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

      console.log(`Cleaned bet ${index + 1}:`, cleaned);
      return cleaned;
    } catch (error) {
      console.error('Error cleaning record:', index, error);
      return null;
    }
  }).filter((record): record is NonNullable<typeof record> => record !== null);
};