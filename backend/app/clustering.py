import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
import joblib
import os
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ...))
MODEL_DIR = os.path.join(BASE_DIR, "models")

AUDIO_FEATURES = [
    'danceability', 'energy', 'loudness', 'speechiness', 'acousticness',
    'instrumentalness', 'liveness', 'valence', 'tempo', 'duration_ms'
]

def _generate_cluster_description(means, top_genres):
    """Auto-generate a human-readable cluster description from actual stats."""
    parts = []

    # Energy level
    if means.get('energy', 0) > 0.75:
        parts.append("high energy")
    elif means.get('energy', 0) < 0.4:
        parts.append("low energy")

    # Danceability
    if means.get('danceability', 0) > 0.72:
        parts.append("highly danceable")
    elif means.get('danceability', 0) < 0.45:
        parts.append("low danceability")

    # Acousticness
    if means.get('acousticness', 0) > 0.5:
        parts.append("acoustic")
    elif means.get('acousticness', 0) < 0.1:
        parts.append("electronic/produced")

    # Valence
    if means.get('valence', 0) > 0.65:
        parts.append("upbeat and positive")
    elif means.get('valence', 0) < 0.35:
        parts.append("moody and dark")

    # Speechiness
    if means.get('speechiness', 0) > 0.2:
        parts.append("speech-heavy (likely rap/spoken word)")

    # Instrumentalness
    if means.get('instrumentalness', 0) > 0.3:
        parts.append("instrumental-leaning")

    # Loudness
    if means.get('loudness', 0) > -5:
        parts.append("loud")
    elif means.get('loudness', 0) < -10:
        parts.append("quiet")

    # Tempo
    if means.get('tempo', 0) > 135:
        parts.append("fast tempo")
    elif means.get('tempo', 0) < 100:
        parts.append("slow tempo")

    if not parts:
        parts.append("moderate across all features")

    # Genre info
    genre_names = list(top_genres.keys())[:2]
    genre_str = " and ".join(g.upper() for g in genre_names) if genre_names else "mixed"

    trait_str = ", ".join(parts)
    return f"Songs with {trait_str}, concentrated in {genre_str} playlists"


def _generate_cluster_name(means, top_genres):
    """Generate a short cluster name from dominant traits."""
    primary_genre = list(top_genres.keys())[0].capitalize() if top_genres else "Mixed"

    if means.get('energy', 0) > 0.75 and means.get('danceability', 0) > 0.7:
        return f"High-Energy {primary_genre} Anthems"
    elif means.get('acousticness', 0) > 0.5:
        return f"Acoustic {primary_genre} Tracks"
    elif means.get('speechiness', 0) > 0.2:
        return f"Vocal-Heavy {primary_genre}"
    elif means.get('valence', 0) > 0.65:
        return f"Upbeat {primary_genre} Vibes"
    elif means.get('valence', 0) < 0.35:
        return f"Dark {primary_genre} Moods"
    elif means.get('instrumentalness', 0) > 0.3:
        return f"Instrumental {primary_genre}"
    elif means.get('energy', 0) < 0.4:
        return f"Chill {primary_genre} Sounds"
    elif means.get('tempo', 0) > 135:
        return f"Fast-Paced {primary_genre}"
    else:
        return f"Mainstream {primary_genre} Mix"


def run_clustering(scaled_features, df):
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR, exist_ok=True)

    # Evaluate K=2..15 using silhouette score on a sample for efficiency
    sample_size = min(8000, scaled_features.shape[0])
    rng = np.random.RandomState(42)
    sample_idx = rng.choice(scaled_features.shape[0], sample_size, replace=False)
    sample_features = scaled_features[sample_idx]

    best_k = 2
    best_score = -1
    elbow_data = []

    for k in range(2, 16):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=300)
        sample_labels = kmeans.fit_predict(sample_features)
        score = silhouette_score(sample_features, sample_labels)
        elbow_data.append({
            'k': k,
            'inertia': float(kmeans.inertia_),
            'silhouette': round(float(score), 4)
        })
        if score > best_score:
            best_score = score
            best_k = k

    # Train final model on full dataset with optimal K
    final_kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10, max_iter=300)
    labels = final_kmeans.fit_predict(scaled_features)

    joblib.dump(final_kmeans, os.path.join(MODEL_DIR, 'kmeans_model.joblib'))

    # PCA for 2D visualization
    pca = PCA(n_components=2, random_state=42)
    pca_coords = pca.fit_transform(scaled_features)
    explained_variance = [round(float(v), 4) for v in pca.explained_variance_ratio_]

    joblib.dump(pca, os.path.join(MODEL_DIR, 'pca.joblib'))

    # Assign cluster labels to dataframe
    df = df.copy()
    df['cluster'] = labels

    # Build per-cluster details
    cluster_details = {}
    for c in range(best_k):
        c_mask = df['cluster'] == c
        c_df = df[c_mask]

        top_genres = c_df['playlist_genre'].value_counts(normalize=True).head(3).to_dict()
        top_subgenres = c_df['playlist_subgenre'].value_counts().head(5).index.tolist()
        top_playlists = c_df['playlist_name'].value_counts().head(5).index.tolist()
        top_artists = c_df['track_artist'].value_counts().head(5).index.tolist()

        means = {str(f): round(float(c_df[f].mean()), 4) for f in AUDIO_FEATURES}

        # Representative songs (closest to cluster centroid)
        c_indices = np.where(c_mask.values)[0]
        c_centroid = scaled_features[c_indices].mean(axis=0)
        dists = np.linalg.norm(scaled_features[c_indices] - c_centroid, axis=1)
        rep_indices = c_indices[dists.argsort()[:5]]
        representative_songs = []
        for ri in rep_indices:
            row = df.iloc[ri]
            representative_songs.append({
                'song_id': int(row['song_id']),
                'track_name': str(row['track_name']),
                'track_artist': str(row['track_artist']),
                'playlist_genre': str(row['playlist_genre']),
            })

        description = _generate_cluster_description(means, top_genres)
        name = _generate_cluster_name(means, top_genres)

        cluster_details[str(c)] = {
            'name': name,
            'size': int(len(c_df)),
            'dominant_genres': {str(k): round(float(v), 3) for k, v in top_genres.items()},
            'dominant_subgenres': [str(s) for s in top_subgenres],
            'dominant_playlists': [str(p) for p in top_playlists],
            'top_artists': [str(a) for a in top_artists],
            'average_features': means,
            'description': description,
            'representative_songs': representative_songs,
        }

    # PCA scatter data (sample for frontend performance)
    max_scatter = 3000
    if len(labels) > max_scatter:
        scatter_idx = rng.choice(len(labels), max_scatter, replace=False)
    else:
        scatter_idx = np.arange(len(labels))

    pca_data = []
    for i in scatter_idx:
        row = df.iloc[i]
        pca_data.append({
            'x': round(float(pca_coords[i, 0]), 4),
            'y': round(float(pca_coords[i, 1]), 4),
            'cluster': int(labels[i]),
            'track_name': str(row['track_name']),
            'track_artist': str(row['track_artist']),
            'playlist_genre': str(row['playlist_genre']),
            'song_id': int(row['song_id']),
        })

    k_selection_reason = (
        f"Evaluated K=2 through K=15 using the Silhouette Score. "
        f"K={best_k} achieved the highest silhouette score of {best_score:.4f}, "
        f"indicating the most well-separated and cohesive clusters."
    )

    result = {
        'optimal_k': best_k,
        'best_silhouette': round(float(best_score), 4),
        'k_selection_reason': k_selection_reason,
        'elbow_data': elbow_data,
        'cluster_details': cluster_details,
        'pca_explained_variance': explained_variance,
        'pca_total_variance': round(float(sum(explained_variance)), 4),
        'pca_data': pca_data,
        'total_songs_clustered': int(len(labels)),
    }

    return result, labels, pca_coords, df
