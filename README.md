# Spotify Music Intelligence & Recommendation Platform

## Problem Statement
The music recommendations made by Spotify are excellent, generally grouping comparable features into clusters that aid in comprehending the auditory properties of diverse songs. The goal is to build an automated system from a provided dataset to perform data preprocessing, EDA, feature correlation, clustering, and song recommendations.

## Objective
To build a complete, production-quality, full-stack web application that allows users to explore a Spotify dataset, visualize analytical insights, investigate distinct song clusters based on audio properties, and receive song recommendations powered by a custom ML recommendation engine.

## Features
- **Data Explorer**: Paginated, filterable table view of all songs with cluster tags.
- **Analytics Dashboard**: Distribution charts of audio features, genre and subgenre breakdowns, and scatter plots comparing audio parameters.
- **Correlation Heatmap**: Interactive 10x10 feature correlation matrix with auto-generated key insights.
- **Cluster Explorer (Genre Galaxy)**: Interactive PCA-projected scatter plot of songs grouped by K-Means clusters, plus detailed cluster profiles.
- **Genre & Playlist Explorers**: Deep dives into specific genres and playlists with radar charts representing their average audio DNA.
- **Recommendation Engine**: Search for a seed song and discover similar tracks. Features a "Music DNA" radar chart comparison between the seed song and recommendations, alongside textual explanations of why a track was recommended based on audio similarity, cluster matching, and genre overlap.
- **Model Insights**: Explanations of preprocessing, clustering (Elbow & Silhouette methods), and the recommendation algorithm.

## Tech Stack
- **Backend**: Python 3.14, FastAPI, Pandas, NumPy, Scikit-Learn, Joblib, Uvicorn
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v4, Recharts, Lucide React, Axios
- **Architecture**: Decoupled Client-Server architecture with a RESTful JSON API

## Dataset Description
The system is built upon a dataset of `32,833` tracks and `23` columns. 
- **Identifiers**: `track_id`, `track_name`, `track_artist`, `track_album_name`
- **Playlists & Genres**: `playlist_name`, `playlist_genre` (6 distinct), `playlist_subgenre` (24 distinct)
- **Audio Features**: `danceability`, `energy`, `loudness`, `speechiness`, `acousticness`, `instrumentalness`, `liveness`, `valence`, `tempo`, `duration_ms`

## Preprocessing
- **Missing Values**: Dropped 5 rows missing critical identifiers (`track_name`/`track_artist`).
- **Data Cleaning**: Imputed invalid `tempo = 0` rows using the dataset's median tempo.
- **Deduplication**: Filtered duplicate `track_id` occurrences (tracks appearing in multiple playlists) down to the first occurrence to create a clean `28,356`-row core dataset for modeling.
- **Scaling**: All 10 numerical audio features were scaled using `StandardScaler` to have a mean of 0 and variance of 1.

## EDA & Correlation Analysis
Exploratory Data Analysis (EDA) exposes distributions and frequency counts for genres, subgenres, and artists. Correlation analysis uses a Pearson matrix across the 10 scaled audio features, identifying strong inverse relationships (e.g., energy vs. acousticness) and positive relationships (e.g., energy vs. loudness).

## Clustering Methodology
- **Algorithm**: K-Means clustering applied to the scaled audio features.
- **K Selection**: Evaluated K=2 through K=15. The optimal K was dynamically chosen by finding the peak **Silhouette Score**, ensuring the most cohesive and well-separated groupings. The Elbow method (inertia) is also calculated and exposed to the frontend.
- **Dimensionality Reduction**: Principal Component Analysis (PCA) projects the 10-dimensional space down to 2 dimensions for frontend scatter plot visualization.

## Recommendation Methodology
The recommendation engine uses a **Weighted Hybrid Scoring** approach given a seed track:
- **55% Audio Similarity**: Cosine similarity applied on the scaled audio features.
- **25% Cluster Bonus**: A flat score boost if the recommended track belongs to the same K-Means cluster.
- **20% Genre Match**: A score boost for matching the same genre (0.5x) or precise subgenre (1.0x).
*Note: This is a project-specific algorithm and not Spotify's actual proprietary recommendation algorithm.*

## Project Structure
```
project/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & startup events
│   │   ├── routes.py           # REST API endpoints
│   │   ├── data_processor.py   # Dataset loading, cleaning, scaling
│   │   ├── analytics.py        # EDA & Correlation logic
│   │   ├── clustering.py       # KMeans & PCA training
│   │   └── recommender.py      # Weighted similarity engine
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI (Layout, Spinners, Errors)
│   │   ├── pages/              # 9 distinct application views
│   │   ├── services/           # Axios API client
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # React Router setup
│   │   └── main.tsx            # React entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── data/
│   └── spotify dataset.csv     # Raw dataset
├── models/
│   ├── scaler.joblib           # Persisted StandardScaler
│   ├── kmeans_model.joblib     # Persisted KMeans model
│   └── pca.joblib              # Persisted PCA transform
└── README.md
```

## Install & Run Instructions

### 1. Start the Backend
```powershell
cd backend
# Install dependencies
pip install fastapi "uvicorn[standard]" pandas numpy scikit-learn joblib
# Run the server (auto-trains models on first startup)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*The API will be available at `http://localhost:8000`*

### 2. Start the Frontend
```powershell
cd frontend
# Install dependencies
npm install
# Run the dev server
npm run dev
```
*The app will be available at `http://localhost:5173`*

## Example API Requests
- **Get Overview**: `GET http://localhost:8000/api/overview`
- **Get Paginated Dataset**: `GET http://localhost:8000/api/dataset?page=1&per_page=20&genre=pop`
- **Search Songs**: `GET http://localhost:8000/api/songs/search?q=Ed%20Sheeran`
- **Get Recommendations**: `GET http://localhost:8000/api/recommendations/1234`

## Limitations
- **Cold Start**: The recommendation engine relies entirely on tracks existing within the provided CSV dataset. It cannot recommend songs or artists that are not pre-indexed.
- **Audio Features Only**: Similarity relies heavily on audio parameters (danceability, energy, etc.) and genre metadata rather than collaborative filtering (user listening histories), which is often what powers commercial systems.

## Future Enhancements
- Implement collaborative filtering if user-playlist interaction data becomes available.
- Add real Spotify API integration to stream audio previews of the recommended tracks.
- Implement user accounts to save favorite generated recommendations or custom playlists.
