export interface Song {
  song_id: number;
  track_name: string;
  track_artist: string;
  track_album_name?: string;
  playlist_genre: string;
  playlist_subgenre: string;
  track_popularity: number;
  danceability: number;
  energy: number;
  loudness: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  cluster: number;
  audio_features?: Record<string, number>;
}

export interface OverviewResponse {
  overview: {
    total_songs: number;
    total_artists: number;
    total_playlists: number;
    total_genres: number;
    total_subgenres: number;
    total_clusters?: number;
  };
  insights: Array<{
    type: string;
    text: string;
    value: number;
  }>;
  insight_cards: Array<{
    title: string;
    value: string;
    detail: string;
  }>;
  cluster_summary: {
    total_clusters: number;
    best_silhouette: number;
  };
}

export interface DatasetResponse {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  data: Song[];
  filters: {
    genres: string[];
    clusters: number[];
  };
}

export interface Recommendation {
  rank: number;
  song_id: number;
  track_name: string;
  track_artist: string;
  track_album_name: string;
  playlist_genre: string;
  playlist_subgenre: string;
  cluster: number;
  overall_score: number;
  audio_similarity: number;
  cluster_match: boolean;
  genre_match: string;
  feature_similarity: Record<string, number>;
  audio_features: Record<string, number>;
  explanation: string;
}

export interface RecommendationResponse {
  seed_song: {
    song_id: number;
    track_name: string;
    track_artist: string;
    track_album_name: string;
    playlist_genre: string;
    playlist_subgenre: string;
    cluster: number;
    audio_features: Record<string, number>;
  };
  recommendations: Recommendation[];
  methodology: {
    weights: Record<string, number>;
    similarity_metric: string;
    features_used: string[];
  };
}

export interface ClusterDetail {
  name: string;
  size: number;
  dominant_genres: Record<string, number>;
  dominant_subgenres: string[];
  dominant_playlists: string[];
  top_artists: string[];
  average_features: Record<string, number>;
  description: string;
  representative_songs: Array<{
    song_id: number;
    track_name: string;
    track_artist: string;
    playlist_genre: string;
  }>;
}

export interface ClusterData {
  optimal_k: number;
  best_silhouette: number;
  k_selection_reason: string;
  elbow_data: Array<{
    k: number;
    inertia: number;
    silhouette: number;
  }>;
  cluster_details: Record<string, ClusterDetail>;
  pca_explained_variance: number[];
  pca_total_variance: number;
  pca_data: Array<{
    x: number;
    y: number;
    cluster: number;
    track_name: string;
    track_artist: string;
    playlist_genre: string;
    song_id: number;
  }>;
  total_songs_clustered: number;
}

export interface CorrelationData {
  correlation: {
    features: string[];
    matrix: number[][];
  };
  insights: Array<{
    type: string;
    text: string;
    value: number;
  }>;
}

export interface GenreInfo {
  genre: string;
  total_songs: number;
  total_artists: number;
  avg_popularity: number;
  dominant_cluster: number;
}

export interface GenreDetail {
  genre: string;
  total_songs: number;
  total_artists: number;
  avg_popularity: number;
  audio_profile: Record<string, number>;
  top_artists: Record<string, number>;
  top_playlists: Record<string, number>;
  subgenres: Record<string, number>;
  cluster_distribution: Record<string, number>;
  dominant_cluster: number;
  top_songs: Song[];
}

export interface PlaylistInfo {
  playlist_name: string;
  total_songs: number;
  genres: string[];
  genre: string;
}

export interface PlaylistDetail {
  playlist: string;
  total_songs: number;
  genres: Record<string, number>;
  audio_profile: Record<string, number>;
  top_artists: Record<string, number>;
  songs: Array<{
    track_name: string;
    track_artist: string;
    playlist_genre: string;
    track_popularity: number;
  }>;
  subgenre: string;
}

export interface ModelInfo {
  preprocessing: {
    original_rows: number;
    final_rows: number;
    duplicates_handled: number;
    missing_handled: number;
    num_features: number;
    cat_features: string[];
    features_used: string[];
  };
  clustering: {
    method: string;
    optimal_k: number;
    best_silhouette: number;
    k_selection_reason: string;
    elbow_data: Array<{ k: number; inertia: number; silhouette: number }>;
    pca_explained_variance: number[];
    pca_total_variance: number;
    total_songs_clustered: number;
  };
  recommendation: {
    method: string;
    weights: Record<string, number>;
    similarity_metric: string;
    features_used: string[];
    description: string;
  };
  architecture: Array<{
    step: number;
    name: string;
    detail: string;
  }>;
}

export const CLUSTER_COLORS: Record<number, string> = {
  0: '#1DB954',
  1: '#E8A838',
  2: '#E05A5A',
  3: '#5A9FE0',
  4: '#B05AE0',
  5: '#5AE0B0',
  6: '#E0A85A',
  7: '#E05AB0',
  8: '#5AE0E0',
  9: '#A8E05A',
};
