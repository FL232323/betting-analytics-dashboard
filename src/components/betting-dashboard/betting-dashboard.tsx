'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { processBettingHistory } from '@/utils/xmlParser';
import type { BettingDataStore } from '@/types/betting';

export const BettingDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<BettingDataStore | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Starting file processing:', file.name);
      const dataStore = await processBettingHistory(file, (progress) => {
        setProgress(Math.round(progress));
        console.log(`Processing progress: ${Math.round(progress)}%`);
      });
      
      console.log('Processing complete. Data store:', {
        totalBets: dataStore.metadata.totalBets,
        totalWagered: dataStore.metadata.totalWagered,
        dateRange: dataStore.metadata.dateRange,
        uniquePlayers: dataStore.metadata.players.size,
        uniquePropTypes: dataStore.metadata.propTypes.size,
      });

      setStore(dataStore);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please check the console for details.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getPlayerPerformanceData = () => {
    if (!store) return [];
    
    const playerStats = new Map<string, {
      player: string;
      totalBets: number;
      wins: number;
      winRate: number;
      totalWagered: number;
      profitLoss: number;
    }>();

    store.parlays.byId.forEach(bet => {
      bet.legs.forEach(leg => {
        const stats = playerStats.get(leg.player) || {
          player: leg.player,
          totalBets: 0,
          wins: 0,
          winRate: 0,
          totalWagered: 0,
          profitLoss: 0
        };

        stats.totalBets++;
        if (leg.result.toLowerCase() === 'win') {
          stats.wins++;
        }
        stats.winRate = (stats.wins / stats.totalBets) * 100;
        stats.totalWagered += bet.wager / bet.legs.length; // Distribute wager across legs
        stats.profitLoss += leg.result.toLowerCase() === 'win' ? 
          (bet.potentialPayout - bet.wager) / bet.legs.length : 
          -bet.wager / bet.legs.length;

        playerStats.set(leg.player, stats);
      });
    });

    console.log('Player performance data:', Array.from(playerStats.values()));
    return Array.from(playerStats.values())
      .filter(stats => stats.totalBets > 0)
      .sort((a, b) => b.totalBets - a.totalBets)
      .slice(0, 10); // Top 10 most bet players
  };

  const getPropTypePerformanceData = () => {
    if (!store) return [];
    
    const propStats = new Map<string, {
      propType: string;
      totalBets: number;
      wins: number;
      winRate: number;
      averageOdds: number;
      profitLoss: number;
    }>();

    store.parlays.byId.forEach(bet => {
      bet.legs.forEach(leg => {
        const stats = propStats.get(leg.propType) || {
          propType: leg.propType,
          totalBets: 0,
          wins: 0,
          winRate: 0,
          averageOdds: 0,
          profitLoss: 0
        };

        stats.totalBets++;
        if (leg.result.toLowerCase() === 'win') {
          stats.wins++;
        }
        stats.winRate = (stats.wins / stats.totalBets) * 100;
        stats.averageOdds = ((stats.averageOdds * (stats.totalBets - 1)) + leg.odds) / stats.totalBets;
        stats.profitLoss += leg.result.toLowerCase() === 'win' ? 
          (bet.potentialPayout - bet.wager) / bet.legs.length : 
          -bet.wager / bet.legs.length;

        propStats.set(leg.propType, stats);
      });
    });

    console.log('Prop type performance data:', Array.from(propStats.values()));
    return Array.from(propStats.values())
      .filter(stats => stats.totalBets > 0)
      .sort((a, b) => b.totalBets - a.totalBets);
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-xl font-bold mb-2">Processing Betting History</div>
              <div className="text-sm text-gray-600 mb-4">Progress: {progress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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

  if (!store) {
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

  const playerData = getPlayerPerformanceData();
  const propData = getPropTypePerformanceData();

  return (
    <div className="p-4 space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{store.metadata.totalBets}</div>
            <div className="text-sm text-gray-600">Total Bets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">${store.metadata.totalWagered.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Wagered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{store.metadata.players.size}</div>
            <div className="text-sm text-gray-600">Unique Players</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{store.metadata.propTypes.size}</div>
            <div className="text-sm text-gray-600">Prop Types</div>
          </CardContent>
        </Card>
      </div>

      {/* Player Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Player Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="player" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="winRate" name="Win Rate %" fill="#82ca9d" />
                <Bar dataKey="totalBets" name="Total Bets" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Prop Type Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Prop Type Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={propData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="propType" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="winRate" name="Win Rate %" fill="#82ca9d" />
                <Bar dataKey="averageOdds" name="Average Odds" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};