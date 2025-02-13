interface RawBet {
  id: string;
  datePlaced?: string;
  status?: string;
  game?: string;
  betType?: string;
  wager?: number;
  result?: string;
  potentialPayout?: number;
  legs: BetLeg[];
}

interface BetLeg {
  player: string;
  propType: string;
  line: string;
  result: string;
  gameTime?: string;
}

export const parseFile = async (file: File): Promise<RawBet[]> => {
  try {
    const text = await file.text();
    console.log('Starting file parsing');

    // Split into lines and clean
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    console.log(`Found ${lines.length} lines`);

    const bets: RawBet[] = [];
    let currentBet: Partial<RawBet> | null = null;
    let currentLegs: BetLeg[] = [];

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Processing line ${i + 1}:`, line);

      // Check if line starts a new bet (has date and time)
      if (line.match(/\d{1,2}\s+[A-Za-z]+\s+\d{4}\s+@\s+\d{1,2}:\d{2}(am|pm)/i)) {
        // Save previous bet if exists
        if (currentBet && currentLegs.length > 0) {
          bets.push({
            ...currentBet,
            legs: [...currentLegs]
          } as RawBet);
        }

        // Start new bet
        currentBet = {
          id: '', // Will be set when we find it
          datePlaced: line,
          legs: []
        };
        currentLegs = [];
        continue;
      }

      // If we have a current bet, try to parse the line
      if (currentBet) {
        // Try to extract bet information
        if (line.includes('Bet Slip ID')) {
          currentBet.id = line.split(':')[1]?.trim() || '';
        } else if (line.includes('Status')) {
          currentBet.status = line.split(':')[1]?.trim() || '';
        } else if (line.includes('Wager')) {
          const wagerStr = line.split(':')[1]?.trim() || '0';
          currentBet.wager = parseFloat(wagerStr.replace(/[^0-9.-]+/g, ''));
        } else if (line.includes('Potential Payout')) {
          const payoutStr = line.split(':')[1]?.trim() || '0';
          currentBet.potentialPayout = parseFloat(payoutStr.replace(/[^0-9.-]+/g, ''));
        } else if (line.includes('vs')) {
          // This is likely a game line
          currentBet.game = line.trim();
        } else if (line.includes('Over') || line.includes('Under') || line.includes('Yes') || line.includes('No')) {
          // This is likely a prop bet line
          const legParts = line.split('-').map(part => part.trim());
          if (legParts.length >= 2) {
            currentLegs.push({
              player: legParts[0],
              propType: legParts[1],
              line: legParts[2] || '',
              result: 'Unknown' // Will be updated when we find it
            });
          }
        }
      }
    }

    // Add the last bet if exists
    if (currentBet && currentLegs.length > 0) {
      bets.push({
        ...currentBet,
        legs: [...currentLegs]
      } as RawBet);
    }

    console.log(`Parsed ${bets.length} bets`);
    return bets;
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
};