'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { groupBy, sumBy, map } from 'lodash';
import type { Bet, Metrics } from '@/types/betting';

const parseDateString = (dateStr: string) => {
  try {
    // Handle the specific date format "9 Feb 2025 @ 4:08pm"
    const [day, month, year, time] = dateStr.split(' ');
    const [hours, minutes] = time.replace(/[ap]m$/i, '').split(':');
    const isPM = time.toLowerCase().includes('pm');
    
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const date = new Date(
      parseInt(year),
      monthMap[month],
      parseInt(day),
      isPM ? parseInt(hours) + 12 : parseInt(hours),
      parseInt(minutes)
    );

    return date;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date(); // Return current date as fallback
  }
};

export const BettingDashboard = () => {
  const [analysis, setAnalysis] = useState<{ bets: Bet[]; metrics: Metrics } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processBettingHistory = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        cellDates: true,
        cellNF: true,
        cellText: false
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const bets = XLSX.utils.sheet_to_json(sheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });

      console.log('Raw bet data:', bets[0]); // Debug log

      const cleanBets = bets.map(bet => ({
        datePlaced: parseDateString(bet['Date Placed']),
        status: bet['Status'],
        league: bet['League'],
        match: bet['Match'],
        betType: bet['Bet Type'],
        market: bet['Market'],
        price: parseFloat(bet['Price']?.toString() || '0') || 0,
        wager: parseFloat(bet['Wager']?.toString() || '0') || 0,
        winnings: parseFloat(bet['Winnings']?.toString() || '0') || 0,
        payout: parseFloat(bet['Payout']?.toString() || '0') || 0,
        potentialPayout: parseFloat(bet['Potential Payout']?.toString() || '0') || 0,
        result: bet['Result'],
        betSlipId: bet['Bet Slip ID']?.toString() || ''
      }));

      const metrics = {
        totalBets: cleanBets.length,
        totalWagered: sumBy(cleanBets, 'wager'),
        totalWinnings: sumBy(cleanBets, 'winnings'),
        profitLoss: sumBy(cleanBets, b => b.winnings - b.wager),
        winRate: (cleanBets.filter(b => b.status === 'Won').length / cleanBets.length) * 100,
        
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

  if (loading) {
    return <div className="text-center p-8">Processing your betting history...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Upload Betting History</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".xml,.xlsx,.xls"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics } = analysis;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">${metrics.totalWagered.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Wagered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">${metrics.totalWinnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Winnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${metrics.profitLoss.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Profit/Loss</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{metrics.winRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Win Rate</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="profitLoss" stroke="#82ca9d" name="Profit/Loss" />
                <Line type="monotone" dataKey="wagered" stroke="#8884d8" name="Wagered" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>League Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.leagueBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="league" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="profitLoss" fill="#82ca9d" name="Profit/Loss" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};