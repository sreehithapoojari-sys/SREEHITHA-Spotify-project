import { useState, useEffect } from 'react';
import { getPlaylists, getPlaylistDetail } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Search, ChevronLeft } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function PlaylistExplorer() {
  const [playlistsList, setPlaylistsList] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistDetail, setPlaylistDetail] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPlaylists()
      .then(res => setPlaylistsList(res.playlists || []))
      .catch(err => setError(err.message || 'Failed to fetch playlists'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      setDetailLoading(true);
      getPlaylistDetail(selectedPlaylist)
        .then(setPlaylistDetail)
        .catch(err => setError(err.message || 'Failed to fetch playlist detail'))
        .finally(() => setDetailLoading(false));
    }
  }, [selectedPlaylist]);

  const filteredPlaylists = playlistsList.filter(p => 
    p.playlist_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  if (selectedPlaylist && playlistDetail) {
    const radarData = Object.entries(playlistDetail.audio_profile || {}).map(([subject, A]) => ({
      subject,
      A
    }));

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedPlaylist(null)}
          className="flex items-center text-subdued hover:text-white transition-colors gap-2"
        >
          <ChevronLeft size={20} /> Back to Playlists
        </button>
        
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">{playlistDetail.playlist}</h1>
          <p className="text-subdued text-lg">
            {playlistDetail.total_songs.toLocaleString()} tracks • Primary Genre: <span className="capitalize">{playlistDetail.subgenre}</span>
          </p>
        </div>

        {detailLoading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800">
              <h2 className="text-xl font-bold text-white mb-4">Audio Profile</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#282828" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#B3B3B3', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                    <Radar name="Audio Profile" dataKey="A" stroke="#1DB954" fill="#1DB954" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-gray p-6 rounded-lg border border-zinc-800 lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-4">Sample Tracks</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-subdued text-sm border-b border-zinc-800">
                      <th className="pb-3 font-medium">Track</th>
                      <th className="pb-3 font-medium">Artist</th>
                      <th className="pb-3 font-medium">Pop.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {playlistDetail.songs?.slice(0, 8).map((song: any, i: number) => (
                      <tr key={i} className="text-white hover:bg-zinc-800/30">
                        <td className="py-3 max-w-[200px] truncate">{song.track_name}</td>
                        <td className="py-3 max-w-[150px] truncate">{song.track_artist}</td>
                        <td className="py-3 text-sm">{song.track_popularity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Playlists</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subdued w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search playlists..."
            className="bg-surface-gray text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-spotify-green w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {filteredPlaylists.length === 0 ? (
        <EmptyState message="No playlists found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlaylists.slice(0, 50).map((p: any) => (
            <div 
              key={p.playlist_name}
              onClick={() => setSelectedPlaylist(p.playlist_name)}
              className="bg-surface-gray p-6 rounded-lg border border-zinc-800 hover:border-spotify-green hover:bg-zinc-800 cursor-pointer transition-all group"
            >
              <h3 className="text-lg font-bold text-white truncate mb-2 group-hover:text-spotify-green transition-colors" title={p.playlist_name}>
                {p.playlist_name}
              </h3>
              <div className="text-sm text-subdued">
                <p className="mb-1">{p.total_songs.toLocaleString()} tracks</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.genres?.slice(0, 3).map((g: string) => (
                    <span key={g} className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] uppercase">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
