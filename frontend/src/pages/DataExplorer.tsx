import { useState, useEffect } from 'react';
import { getDataset } from '../services/api';
import { CLUSTER_COLORS } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataExplorer() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDataset({ page, per_page: 20, search, genre });
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dataset');
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce for search
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [page, search, genre]);

  if (error) return <ErrorState message={error} />;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleGenre = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGenre(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Data Explorer</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subdued w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search tracks or artists..."
              className="bg-surface-gray text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-spotify-green w-full sm:w-64"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-subdued w-5 h-5" />
            <select
              className="bg-surface-gray text-white pl-10 pr-8 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-spotify-green appearance-none w-full sm:w-48"
              value={genre}
              onChange={handleGenre}
            >
              <option value="">All Genres</option>
              {data?.filters?.genres?.map((g: string) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <LoadingSpinner />
      ) : data?.data?.length === 0 ? (
        <EmptyState message="No tracks found matching your criteria." />
      ) : (
        <div className="bg-surface-gray rounded-lg border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-black text-subdued text-sm uppercase">
                  <th className="p-4 font-medium">Track</th>
                  <th className="p-4 font-medium">Artist</th>
                  <th className="p-4 font-medium">Genre</th>
                  <th className="p-4 font-medium">Pop.</th>
                  <th className="p-4 font-medium">Dance</th>
                  <th className="p-4 font-medium">Energy</th>
                  <th className="p-4 font-medium">Cluster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data?.data?.map((track: any) => (
                  <tr key={track.song_id} className="hover:bg-zinc-800/50 transition-colors text-white">
                    <td className="p-4 max-w-[200px] truncate" title={track.track_name}>{track.track_name}</td>
                    <td className="p-4 max-w-[150px] truncate" title={track.track_artist}>{track.track_artist}</td>
                    <td className="p-4 text-sm"><span className="bg-zinc-800 px-2 py-1 rounded-full">{track.playlist_genre}</span></td>
                    <td className="p-4 text-sm">{track.track_popularity}</td>
                    <td className="p-4 text-sm">{Number(track.danceability).toFixed(2)}</td>
                    <td className="p-4 text-sm">{Number(track.energy).toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-bold text-bg-black" style={{ backgroundColor: CLUSTER_COLORS[track.cluster] || '#fff' }}>
                        C{track.cluster}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-subdued text-sm">
            <div>
              Showing {((data?.page - 1) * data?.per_page) + 1} to {Math.min(data?.page * data?.per_page, data?.total)} of {data?.total} entries
            </div>
            <div className="flex gap-2">
              <button 
                disabled={data?.page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={data?.page >= data?.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
