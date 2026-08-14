from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional
import numpy as np

router = APIRouter()

AUDIO_FEATURES = [
    'danceability', 'energy', 'loudness', 'speechiness', 'acousticness',
    'instrumentalness', 'liveness', 'valence', 'tempo', 'duration_ms'
]


def get_app_state(request: Request):
    return request.app.state


@router.get("/api/overview")
async def get_overview(request: Request):
    state = get_app_state(request)
    overview = state.analytics['overview']
    insights = state.analytics['insights']

    # Add cluster count
    overview['total_clusters'] = state.clustering['optimal_k']

    # Top insight cards
    insight_cards = []

    # Most represented genre
    genre_data = state.analytics['genre_breakdown']
    if genre_data:
        top_genre = max(genre_data, key=genre_data.get)
        insight_cards.append({
            'title': 'Most Represented Genre',
            'value': top_genre.upper(),
            'detail': f'{genre_data[top_genre]:,} songs'
        })

    # Largest cluster
    cluster_details = state.clustering['cluster_details']
    largest_cluster_id = max(cluster_details, key=lambda k: cluster_details[k]['size'])
    largest = cluster_details[largest_cluster_id]
    insight_cards.append({
        'title': 'Largest Cluster',
        'value': largest['name'],
        'detail': f'{largest["size"]:,} songs (Cluster {largest_cluster_id})'
    })

    # Strongest correlation
    if insights:
        strongest = insights[0]
        insight_cards.append({
            'title': 'Strongest Correlation',
            'value': f'{strongest["value"]:.3f}',
            'detail': strongest['text']
        })

    return {
        'overview': overview,
        'insights': insights,
        'insight_cards': insight_cards,
        'cluster_summary': {
            'total_clusters': state.clustering['optimal_k'],
            'best_silhouette': state.clustering.get('best_silhouette'),
        }
    }


@router.get("/api/dataset")
async def get_dataset(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    genre: Optional[str] = None,
    playlist: Optional[str] = None,
    cluster: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc"
):
    state = get_app_state(request)
    df = state.dedup_df.copy()

    if genre:
        df = df[df['playlist_genre'] == genre]
    if playlist:
        df = df[df['playlist_name'] == playlist]
    if cluster is not None:
        df = df[df['cluster'] == cluster]
    if search:
        mask = (
            df['track_name'].str.contains(search, case=False, na=False) |
            df['track_artist'].str.contains(search, case=False, na=False)
        )
        df = df[mask]

    if sort_by and sort_by in df.columns:
        ascending = sort_order != "desc"
        df = df.sort_values(by=sort_by, ascending=ascending)

    total = len(df)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = df.iloc[start:end]

    # Select columns for response
    cols = ['song_id', 'track_name', 'track_artist', 'track_album_name',
            'playlist_genre', 'playlist_subgenre', 'track_popularity',
            'danceability', 'energy', 'valence', 'tempo', 'loudness',
            'speechiness', 'acousticness', 'instrumentalness', 'liveness',
            'duration_ms', 'cluster']
    available_cols = [c for c in cols if c in paginated.columns]
    result = paginated[available_cols].replace({float('nan'): None})

    # Available filter values
    filters = {
        'genres': sorted(state.dedup_df['playlist_genre'].unique().tolist()),
        'clusters': sorted(state.dedup_df['cluster'].unique().tolist()),
    }

    return {
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': max(1, (total + per_page - 1) // per_page),
        'data': result.to_dict(orient='records'),
        'filters': filters,
    }


@router.get("/api/analytics")
async def get_analytics(request: Request):
    state = get_app_state(request)
    return state.analytics


@router.get("/api/correlation")
async def get_correlation(request: Request):
    state = get_app_state(request)
    return {
        'correlation': state.analytics['correlation'],
        'insights': state.analytics['insights'],
    }


@router.get("/api/clusters")
async def get_clusters(request: Request):
    state = get_app_state(request)
    return state.clustering


@router.get("/api/clusters/{cluster_id}")
async def get_cluster_detail(request: Request, cluster_id: str):
    state = get_app_state(request)
    if cluster_id not in state.clustering['cluster_details']:
        raise HTTPException(status_code=404, detail="Cluster not found")

    detail = state.clustering['cluster_details'][cluster_id]

    # Also get songs in this cluster (paginated, top 20)
    cluster_int = int(cluster_id)
    c_df = state.dedup_df[state.dedup_df['cluster'] == cluster_int]
    songs = c_df.head(20)[['song_id', 'track_name', 'track_artist', 'playlist_genre',
                            'track_popularity']].replace({float('nan'): None}).to_dict(orient='records')

    return {
        **detail,
        'cluster_id': cluster_id,
        'songs': songs,
    }


@router.get("/api/genres")
async def get_genres(request: Request):
    state = get_app_state(request)
    df = state.dedup_df

    genres = []
    for genre in sorted(df['playlist_genre'].unique()):
        g_df = df[df['playlist_genre'] == genre]
        genres.append({
            'genre': genre,
            'total_songs': int(len(g_df)),
            'total_artists': int(g_df['track_artist'].nunique()),
            'avg_popularity': round(float(g_df['track_popularity'].mean()), 1),
            'dominant_cluster': int(g_df['cluster'].mode().iloc[0]) if len(g_df) > 0 else 0,
        })

    return {'genres': genres}


@router.get("/api/genres/{genre}")
async def get_genre_detail(request: Request, genre: str):
    state = get_app_state(request)
    df = state.dedup_df
    genre_df = df[df['playlist_genre'] == genre]
    if len(genre_df) == 0:
        raise HTTPException(status_code=404, detail="Genre not found")

    # Audio profile
    audio_profile = {f: round(float(genre_df[f].mean()), 4) for f in AUDIO_FEATURES}

    # Top artists
    top_artists = genre_df['track_artist'].value_counts().head(10)

    # Top playlists
    full_genre = state.full_df[state.full_df['playlist_genre'] == genre]
    top_playlists = full_genre['playlist_name'].value_counts().head(10)

    # Subgenres
    subgenres = genre_df['playlist_subgenre'].value_counts().to_dict()

    # Cluster distribution
    cluster_dist = genre_df['cluster'].value_counts().to_dict()
    dominant_cluster = int(genre_df['cluster'].mode().iloc[0])

    # Top songs (by popularity)
    top_songs = genre_df.nlargest(10, 'track_popularity')[
        ['song_id', 'track_name', 'track_artist', 'track_popularity', 'cluster']
    ].replace({float('nan'): None}).to_dict(orient='records')

    return {
        'genre': genre,
        'total_songs': int(len(genre_df)),
        'total_artists': int(genre_df['track_artist'].nunique()),
        'avg_popularity': round(float(genre_df['track_popularity'].mean()), 1),
        'audio_profile': audio_profile,
        'top_artists': {str(k): int(v) for k, v in top_artists.items()},
        'top_playlists': {str(k): int(v) for k, v in top_playlists.items()},
        'subgenres': {str(k): int(v) for k, v in subgenres.items()},
        'cluster_distribution': {str(k): int(v) for k, v in cluster_dist.items()},
        'dominant_cluster': dominant_cluster,
        'top_songs': top_songs,
    }


@router.get("/api/playlists")
async def get_playlists(request: Request):
    state = get_app_state(request)
    df = state.full_df
    playlists = []
    for name, count in df['playlist_name'].value_counts().head(50).items():
        pl_df = df[df['playlist_name'] == name]
        playlists.append({
            'playlist_name': str(name),
            'total_songs': int(count),
            'genres': pl_df['playlist_genre'].unique().tolist(),
            'genre': str(pl_df['playlist_genre'].mode().iloc[0]) if len(pl_df) > 0 else '',
        })
    return {'playlists': playlists}


@router.get("/api/playlists/{playlist}")
async def get_playlist_detail(request: Request, playlist: str):
    state = get_app_state(request)
    df = state.full_df
    pl_df = df[df['playlist_name'] == playlist]
    if len(pl_df) == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Audio profile
    audio_profile = {f: round(float(pl_df[f].mean()), 4) for f in AUDIO_FEATURES}

    # Genre distribution
    genres = pl_df['playlist_genre'].value_counts().to_dict()

    # Top artists
    top_artists = pl_df['track_artist'].value_counts().head(10).to_dict()

    # Songs
    songs = pl_df.head(20)[
        ['track_name', 'track_artist', 'playlist_genre', 'track_popularity']
    ].replace({float('nan'): None}).to_dict(orient='records')

    return {
        'playlist': playlist,
        'total_songs': int(len(pl_df)),
        'genres': {str(k): int(v) for k, v in genres.items()},
        'audio_profile': audio_profile,
        'top_artists': {str(k): int(v) for k, v in top_artists.items()},
        'songs': songs,
        'subgenre': str(pl_df['playlist_subgenre'].mode().iloc[0]) if len(pl_df) > 0 else '',
    }


@router.get("/api/songs/search")
async def search_songs(request: Request, q: str = "", limit: int = 20):
    state = get_app_state(request)
    df = state.dedup_df
    if not q or len(q.strip()) == 0:
        return {'results': []}

    mask = (
        df['track_name'].str.contains(q, case=False, na=False) |
        df['track_artist'].str.contains(q, case=False, na=False)
    )
    results = df[mask].head(limit)[
        ['song_id', 'track_name', 'track_artist', 'track_album_name',
         'playlist_genre', 'playlist_subgenre', 'track_popularity', 'cluster']
    ].replace({float('nan'): None}).to_dict(orient='records')

    return {'results': results}


@router.get("/api/songs/{song_id}")
async def get_song(request: Request, song_id: int):
    state = get_app_state(request)
    df = state.dedup_df
    song = df[df['song_id'] == song_id]
    if len(song) == 0:
        raise HTTPException(status_code=404, detail="Song not found")

    row = song.iloc[0]
    audio = {f: float(row[f]) for f in AUDIO_FEATURES}

    return {
        'song_id': int(row['song_id']),
        'track_name': str(row['track_name']),
        'track_artist': str(row['track_artist']),
        'track_album_name': str(row.get('track_album_name', '')),
        'playlist_genre': str(row['playlist_genre']),
        'playlist_subgenre': str(row['playlist_subgenre']),
        'track_popularity': int(row['track_popularity']),
        'cluster': int(row['cluster']),
        'audio_features': audio,
    }


@router.get("/api/recommendations/{song_id}")
async def get_song_recommendations(request: Request, song_id: int):
    from .recommender import get_recommendations
    state = get_app_state(request)
    result = get_recommendations(
        song_id, state.dedup_df, state.scaled_features,
        state.labels, state.features, 10
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Song not found")
    return result


@router.get("/api/model")
async def get_model_info(request: Request):
    state = get_app_state(request)
    clustering = state.clustering

    return {
        'preprocessing': state.preprocessing_stats,
        'clustering': {
            'method': 'K-Means',
            'optimal_k': clustering['optimal_k'],
            'best_silhouette': clustering.get('best_silhouette'),
            'k_selection_reason': clustering.get('k_selection_reason', ''),
            'elbow_data': clustering['elbow_data'],
            'pca_explained_variance': clustering['pca_explained_variance'],
            'pca_total_variance': clustering.get('pca_total_variance'),
            'total_songs_clustered': clustering.get('total_songs_clustered'),
        },
        'recommendation': {
            'method': 'Weighted Hybrid Scoring',
            'weights': {
                'audio_similarity': 0.55,
                'cluster_bonus': 0.25,
                'genre_match': 0.20,
            },
            'similarity_metric': 'Cosine Similarity',
            'features_used': state.features,
            'description': (
                'Recommendations combine cosine similarity on scaled audio features (55%), '
                'cluster membership bonus (25%), and genre/subgenre matching (20%). '
                'Audio features are standardized using the same fitted scaler from training.'
            ),
        },
        'architecture': [
            {'step': 1, 'name': 'Dataset Loading', 'detail': 'Load spotify dataset.csv (32,833 rows × 23 columns)'},
            {'step': 2, 'name': 'Preprocessing', 'detail': 'Drop nulls, impute tempo=0, deduplicate by track_id'},
            {'step': 3, 'name': 'Feature Engineering', 'detail': '10 audio features selected for clustering'},
            {'step': 4, 'name': 'Scaling', 'detail': 'StandardScaler normalization (zero mean, unit variance)'},
            {'step': 5, 'name': 'Clustering', 'detail': f'K-Means with K={clustering["optimal_k"]} (silhouette-optimized)'},
            {'step': 6, 'name': 'Dimensionality Reduction', 'detail': 'PCA to 2D for visualization'},
            {'step': 7, 'name': 'Similarity Engine', 'detail': 'Cosine similarity + cluster + genre weighted scoring'},
            {'step': 8, 'name': 'Recommendation', 'detail': 'Top-N tracks with per-feature explanations'},
        ],
    }
