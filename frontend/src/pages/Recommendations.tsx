import { useEffect, useState } from 'react';
import { searchSongs, getRecommendations } from '../services/api';
import { Recommendation, RecommendationResponse } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Search, Music, Disc, BarChart3 } from 'lucide-react';
import { CLUSTER_COLORS } from '../types';

const RADAR_FEATURES = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'speechiness', 'liveness'];

export default function Recommendations() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recData, setRecData] = useState<RecommendationResponse | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState('');
  const [compareSong, setCompareSong] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await searchSongs(query, 8);
        setSearchResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (song: any) => {
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setLoadingRecs(true);
    setError('');
    setCompareSong(null);
    try {
      const data = await getRecommendations(song.song_id);
      setRecData(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setLoadingRecs(false);
    }
  };

  const buildRadarData = (features1: Record<string, number>, features2?: Record<string, number>) => {
    return RADAR_FEATURES.map(f => ({
      feature: f.charAt(0).toUpperCase() + f.slice(1),
      seed: features1[f] || 0,
      ...(features2 ? { recommended: features2[f] || 0 } : {}),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Recommendations</h1>
        <p className="text-subdued">Search for a song to discover similar music powered by audio analysis</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-subdued w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a song or artist..."
            className="w-full bg-surface-gray text-white p-4 pl-12 rounded-lg outline-none focus:ring-2 focus:ring-spotify-green text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-surface-gray rounded-lg shadow-2xl z-50 overflow-hidden border border-[#333]">
            {searchResults.map((song) => (
              <button
                key={song.song_id}
                className="w-full text-left p-4 hover:bg-[#333] transition-colors flex justify-between items-center border-b border-[#1a1a1a] last:border-0"
                onClick={() => handleSelect(song)}
              >
                <div className="flex items-center gap-3">
                  <Music className="w-4 h-4 text-subdued flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white">{song.track_name}</div>
                    <div className="text-sm text-subdued">{song.track_artist} &middot; {song.playlist_genre}</div>
                  </div>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: CLUSTER_COLORS[song.cluster] || '#666', color: '#191414' }}
                >
                  C{song.cluster}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingRecs && <LoadingSpinner />}
      {error && <ErrorState message={error} onRetry={() => setError('')} />}
      {!recData && !loadingRecs && !error && <EmptyState message="Search for a song to discover similar music." />}

      {recData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seed Song Panel */}
          <div className="space-y-4">
            <div className="bg-surface-gray rounded-lg p-6">
              <p className="text-xs text-subdued font-bold uppercase tracking-wider mb-3">Seed Song</p>
              <h2 className="text-2xl font-bold text-white mb-1">{recData.seed_song.track_name}</h2>
              <p className="text-spotify-green text-lg mb-3">{recData.seed_song.track_artist}</p>
              {recData.seed_song.track_album_name && (
                <p className="text-subdued text-sm mb-4">{recData.seed_song.track_album_name}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-[#333] text-xs rounded-full text-subdued">
                  {recData.seed_song.playlist_genre}
                </span>
                <span className="px-3 py-1 bg-[#333] text-xs rounded-full text-subdued">
                  {recData.seed_song.playlist_subgenre}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: CLUSTER_COLORS[recData.seed_song.cluster] || '#666', color: '#191414' }}
                >
                  Cluster {recData.seed_song.cluster}
                </span>
              </div>
            </div>

            {/* Seed Audio Profile Radar */}
            <div className="bg-surface-gray rounded-lg p-6">
              <p className="text-xs text-subdued font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Music DNA
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={buildRadarData(
                    recData.seed_song.audio_features,
                    compareSong?.audio_features
                  )}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="feature" tick={{ fill: '#B3B3B3', fontSize: 11 }} />
                    <Radar name={recData.seed_song.track_name} dataKey="seed"
                      stroke="#1DB954" fill="#1DB954" fillOpacity={0.3} />
                    {compareSong && (
                      <Radar name={compareSong.track_name} dataKey="recommended"
                        stroke="#E8A838" fill="#E8A838" fillOpacity={0.2} />
                    )}
                    <Legend wrapperStyle={{ fontSize: 11, color: '#B3B3B3' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {compareSong && (
                <p className="text-xs text-subdued mt-2 text-center">
                  Comparing with: {compareSong.track_name}
                </p>
              )}
            </div>
          </div>

          {/* Recommendations List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Disc className="w-5 h-5 text-spotify-green" />
              Similar Songs ({recData.recommendations.length})
            </h2>
            {recData.recommendations.map((rec) => (
              <div
                key={rec.song_id}
                className={`bg-surface-gray rounded-lg p-4 cursor-pointer transition-all hover:bg-[#333] ${
                  compareSong?.song_id === rec.song_id ? 'ring-1 ring-spotify-green' : ''
                }`}
                onClick={() => setCompareSong(compareSong?.song_id === rec.song_id ? null : rec)}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="text-2xl font-bold text-subdued w-8 text-center flex-shrink-0">
                    #{rec.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-lg truncate">{rec.track_name}</div>
                    <div className="text-subdued text-sm">{rec.track_artist}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-spotify-green/20 text-spotify-green px-2 py-0.5 rounded-full font-semibold">
                        {(rec.overall_score * 100).toFixed(1)}% Match
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          backgroundColor: rec.cluster_match ? '#1DB95430' : '#E05A5A30',
                          color: rec.cluster_match ? '#1DB954' : '#E05A5A',
                        }}
                      >
                        {rec.cluster_match ? 'Same Cluster' : `Cluster ${rec.cluster}`}
                      </span>
                      <span className="text-xs bg-[#333] text-subdued px-2 py-0.5 rounded-full">
                        {rec.genre_match}
                      </span>
                    </div>
                    <p className="text-xs text-subdued mt-2 leading-relaxed">{rec.explanation}</p>
                  </div>
                  <div className="text-xs text-subdued flex-shrink-0 text-right hidden md:block">
                    <div>Audio: {(rec.audio_similarity * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Methodology Note */}
            <div className="bg-surface-gray/50 rounded-lg p-4 mt-4">
              <p className="text-xs text-subdued">
                <strong className="text-white">How it works:</strong> Recommendations use a weighted combination of
                audio feature similarity ({(recData.methodology.weights.audio_similarity * 100)}%),
                cluster membership ({(recData.methodology.weights.cluster_bonus * 100)}%),
                and genre matching ({(recData.methodology.weights.genre_match * 100)}%).
                Click any recommendation to compare its Music DNA with the seed song.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
