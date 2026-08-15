from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .data_processor import load_and_preprocess
from .analytics import compute_analytics
from .clustering import run_clustering
from .routes import router

app = FastAPI(title="Spotify Music Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("Spotify Music Intelligence API - Starting up")
    print("=" * 60)

    print("[1/3] Loading and preprocessing data...")
    full_df, dedup_df, scaled_features, stats, features = load_and_preprocess()
    app.state.full_df = full_df
    app.state.scaled_features = scaled_features
    app.state.preprocessing_stats = stats
    app.state.features = features
    print(f"  {stats['original_rows']} rows loaded, {stats['final_rows']} unique tracks after dedup")

    print("[2/3] Computing analytics...")
    app.state.analytics = compute_analytics(full_df, dedup_df, features)
    print(f"  Analytics computed for {len(features)} audio features")

    print("[3/3] Clustering skipped during startup to reduce memory usage.")

    app.state.clustering = None
    app.state.labels = None
    app.state.pca_features = None
    app.state.dedup_df = dedup_df



    print("=" * 60)
    print("Startup complete - API is ready")
    print(f"  Tracks: {stats['final_rows']}")
    print(f"  Clusters: {clustering_res['optimal_k']}")
    print(f"  Features: {', '.join(features)}")
    print("=" * 60)


app.include_router(router)
