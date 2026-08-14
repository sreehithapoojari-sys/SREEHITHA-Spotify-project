import { useState, useEffect } from 'react';
import { getCorrelation } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';

export default function Correlations() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCorrelation()
      .then(setData)
      .catch(err => setError(err.message || 'Failed to fetch correlations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const features = data?.correlation?.features || [];
  const matrix = data?.correlation?.matrix || [];

  const getColor = (value: number) => {
    // Red for negative (-1 to 0), Green for positive (0 to 1), neutral gray for 0
    if (value > 0) {
      return `rgba(29, 185, 84, ${Math.abs(value)})`; // Spotify green
    } else if (value < 0) {
      return `rgba(224, 36, 94, ${Math.abs(value)})`; // Redish
    }
    return '#282828';
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-6">Feature Correlations</h1>

      <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${features.length}, minmax(40px, 1fr))` }}>
            {/* Header row */}
            <div className="p-2"></div>
            {features.map((f: string, i: number) => (
              <div key={i} className="p-2 text-xs text-subdued font-medium truncate transform -rotate-45 origin-bottom-left" title={f}>
                {f}
              </div>
            ))}

            {/* Matrix rows */}
            {features.map((f: string, i: number) => (
              <div key={`row-${i}`} className="contents">
                <div className="p-2 text-xs text-subdued font-medium flex items-center justify-end pr-4" title={f}>
                  {f}
                </div>
                {matrix[i].map((val: number, j: number) => (
                  <div 
                    key={`cell-${i}-${j}`}
                    className="aspect-square flex items-center justify-center text-[10px] font-medium text-transparent hover:text-white transition-colors duration-200 border border-bg-black cursor-crosshair group relative"
                    style={{ backgroundColor: getColor(val) }}
                    title={`${f} vs ${features[j]}: ${val.toFixed(2)}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 drop-shadow-md z-10 pointer-events-none">
                      {val.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.insights?.map((insight: any, idx: number) => (
          <div key={idx} className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-full ${insight.value > 0 ? 'bg-spotify-green/20 text-spotify-green' : 'bg-red-500/20 text-red-500'}`}>
                {insight.value > 0 ? '+' : ''}{insight.value.toFixed(2)}
              </div>
              <h3 className="text-white font-medium capitalize">{insight.type.replace('_', ' ')}</h3>
            </div>
            <p className="text-subdued text-sm">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
