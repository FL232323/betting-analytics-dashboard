'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { groupBy, sumBy, map } from 'lodash';
import type { Bet, Metrics } from '@/types/betting';

const parseDateString = (dateStr: any) => {
  try {
    console.log('Parsing date string:', dateStr);
    if (!dateStr) {
      console.error('Date string is undefined or null');
      return new Date();
    }

    // If it's already a Date object, return it
    if (dateStr instanceof Date) {
      return dateStr;
    }

    // Convert to string if it's not already
    const dateString = String(dateStr);

    // First try direct Date parsing
    const directDate = new Date(dateString);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }

    // Try parsing the specific format "9 Feb 2025 @ 4:08pm"
    const match = dateString.match(/(\d+)\s+(\w+)\s+(\d+)\s+@\s+(\d+):(\d+)(am|pm)/i);
    if (match) {
      const [_, day, month, year, hours, minutes, ampm] = match;
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };

      let hour = parseInt(hours);
      if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;

      return new Date(
        parseInt(year),
        monthMap[month],
        parseInt(day),
        hour,
        parseInt(minutes)
      );
    }

    console.error('Could not parse date string:', dateString);
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

export const BettingDashboard = () => {
  const [analysis, setAnalysis] = useState<{ bets: Bet[]; metrics: Metrics } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processBettingHistory = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      console.log('File type:', file.type);
      
      // Read the workbook
      const workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellText: false
      });

      console.log('Available sheets:', workbook.SheetNames);
      
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      console.log('Sheet structure:', sheet['!ref']);
      
      const bets = XLSX.utils.sheet_to_json(sheet, {
        raw: false,
        defval: null
      });

      console.log('Parsed bets data (first record):', bets[0]);

      const cleanBets = bets.map((bet: any, index) => {
        console.log(`Processing bet ${index}:`, bet);
        return {
          datePlaced: parseDateString(bet['Date Placed'] || bet['datePlaced'] || null),
          status: bet['Status'] || bet['status'] || '',
          league: bet['League'] || bet['league'] || '',
          match: bet['Match'] || bet['match'] || '',
          betType: bet['Bet Type'] || bet['betType'] || '',
          market: bet['Market'] || bet['market'] || '',
          price: parseFloat(String(bet['Price'] || bet['price'] || '0')) || 0,
          wager: parseFloat(String(bet['Wager'] || bet['wager'] || '0')) || 0,
          winnings: parseFloat(String(bet['Winnings'] || bet['winnings'] || '0')) || 0,
          payout: parseFloat(String(bet['Payout'] || bet['payout'] || '0')) || 0,
          potentialPayout: parseFloat(String(bet['Potential Payout'] || bet['potentialPayout'] || '0')) || 0,
          result: bet['Result'] || bet['result'] || '',
          betSlipId: String(bet['Bet Slip ID'] || bet['betSlipId'] || '')
        };
      });

      console.log('Cleaned bets data (first record):', cleanBets[0]);

      const metrics = {
        totalBets: cleanBets.length,
        totalWagered: sumBy(cleanBets, 'wager'),
        totalWinnings: sumBy(cleanBets, 'winnings'),
        profitLoss: sumBy(cleanBets, b => b.winnings - b.wager),
        winRate: (cleanBets.filter(b => b.status.toLowerCase() === 'won').length / cleanBets.length) * 100,
        
        leagueBreakdown: map(
          groupBy(cleanBets, 'league'),
          (leagueBets, league) => ({
            league,
            totalBets: leagueBets.length,
            wagered: sumBy(leagueBets, 'wager'),
            winnings: sumBy(leagueBets, 'winnings'),
            profitLoss: sumBy(leagueBets, b => b.winnings - b.wager)
          })
        ),

        monthlyPerformance: map(
          groupBy(cleanBets, b => b.datePlaced.toISOString().slice(0, 7)),
          (monthBets, month) => ({
            month,
            wagered: sumBy(monthBets, 'wager'),
            winnings: sumBy(monthBets, 'winnings'),
            profitLoss: sumBy(monthBets, b => b.winnings - b.wager),
            totalBets: monthBets.length
          })
        ).sort((a, b) => a.month.localeCompare(b.month))
      };

      return {
        bets: cleanBets,
        metrics
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await processBettingHistory(file);
      setAnalysis(result);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
