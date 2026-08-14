import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import DataExplorer from './pages/DataExplorer';
import Analytics from './pages/Analytics';
import Correlations from './pages/Correlations';
import ClusterExplorer from './pages/ClusterExplorer';
import GenreExplorer from './pages/GenreExplorer';
import PlaylistExplorer from './pages/PlaylistExplorer';
import Recommendations from './pages/Recommendations';
import ModelInsights from './pages/ModelInsights';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/dataset" element={<DataExplorer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/correlations" element={<Correlations />} />
          <Route path="/clusters" element={<ClusterExplorer />} />
          <Route path="/genres" element={<GenreExplorer />} />
          <Route path="/playlists" element={<PlaylistExplorer />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/model" element={<ModelInsights />} />
          <Route path="*" element={<div className="flex justify-center items-center h-64 text-subdued text-xl font-bold">404 - Page not found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
