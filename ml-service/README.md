# TripSmart recommendation service

This small FastAPI service ranks trips using a content and user-history similarity model. It is intentionally dependency-light so the model can be replaced later with a trained recommender without changing the Node API.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

The Node backend uses `ML_SERVICE_URL` when it is set. Without it, the existing local recommender remains the fallback.