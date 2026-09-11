from fastapi import FastAPI
from pydantic import BaseModel, Field

from recommender import rank_recommendations

app = FastAPI(title="TripSmart Recommendation Service", version="0.1.0")


class RecommendationRequest(BaseModel):
    user_trips: list[dict] = Field(default_factory=list)
    candidate_trips: list[dict] = Field(default_factory=list)
    limit: int = Field(default=6, ge=1, le=50)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "recommendation-engine"}


@app.post("/recommend")
def recommend(request: RecommendationRequest) -> dict:
    return {
        "model": "content-collaborative-knn-v1",
        "recommendations": rank_recommendations(
            request.user_trips,
            request.candidate_trips,
            request.limit,
        ),
    }