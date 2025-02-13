import { XMLParser } from 'fast-xml-parser';
import { Bet, BetLeg, BetType } from '../../types/betting';

interface RawBetData {
  'ss:Cell': {
    'ss:Data': {
      '#text': string;
      '@_ss:Type': string;
    };
  }[];
}

export class BettingHistoryParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
  }

  async parse(xmlContent: string): Promise<Bet[]> {
    const bets: Bet[] = [];
    const rows = this.extractRows(xmlContent);
    
    let currentParlay: Bet | null = null;
    
    for (const row of rows) {
      const betData = this.parseBetRow(row);
      
      if (!betData) continue;
      
      if (betData.betType === 'MULTIPLE') {
        // Start new parlay
        if (currentParlay) {
          bets.push(currentParlay);
        }
        
        currentParlay = {
          id: betData.betSlipId,
          type: BetType.PARLAY,
          datePlaced: new Date(betData.datePlaced),
          status: betData.status === 'Lost' ? 'Lost' : 'Won',
          wager: parseFloat(betData.wager),
          potentialPayout: parseFloat(betData.potentialPayout),
          actualPayout: parseFloat(betData.payout),
          legs: []
        };
      } else if (currentParlay && !betData.betSlipId) {
        // Add leg to current parlay
        currentParlay.legs.push({
          game: betData.match,
          betType: betData.betType,
          market: betData.market,
          odds: parseFloat(betData.price),
          result: betData.status === 'Lose' ? 'Lose' : 'Win'
        });
      } else {
        // Single bet
        bets.push({
          id: betData.betSlipId,
          type: BetType.SINGLE,
          datePlaced: new Date(betData.datePlaced),
          status: betData.status === 'Lost' ? 'Lost' : 'Won',
          wager: parseFloat(betData.wager),
          potentialPayout: parseFloat(betData.potentialPayout),
          actualPayout: parseFloat(betData.payout),
          legs: [{
            game: betData.match,
            betType: betData.betType,
            market: betData.market,
            odds: parseFloat(betData.price),
            result: betData.status === 'Lose' ? 'Lose' : 'Win'
          }]
        });
      }
    }
    
    // Add last parlay if exists
    if (currentParlay) {
      bets.push(currentParlay);
    }
    
    return bets;
  }

  private extractRows(xmlContent: string): RawBetData[] {
    const parsed = this.parser.parse(xmlContent);
    return parsed['ss:Worksheet']['ss:Table']['ss:Row'];
  }

  private parseBetRow(row: RawBetData): any {
    const cells = row['ss:Cell'];
    if (!cells || cells.length < 13) return null;

    return {
      datePlaced: this.getCellValue(cells[0]),
      status: this.getCellValue(cells[1]),
      league: this.getCellValue(cells[2]),
      match: this.getCellValue(cells[3]),
      betType: this.getCellValue(cells[4]),
      market: this.getCellValue(cells[5]),
      price: this.getCellValue(cells[6]),
      wager: this.getCellValue(cells[7]),
      winnings: this.getCellValue(cells[8]),
      payout: this.getCellValue(cells[9]),
      potentialPayout: this.getCellValue(cells[10]),
      result: this.getCellValue(cells[11]),
      betSlipId: this.getCellValue(cells[12])
    };
  }

  private getCellValue(cell: any): string {
    if (!cell || !cell['ss:Data']) return '';
    return cell['ss:Data']['#text'] || '';
  }
}

export const bettingParser = new BettingHistoryParser();