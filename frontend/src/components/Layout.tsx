import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, BarChart3, TrendingUp, ScatterChart, Music, ListMusic, Sparkles, Cpu } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-bg-black text-text-white font-sans">
      <aside className="w-64 bg-surface-gray flex flex-col hidden md:flex border-r border-gray-800">
        <div className="p-6">
          <h1 className="text-xl font-bold text-spotify-green">Spotify Music Intelligence</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavLink to="/" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><LayoutDashboard size={20} /> Overview</NavLink>
          <NavLink to="/dataset" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><Database size={20} /> Data Explorer</NavLink>
          <NavLink to="/analytics" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><BarChart3 size={20} /> Analytics</NavLink>
          <NavLink to="/correlations" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><TrendingUp size={20} /> Correlations</NavLink>
          <NavLink to="/clusters" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><ScatterChart size={20} /> Cluster Explorer</NavLink>
          <NavLink to="/genres" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><Music size={20} /> Genre Explorer</NavLink>
          <NavLink to="/playlists" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><ListMusic size={20} /> Playlist Explorer</NavLink>
          <NavLink to="/recommendations" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><Sparkles size={20} /> Recommendations</NavLink>
          <NavLink to="/model" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-bg-black text-spotify-green' : 'hover:bg-bg-black'}`}><Cpu size={20} /> Model Insights</NavLink>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-bg-black">
        <header className="h-16 border-b border-surface-gray flex items-center justify-between px-6 bg-surface-gray md:bg-transparent">
            <div className="md:hidden font-bold text-spotify-green">Spotify Music Intelligence</div>
            <div className="hidden md:flex flex-1"></div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-bg-black">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
