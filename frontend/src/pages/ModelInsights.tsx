import { useState, useEffect } from 'react';
import { getModelInfo } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain, ArrowRight, Activity } from 'lucide-react';
export default function ModelInsights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getModelInfo()
      .then(setData)
      .catch(err => setError(err.message || 'Failed to fetch model insights'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const elbowData = data?.clustering?.elbow_data || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">Model Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-3 mb-4 text-spotify-green">
            <Server size={24} />
            <h2 className="text-xl font-bold text-white">Preprocessing</h2>
          </div>
          <ul className="space-y-3 text-sm text-subdued">
            <li className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Original Rows</span>
              <span className="text-white font-medium">{data?.preprocessing?.original_rows?.toLocaleString()}</span>
            </li>
            <li className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Final Rows</span>
              <span className="text-white font-medium">{data?.preprocessing?.final_rows?.toLocaleString()}</span>
            </li>
            <li className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Duplicates Handled</span>
              <span className="text-white font-medium">{data?.preprocessing?.duplicates_handled?.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>Features Used</span>
              <span className="text-white font-medium">{data?.preprocessing?.num_features}</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-3 mb-4 text-spotify-green">
            <Activity size={24} />
            <h2 className="text-xl font-bold text-white">Clustering (K-Means)</h2>
          </div>
          <ul className="space-y-3 text-sm text-subdued">
            <li className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Optimal K</span>
              <span className="text-white font-medium">{data?.clustering?.optimal_k}</span>
            </li>
            <li className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Best Silhouette</span>
              <span className="text-white font-medium">{data?.clustering?.best_silhouette?.toFixed(4)}</span>
            </li>
            <li className="flex justify-between border-b border-zinc-800 pb-2">
              <span>PCA Total Variance</span>
              <span className="text-white font-medium">{(data?.clustering?.pca_total_variance * 100)?.toFixed(1)}%</span>
            </li>
            <li className="flex justify-between">
              <span>Clustered Tracks</span>
              <span className="text-white font-medium">{data?.clustering?.total_songs_clustered?.toLocaleString()}</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-3 mb-4 text-spotify-green">
            <Cpu size={24} />
            <h2 className="text-xl font-bold text-white">Recommendation Engine</h2>
          </div>
          <div className="text-sm text-subdued space-y-4">
            <p><strong>Method:</strong> {data?.recommendation?.method}</p>
            <p><strong>Metric:</strong> {data?.recommendation?.similarity_metric}</p>
            <p>{data?.recommendation?.description}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-2">K-Means Elbow Method & Silhouette Score</h2>
        <p className="text-sm text-subdued mb-6">{data?.clustering?.k_selection_reason}</p>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={elbowData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis dataKey="k" stroke="#B3B3B3" name="Number of Clusters (k)" />
              <YAxis yAxisId="left" stroke="#1DB954" orientation="left" name="Inertia" />
              <YAxis yAxisId="right" stroke="#E0245E" orientation="right" name="Silhouette" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#191414', border: '1px solid #282828' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="inertia" stroke="#1DB954" strokeWidth={2} dot={{ r: 4 }} name="Inertia" />
              <Line yAxisId="right" type="monotone" dataKey="silhouette" stroke="#E0245E" strokeWidth={2} dot={{ r: 4 }} name="Silhouette Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-6">System Architecture</h2>
        <div className="space-y-4">
          {data?.architecture?.map((step: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center shrink-0 mt-1">
                {step.step}
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-lg flex-grow border border-zinc-800/80">
                <h3 className="text-white font-medium mb-1">{step.name}</h3>
                <p className="text-subdued text-sm">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
