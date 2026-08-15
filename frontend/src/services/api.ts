import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const getOverview = async () => {
  const { data } = await api.get('/overview');
  return data;
};

export const getDataset = async (params: Record<string, any> = {}) => {
  const { data } = await api.get('/dataset', { params });
  return data;
};

export const getAnalytics = async () => {
  const { data } = await api.get('/analytics');
  return data;
};

export const getCorrelation = async () => {
  const { data } = await api.get('/correlation');
  return data;
};

export const getClusters = async () => {
  const { data } = await api.get('/clusters');
  return data;
};

export const getClusterDetail = async (clusterId: string | number) => {
  const { data } = await api.get(`/clusters/${clusterId}`);
  return data;
};

export const getGenres = async () => {
  const { data } = await api.get('/genres');
  return data;
};

export const getGenreDetail = async (genre: string) => {
  const { data } = await api.get(
    `/genres/${encodeURIComponent(genre)}`
  );
  return data;
};

export const getPlaylists = async () => {
  const { data } = await api.get('/playlists');
  return data;
};

export const getPlaylistDetail = async (playlist: string) => {
  const { data } = await api.get(
    `/playlists/${encodeURIComponent(playlist)}`
  );
  return data;
};

export const searchSongs = async (
  q: string,
  limit: number = 10
) => {
  const { data } = await api.get('/songs/search', {
    params: { q, limit },
  });
  return data;
};

export const getSong = async (songId: number) => {
  const { data } = await api.get(`/songs/${songId}`);
  return data;
};

export const getRecommendations = async (songId: number) => {
  const { data } = await api.get(`/recommendations/${songId}`);
  return data;
};

export const getModelInfo = async () => {
  const { data } = await api.get('/model');
  return data;
};
