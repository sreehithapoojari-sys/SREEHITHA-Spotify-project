import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(err => setError(err.message || 'Failed to fetch analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const formatDistributionData = (distData: any) => {
    if (!distData || !distData.bins || !distData.counts) return [];
    return distData.bins.slice(0, -1).map((bin: number, i: number) => ({
      bin: Number(bin).toFixed(2),
      count: distData.counts[i]
    }));
  };

  const formatGenreData = (genreData: any) => {
    if (!genreData) return [];
    return Object.entries(genreData)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value);
  };

  const formatArtistsData = (artistsData: any) => {
    if (!artistsData) return [];
    return Object.entries(artistsData)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10);
  };

  const danceabilityData = formatDistributionData(data?.distributions?.danceability);
  const genreData = formatGenreData(data?.genre_breakdown);
  const topArtistsData = formatArtistsData(data?.top_artists);
  const scatterEnergyDance = data?.scatter_data?.energy_vs_danceability?.slice(0, 500) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-4">Danceability Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={danceabilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" vertical={false} />
                <XAxis dataKey="bin" stroke="#B3B3B3" fontSize={12} />
                <YAxis stroke="#B3B3B3" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#191414', border: '1px solid #282828' }}
                  cursor={{ fill: '#282828' }}
                />
                <Bar dataKey="count" fill="#1DB954" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-4">Genre Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" vertical={false} />
                <XAxis dataKey="name" stroke="#B3B3B3" fontSize={12} />
                <YAxis stroke="#B3B3B3" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#191414', border: '1px solid #282828' }}
                  cursor={{ fill: '#282828' }}
                />
                <Bar dataKey="value" fill="#1DB954" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-4">Top 10 Artists</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topArtistsData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" horizontal={false} />
                <XAxis type="number" stroke="#B3B3B3" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#B3B3B3" fontSize={12} width={100} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#191414', border: '1px solid #282828' }}
                  cursor={{ fill: '#282828' }}
                />
                <Bar dataKey="value" fill="#1DB954" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-4">Energy vs Danceability</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                <XAxis type="number" dataKey="danceability" name="Danceability" stroke="#B3B3B3" />
                <YAxis type="number" dataKey="energy" name="Energy" stroke="#B3B3B3" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#191414', border: '1px solid #282828' }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter name="Tracks" data={scatterEnergyDance} fill="#1DB954" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
