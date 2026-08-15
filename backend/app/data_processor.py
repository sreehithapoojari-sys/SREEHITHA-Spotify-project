import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
import os
import numpy as np

DATA_PATH = '../spotify dataset.csv'
MODEL_DIR = r"c:\Users\smani\Downloads\New folder\models"

def load_and_preprocess():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR, exist_ok=True)
        
    df = pd.read_csv(DATA_PATH)
    original_rows = len(df)
    
    # Drop missing
    df = df.dropna(subset=['track_name', 'track_artist', 'track_album_name']).copy()
    missing_handled = original_rows - len(df)
    
    # Impute tempo
    median_tempo = df[df['tempo'] > 0]['tempo'].median()
    df.loc[df['tempo'] == 0, 'tempo'] = median_tempo
    
    full_dataset = df.copy()
    
    # Deduplicate
    dedup_dataset = df.drop_duplicates(subset=['track_id'], keep='first').copy()
    duplicates_handled = len(df) - len(dedup_dataset)
    
    # Sort and assign song_id
    dedup_dataset = dedup_dataset.reset_index(drop=True)
    dedup_dataset['song_id'] = dedup_dataset.index
    
    # Audio features
    features = ['danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 
                'instrumentalness', 'liveness', 'valence', 'tempo', 'duration_ms']
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(dedup_dataset[features])
    
    joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.joblib'))
    
    stats = {
        'original_rows': original_rows,
        'final_rows': len(dedup_dataset),
        'duplicates_handled': duplicates_handled,
        'missing_handled': missing_handled,
        'num_features': 10,
        'cat_features': ['playlist_genre', 'playlist_subgenre'],
        'features_used': features
    }
    
    return full_dataset, dedup_dataset, scaled_features, stats, features
