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
  const value = dataElement?.textContent || '';
  console.log('Extracted cell value:', {
    hasDataElement: !!dataElement,
    value,
    cellHTML: cell.outerHTML
  });
  return value;
};

const parseDateTime = (dateStr: string): Date => {
  console.log('Attempting to parse date:', {
    input: dateStr,
    type: typeof dateStr,
    length: dateStr?.length
  });

  try {
    if (!dateStr || typeof dateStr !== 'string') {
      console.error('Invalid date input:', dateStr);
      return new Date();
    }

    // Parse: "9 Feb 2025 @ 4:08pm"
    const regex = /(\d{1,2})\s+(\w+)\s+(\d{4})\s+@\s+(\d{1,2}):(\d{2})(am|pm)/i;
    const match = dateStr.match(regex);
    
    console.log('Date regex match:', {
      dateStr,
      match,
      regex: regex.toString()
    });

    if (!match) {
      console.error('Date string did not match expected format:', dateStr);
      return new Date();
    }

    const [_, day, month, year, hour, minute, meridiem] = match;
    
    console.log('Parsed date components:', {
      day, month, year, hour, minute, meridiem
    });

    const monthMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    let hours = parseInt(hour);
    if (meridiem.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (meridiem.toLowerCase() === 'am' && hours === 12) hours = 0;

    const monthIndex = monthMap[month.toLowerCase()];
    console.log('Calculated values:', {
      year: parseInt(year),
      monthIndex,
      day: parseInt(day),
      hours,
      minutes: parseInt(minute)
    });

    const date = new Date(
      parseInt(year),
      monthIndex,
      parseInt(day),
      hours,
      parseInt(minute)
    );

    console.log('Created date object:', {
      date,
      isValid: !isNaN(date.getTime()),
      isoString: date.toISOString()
    });

    return date;
  } catch (error) {
    console.error('Error in date parsing:', {
      dateStr,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return new Date();
  }
};

const parseXMLToRows = (xmlText: string): RawBetRow[] => {
  console.log('Starting XML parsing');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  console.log('XML document:', {
    rootElement: xmlDoc.documentElement.tagName,
    hasWorkbook: !!xmlDoc.getElementsByTagName('ss:Workbook').length,
    hasWorksheet: !!xmlDoc.getElementsByTagName('ss:Worksheet').length
  });

  const rows = Array.from(xmlDoc.getElementsByTagName('ss:Row'));
  console.log('Found rows:', {
    total: rows.length,
    firstRowHTML: rows[0]?.outerHTML,
    secondRowHTML: rows[1]?.outerHTML
  });

  if (rows.length === 0) {
    console.error('No rows found in XML');
    return [];
  }

  // Get headers from first row
  const headers = Array.from(rows[0].getElementsByTagName('ss:Cell')).map(extractCellValue);
  console.log('Extracted headers:', headers);

  const betRows: RawBetRow[] = [];
  
  // Process each row after headers
  for (let i = 1; i < rows.length; i++) {
    console.log(`Processing row ${i}`);
    const cells = Array.from(rows[i].getElementsByTagName('ss:Cell'));
    const rowData: Partial<RawBetRow> = {};
    
    cells.forEach((cell, index) => {
      if (headers[index]) {
        const value = extractCellValue(cell);
        rowData[headers[index] as keyof RawBetRow] = value;
      }
    });
    
    console.log(`Row ${i} data:`, rowData);
    betRows.push(rowData as RawBetRow);
  }

  console.log('Finished parsing XML, total rows:', betRows.length);
  return betRows;
};

export const processBettingHistory = async (
  file: File,
  updateProgress: (progress: number) => void
): Promise<BettingDataStore> => {
  try {
    console.log('Starting file processing:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const text = await file.text();
    console.log('File content preview:', text.substring(0, 500));
    
    const rows = parseXMLToRows(text);
    console.log('Parsed rows:', {
      total: rows.length,
      firstRow: rows[0],
      lastRow: rows[rows.length - 1]
    });
    
    const store = initializeDataStore();
    const chunks = splitIntoChunks(rows, CHUNK_SIZE);
    
    console.log('Processing in chunks:', {
      totalChunks: chunks.length,
      chunkSize: CHUNK_SIZE
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`, {
        chunkSize: chunk.length,
        firstItemInChunk: chunk[0],
        lastItemInChunk: chunk[chunk.length - 1]
      });

      await processChunk(chunk, store, (chunkProgress) => {
        const overallProgress = ((i / chunks.length) * 100) + (chunkProgress / chunks.length);
        updateProgress(overallProgress);
      });

      await new Promise(resolve => setTimeout(resolve, 0));
    }

    console.log('Processing complete. Final store state:', {
      totalBets: store.metadata.totalBets,
      totalWagered: store.metadata.totalWagered,
      uniquePlayers: store.metadata.players.size,
      uniquePropTypes: store.metadata.propTypes.size,
      dateRange: store.metadata.dateRange
    });

    return store;
  } catch (error) {
    console.error('Error in processBettingHistory:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

const splitIntoChunks = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};