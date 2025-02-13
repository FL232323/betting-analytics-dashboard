// Earlier code remains the same...

const extractCellValue = (cell: Element): string => {
  try {
    const dataElement = cell.getElementsByTagName('ss:Data')[0];
    const value = dataElement?.textContent || '';
    console.log('Extracted cell value:', {
      value,
      type: typeof value,
      hasData: !!dataElement,
      rawHTML: cell.innerHTML // Show the actual XML content
    });
    return value;
  } catch (error) {
    console.error('Error extracting cell value:', error);
    return '';
  }
};

const parseDateTime = (dateStr: string): Date => {
  try {
    console.log('Raw date string:', dateStr);
    
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error(`Invalid date input: ${dateStr}`);
    }

    // Handle empty string
    if (dateStr.trim() === '') {
      console.log('Empty date string, returning current date');
      return new Date();
    }

    // Parse format: "8 Dec 2024 @ 10:32am"
    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+@\s+(\d{1,2}):(\d{2})(am|pm)/i);
    
    console.log('Date parsing match:', {
      input: dateStr,
      matchResult: match,
      matchGroups: match ? Array.from(match) : null
    });

    if (!match) {
      throw new Error(`Date doesn't match expected format: ${dateStr}`);
    }

    const [_, dayStr, monthStr, yearStr, hourStr, minuteStr, meridiem] = match;
    
    // Convert components to numbers
    const year = parseInt(yearStr);
    const day = parseInt(dayStr);
    let hours = parseInt(hourStr);
    const minutes = parseInt(minuteStr);
    
    // Convert to 24-hour format
    if (meridiem.toLowerCase() === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }

    // Get month index
    const monthMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    const monthIndex = monthMap[monthStr.toLowerCase()];
    if (monthIndex === undefined) {
      throw new Error(`Invalid month: ${monthStr}`);
    }

    console.log('Date components:', {
      year, monthIndex, day, hours, minutes,
      original: {
        year: yearStr,
        month: monthStr,
        day: dayStr,
        hour: hourStr,
        minute: minuteStr,
        meridiem
      }
    });

    // Create date object with UTC
    const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes));
    
    console.log('Created date:', {
      date: date.toISOString(),
      timestamp: date.getTime(),
      valid: !isNaN(date.getTime())
    });

    if (isNaN(date.getTime())) {
      throw new Error('Created invalid date');
    }

    return date;
  } catch (error) {
    console.error('Date parsing error:', {
      input: dateStr,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return new Date(); // Return current date as fallback
  }
};

// Rest of the code remains the same, but add this to parseXMLToRows:
const parseXMLToRows = (xmlText: string): RawBetRow[] => {
  // ... existing code ...

  // When creating row data:
  for (let i = 1; i < rows.length; i++) {
    console.log(`\n=== Processing row ${i} ===`);
    const cells = Array.from(rows[i].getElementsByTagName('ss:Cell'));
    const rowData: Partial<RawBetRow> = {};
    
    cells.forEach((cell, index) => {
      if (headers[index]) {
        const value = extractCellValue(cell);
        rowData[headers[index] as keyof RawBetRow] = value;
        console.log(`${headers[index]}: "${value}"`);
      }
    });
    
    console.log('Complete row data:', rowData);
    betRows.push(rowData as RawBetRow);
  }

  return betRows;
};