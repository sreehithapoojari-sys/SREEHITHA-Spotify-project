import { useState, useEffect } from 'react';
import { getClusters } from '../services/api';
import { CLUSTER_COLORS } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Music, Activity } from 'lucide-react';

export default function ClusterExplorer() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClusters()
      .then(setData)
      .catch(err => setError(err.message || 'Failed to fetch clusters'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const pcaData = data?.pca_data?.slice(0, 2000) || [];
  const clusterDetails = data?.cluster_details || {};

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cluster Explorer</h1>
          <p className="text-subdued">Optimal K: {data?.optimal_k} | Total Clustered: {data?.total_songs_clustered?.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-6">Interactive PCA Visualization</h2>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis type="number" dataKey="x" name="PCA 1" stroke="#B3B3B3" />
              <YAxis type="number" dataKey="y" name="PCA 2" stroke="#B3B3B3" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#191414', border: '1px solid #282828', borderRadius: '8px' }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter name="Tracks" data={pcaData} fill="#1DB954">
                {pcaData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.cluster] || '#1DB954'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(clusterDetails).map(([id, details]: [string, any]) => (
          <div key={id} className="bg-surface-gray p-6 rounded-lg border border-zinc-800 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: CLUSTER_COLORS[id] || '#1DB954' }}
              />
              <h2 className="text-2xl font-bold text-white">Cluster {id}: {details.name}</h2>
            </div>
            
            <p className="text-subdued mb-6 flex-grow">{details.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-bg-black p-4 rounded-lg">
                <div className="flex items-center gap-2 text-subdued mb-1">
                  <Music size={16} />
                  <span className="text-sm">Size</span>
                </div>
                <p className="text-xl font-bold text-white">{details.size.toLocaleString()}</p>
              </div>
              <div className="bg-bg-black p-4 rounded-lg">
                <div className="flex items-center gap-2 text-subdued mb-1">
                  <Activity size={16} />
                  <span className="text-sm">Energy</span>
                </div>
                <p className="text-xl font-bold text-white">{details.average_features?.energy?.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-white mb-2">Dominant Genres</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(details.dominant_genres || {})
                  .sort(([, a]: any, [, b]: any) => b - a)
                  .slice(0, 5)
                  .map(([genre]) => (
                    <span key={genre} className="bg-zinc-800 text-subdued px-3 py-1 rounded-full text-xs">
                      {genre}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
