import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

AUDIO_FEATURES = [
    'danceability', 'energy', 'loudness', 'speechiness', 'acousticness',
    'instrumentalness', 'liveness', 'valence', 'tempo', 'duration_ms'
]

# Features shown in the "Music DNA" radar (0-1 scale ones)
RADAR_FEATURES = ['danceability', 'energy', 'valence', 'acousticness',
                  'instrumentalness', 'speechiness', 'liveness']


def get_recommendations(song_id, dedup_df, scaled_features, labels, features, num_recs=10):
    """Get song recommendations using weighted combination of audio similarity,
    cluster relevance, and metadata matching.

    Weights:
      - 0.55: Cosine similarity on scaled audio features
      - 0.25: Cluster membership bonus (1.0 if same cluster)
      - 0.20: Genre/subgenre match (1.0 same subgenre, 0.5 same genre)
    """
    match = dedup_df[dedup_df['song_id'] == song_id]
    if len(match) == 0:
        return None

    idx = match.index[0]
    pos = dedup_df.index.get_loc(idx)

    target_vec = scaled_features[pos].reshape(1, -1)
    target_cluster = int(labels[pos])
    target_genre = str(dedup_df.iloc[pos]['playlist_genre'])
    target_subgenre = str(dedup_df.iloc[pos]['playlist_subgenre'])

    # 1. Cosine similarity on scaled audio features
    cos_sims = cosine_similarity(target_vec, scaled_features)[0]
    # Normalize to 0-1 range
    cos_sims = (cos_sims + 1) / 2

    # 2. Cluster membership bonus
    cluster_bonus = (labels == target_cluster).astype(float)

    # 3. Genre/subgenre match
    genre_vals = dedup_df['playlist_genre'].values
    subgenre_vals = dedup_df['playlist_subgenre'].values
    genre_match = np.zeros(len(dedup_df))
    genre_match[genre_vals == target_genre] = 0.5
    genre_match[subgenre_vals == target_subgenre] = 1.0

    # Weighted final score
    final_scores = 0.55 * cos_sims + 0.25 * cluster_bonus + 0.20 * genre_match

    # Sort and exclude the seed song
    sorted_indices = final_scores.argsort()[::-1]
    top_indices = [i for i in sorted_indices if i != pos][:num_recs]

    # Build recommendation results
    seed_row = dedup_df.iloc[pos]
    seed_features = {f: float(seed_row[f]) for f in AUDIO_FEATURES}

    recommendations = []
    for rank, i in enumerate(top_indices, 1):
        row = dedup_df.iloc[i]

        # Per-feature similarity (1 - normalized absolute difference in scaled space)
        feature_similarity = {}
        for f_idx, feat in enumerate(features):
            diff = abs(float(scaled_features[i][f_idx] - target_vec[0][f_idx]))
            # Convert to similarity (lower diff = higher similarity)
            sim = max(0, 1 - diff / 4)  # divide by 4 to normalize (most values within 4 std devs)
            feature_similarity[feat] = round(sim, 3)

        # Raw feature values for the recommended song
        rec_features = {f: float(row[f]) for f in AUDIO_FEATURES}

        # Cluster relationship
        rec_cluster = int(labels[i])
        cluster_rel = "Same Cluster" if rec_cluster == target_cluster else f"Different (Cluster {rec_cluster})"

        # Genre relationship
        rec_genre = str(row['playlist_genre'])
        rec_subgenre = str(row['playlist_subgenre'])
        if rec_subgenre == target_subgenre:
            genre_rel = "Same Subgenre"
        elif rec_genre == target_genre:
            genre_rel = "Same Genre"
        else:
            genre_rel = "Different Genre"

        # Generate explanation text
        explanation = _generate_explanation(
            feature_similarity, cluster_rel, genre_rel,
            rec_genre, rec_subgenre, features
        )

        recommendations.append({
            'rank': rank,
            'song_id': int(row['song_id']),
            'track_name': str(row['track_name']),
            'track_artist': str(row['track_artist']),
            'track_album_name': str(row.get('track_album_name', '')),
            'playlist_genre': rec_genre,
            'playlist_subgenre': rec_subgenre,
            'cluster': rec_cluster,
            'overall_score': round(float(final_scores[i]), 4),
            'audio_similarity': round(float(cos_sims[i]), 4),
            'cluster_match': rec_cluster == target_cluster,
            'genre_match': genre_rel,
            'feature_similarity': feature_similarity,
            'audio_features': rec_features,
            'explanation': explanation,
        })

    # Seed song info
    seed_info = {
        'song_id': int(seed_row['song_id']),
        'track_name': str(seed_row['track_name']),
        'track_artist': str(seed_row['track_artist']),
        'track_album_name': str(seed_row.get('track_album_name', '')),
        'playlist_genre': target_genre,
        'playlist_subgenre': target_subgenre,
        'cluster': target_cluster,
        'audio_features': seed_features,
    }

    return {
        'seed_song': seed_info,
        'recommendations': recommendations,
        'methodology': {
            'weights': {
                'audio_similarity': 0.55,
                'cluster_bonus': 0.25,
                'genre_match': 0.20,
            },
            'similarity_metric': 'cosine_similarity',
            'features_used': features,
        }
    }


def _generate_explanation(feature_sim, cluster_rel, genre_rel, genre, subgenre, features):
    """Generate a human-readable explanation of why a song was recommended."""
    parts = []

    # Find top matching features
    sorted_feats = sorted(feature_sim.items(), key=lambda x: x[1], reverse=True)
    top_matches = [f for f, s in sorted_feats[:3] if s > 0.8]

    if top_matches:
        feat_str = ", ".join(top_matches)
        parts.append(f"Very similar {feat_str}")

    if "Same Cluster" in cluster_rel:
        parts.append("belongs to the same audio cluster")

    if genre_rel == "Same Subgenre":
        parts.append(f"shares the {subgenre} subgenre")
    elif genre_rel == "Same Genre":
        parts.append(f"shares the {genre} genre")

    if not parts:
        parts.append("Similar overall audio profile")

    return ". ".join(parts) + "."
