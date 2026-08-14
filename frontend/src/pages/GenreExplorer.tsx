import { useState, useEffect } from 'react';
import { getGenres, getGenreDetail } from '../services/api';
import { CLUSTER_COLORS } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ChevronLeft } from 'lucide-react';

export default function GenreExplorer() {
  const [genresList, setGenresList] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreDetail, setGenreDetail] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGenres()
      .then(res => setGenresList(res.genres || []))
      .catch(err => setError(err.message || 'Failed to fetch genres'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      setDetailLoading(true);
      getGenreDetail(selectedGenre)
        .then(setGenreDetail)
        .catch(err => setError(err.message || 'Failed to fetch genre detail'))
        .finally(() => setDetailLoading(false));
    }
  }, [selectedGenre]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  if (selectedGenre && genreDetail) {
    const radarData = Object.entries(genreDetail.audio_profile || {}).map(([subject, A]) => ({
      subject,
      A
    }));

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedGenre(null)}
          className="flex items-center text-subdued hover:text-white transition-colors gap-2"
        >
          <ChevronLeft size={20} /> Back to Genres
        </button>
        
        <div className="flex items-end justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white capitalize mb-2">{genreDetail.genre}</h1>
            <p className="text-subdued text-lg">
              {genreDetail.total_songs.toLocaleString()} tracks • {genreDetail.total_artists.toLocaleString()} artists • Popularity: {genreDetail.avg_popularity.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm text-subdued block mb-1">Dominant Cluster</span>
            <span 
              className="px-4 py-1.5 rounded-full text-sm font-bold text-bg-black"
              style={{ backgroundColor: CLUSTER_COLORS[genreDetail.dominant_cluster] || '#1DB954' }}
            >
              C{genreDetail.dominant_cluster}
            </span>
          </div>
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
              <h2 className="text-xl font-bold text-white mb-4">Top Songs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-subdued text-sm border-b border-zinc-800">
                      <th className="pb-3 font-medium">Track</th>
                      <th className="pb-3 font-medium">Artist</th>
                      <th className="pb-3 font-medium">Pop.</th>
                      <th className="pb-3 font-medium">Cluster</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {genreDetail.top_songs?.slice(0, 5).map((song: any) => (
                      <tr key={song.song_id} className="text-white hover:bg-zinc-800/30">
                        <td className="py-3 max-w-[200px] truncate">{song.track_name}</td>
                        <td className="py-3 max-w-[150px] truncate">{song.track_artist}</td>
                        <td className="py-3 text-sm">{song.track_popularity}</td>
                        <td className="py-3">
                          <span 
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: CLUSTER_COLORS[song.cluster] || '#fff' }}
                            title={`Cluster ${song.cluster}`}
                          />
                        </td>
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

  if (genresList.length === 0) return <EmptyState message="No genres available." />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Genres</h1>
      <p className="text-subdued">Explore audio characteristics and insights for different genres.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {genresList.map((g: any) => (
          <div 
            key={g.genre}
            onClick={() => setSelectedGenre(g.genre)}
            className="bg-surface-gray p-6 rounded-lg border border-zinc-800 hover:border-spotify-green hover:bg-zinc-800 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white capitalize group-hover:text-spotify-green transition-colors">{g.genre}</h3>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CLUSTER_COLORS[g.dominant_cluster] || '#fff' }}
                title={`Dominant Cluster: ${g.dominant_cluster}`}
              />
            </div>
            <div className="text-sm text-subdued space-y-1">
              <p>{g.total_songs.toLocaleString()} tracks</p>
              <p>{g.total_artists.toLocaleString()} artists</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
