import numpy as np
import pandas as pd

def compute_analytics(full_df, dedup_df, features):
    # Total stats
    total_songs = len(dedup_df)
    total_artists = dedup_df['track_artist'].nunique()
    total_playlists = full_df['playlist_id'].nunique()
    total_genres = full_df['playlist_genre'].nunique()
    total_subgenres = full_df['playlist_subgenre'].nunique()
    
    overview = {
        'total_songs': total_songs,
        'total_artists': total_artists,
        'total_playlists': total_playlists,
        'total_genres': total_genres,
        'total_subgenres': total_subgenres
    }
    
    # Distribution data (histogram bins) for audio features
    distributions = {}
    for feat in features:
        counts, bins = np.histogram(dedup_df[feat].dropna(), bins=20)
        distributions[feat] = {
            'counts': counts.tolist(),
            'bins': bins.tolist()
        }
        
    # Genre breakdown
    genre_breakdown = full_df['playlist_genre'].value_counts().to_dict()
    subgenre_breakdown = full_df['playlist_subgenre'].value_counts().to_dict()
    
    # Top artists
    top_artists = dedup_df['track_artist'].value_counts().head(20).to_dict()
    
    # Top playlists
    top_playlists = full_df['playlist_name'].value_counts().head(20).to_dict()
    
    # Scatter plots
    scatter_pairs = [
        ('energy', 'danceability'), ('valence', 'energy'), 
        ('loudness', 'energy'), ('acousticness', 'energy'), 
        ('danceability', 'valence'), ('speechiness', 'danceability')
    ]
    scatter_data = {}
    for p1, p2 in scatter_pairs:
        # Sample for scatter to avoid massive payloads
        sample = dedup_df[[p1, p2]].dropna().sample(n=min(1000, len(dedup_df)))
        scatter_data[f"{p1}_vs_{p2}"] = sample.to_dict(orient='records')
        
    # Correlation
    corr_matrix = dedup_df[features].corr()
    corr_dict = {
        'features': features,
        'matrix': corr_matrix.values.tolist()
    }
    
    # Top insights
    corr_pairs = []
    for i in range(len(features)):
        for j in range(i+1, len(features)):
            corr_pairs.append({
                'f1': features[i],
                'f2': features[j],
                'corr': corr_matrix.iloc[i, j]
            })
            
    corr_pairs.sort(key=lambda x: x['corr'], reverse=True)
    top_positive = corr_pairs[:3]
    top_negative = corr_pairs[-3:]
    top_negative.sort(key=lambda x: x['corr'])
    
    insights = []
    for pair in top_positive:
        insights.append({
            'type': 'positive_correlation',
            'text': f"Strong positive correlation between {pair['f1']} and {pair['f2']}",
            'value': round(pair['corr'], 3)
        })
    for pair in top_negative:
        insights.append({
            'type': 'negative_correlation',
            'text': f"Strong negative correlation between {pair['f1']} and {pair['f2']}",
            'value': round(pair['corr'], 3)
        })
        
    return {
        'overview': overview,
        'distributions': distributions,
        'genre_breakdown': genre_breakdown,
        'subgenre_breakdown': subgenre_breakdown,
        'top_artists': top_artists,
        'top_playlists': top_playlists,
        'scatter_data': scatter_data,
        'correlation': corr_dict,
        'insights': insights
    }
