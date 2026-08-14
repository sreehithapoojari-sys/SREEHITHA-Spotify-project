import { useState, useEffect } from 'react';
import { getOverview, getClusters } from '../services/api';
import { CLUSTER_COLORS } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Music, Users, ListMusic, Disc, Network, Zap } from 'lucide-react';

export default function Overview() {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [clusterData, setClusterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [overviewRes, clusterRes] = await Promise.all([
          getOverview(),
          getClusters()
        ]);

        setOverviewData(overviewRes);
        setClusterData(clusterRes);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch overview data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const { overview, insight_cards } = overviewData;
  const pcaData = clusterData?.pca_data?.slice(0, 2000) || [];

  const kpis = [
    {
      label: 'Total Songs',
      value: overview.total_songs,
      icon: Music
    },
    {
      label: 'Artists',
      value: overview.total_artists,
      icon: Users
    },
    {
      label: 'Playlists',
      value: overview.total_playlists,
      icon: ListMusic
    },
    {
      label: 'Genres',
      value: overview.total_genres,
      icon: Disc
    },
    {
      label: 'Subgenres',
      value: overview.total_subgenres,
      icon: Zap
    },
    {
      label: 'Clusters',
      value: overview.total_clusters,
      icon: Network
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-spotify-green/20 to-bg-black rounded-lg p-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Spotify Music Intelligence Platform
        </h1>

        <p className="text-subdued max-w-2xl text-lg">
          Explore the dataset of over 30,000 tracks from the Spotify API.
          Discover clusters, audio features, and correlations across genres
          and playlists.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;

          return (
            <div
              key={idx}
              className="bg-surface-gray rounded-lg p-4 flex flex-col items-center text-center space-y-2"
            >
              <div className="bg-bg-black p-3 rounded-full text-spotify-green">
                <Icon size={24} />
              </div>

              <h3 className="text-2xl font-bold text-white">
                {kpi.value.toLocaleString()}
              </h3>

              <span className="text-subdued text-sm">
                {kpi.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {insight_cards?.map((card: any, idx: number) => (
          <div
            key={idx}
            className="bg-surface-gray p-6 rounded-lg border border-zinc-800"
          >
            <h3 className="text-subdued text-sm font-medium mb-2">
              {card.title}
            </h3>

            <p className="text-2xl font-bold text-white mb-2">
              {card.value}
            </p>

            <p className="text-sm text-spotify-green">
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-surface-gray rounded-lg p-6 border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-6">
          Music Space Map (PCA)
        </h2>

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#282828"
              />

              <XAxis
                type="number"
                dataKey="x"
                name="PCA 1"
                stroke="#B3B3B3"
              />

              <YAxis
                type="number"
                dataKey="y"
                name="PCA 2"
                stroke="#B3B3B3"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#191414',
                  border: 'none',
                  borderRadius: '8px'
                }}
                cursor={{
                  strokeDasharray: '3 3'
                }}
              />

              <Scatter
                name="Tracks"
                data={pcaData}
                fill="#1DB954"
              >
                {pcaData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      CLUSTER_COLORS[entry.cluster] || '#1DB954'
                    }
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
