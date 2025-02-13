'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseFile } from '@/utils/fileParser';

export const BettingDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [betsData, setBetsData] = useState<any[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Starting file processing:', file.name);
      const bets = await parseFile(file);
      console.log('Parsed bets:', bets);
      setBetsData(bets);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateStats = () => {
    if (!betsData.length) return null;

    const totalBets = betsData.length;
    const totalWagered = betsData.reduce((sum, bet) => sum + (bet.wager || 0), 0);
    const totalPotential = betsData.reduce((sum, bet) => sum + (bet.potentialPayout || 0), 0);
    
    // Get unique players and prop types
    const players = new Set();
    const propTypes = new Set();
    betsData.forEach(bet => {
      bet.legs.forEach((leg: any) => {
        if (leg.player) players.add(leg.player);
        if (leg.propType) propTypes.add(leg.propType);
      });
    });

    return {
      totalBets,
      totalWagered,
      totalPotential,
      uniquePlayers: players.size,
      uniquePropTypes: propTypes.size
    };
  };

  // Get player performance data
  const getPlayerStats = () => {
    const playerStats = new Map();

    betsData.forEach(bet => {
      bet.legs.forEach((leg: any) => {
        if (!leg.player) return;

        const stats = playerStats.get(leg.player) || {
          player: leg.player,
          totalBets: 0,
          wins: 0,
          totalWager: 0
        };

        stats.totalBets++;
        if (leg.result?.toLowerCase() === 'win') stats.wins++;
        stats.totalWager += (bet.wager || 0) / bet.legs.length; // Split wager across legs
        stats.winRate = (stats.wins / stats.totalBets) * 100;

        playerStats.set(leg.player, stats);
      });
    });

    return Array.from(playerStats.values());
  };

  // Get prop type performance data
  const getPropTypeStats = () => {
    const propStats = new Map();

    betsData.forEach(bet => {
      bet.legs.forEach((leg: any) => {
        if (!leg.propType) return;

        const stats = propStats.get(leg.propType) || {
          propType: leg.propType,
          totalBets: 0,
          wins: 0,
          totalWager: 0
        };

        stats.totalBets++;
        if (leg.result?.toLowerCase() === 'win') stats.wins++;
        stats.totalWager += (bet.wager || 0) / bet.legs.length;
        stats.winRate = (stats.wins / stats.totalBets) * 100;

        propStats.set(leg.propType, stats);
      });
    });

    return Array.from(propStats.values());
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-xl font-bold">Processing File...</div>
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

  const stats = calculateStats();
  const playerStats = getPlayerStats();
  const propTypeStats = getPropTypeStats();

  return (
    <div className="p-4 space-y-4">
      {!betsData.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Betting History</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.xls,.xlsx"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalBets}</div>
                <div className="text-sm text-gray-600">Total Bets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  ${stats?.totalWagered.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Wagered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  ${stats?.totalPotential.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Potential</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{stats?.uniquePlayers}</div>
                <div className="text-sm text-gray-600">Players</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-pink-600">{stats?.uniquePropTypes}</div>
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
                  <BarChart data={playerStats} layout="vertical">
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
                  <BarChart data={propTypeStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="propType" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="winRate" name="Win Rate %" fill="#82ca9d" />
                    <Bar dataKey="totalBets" name="Total Bets" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};