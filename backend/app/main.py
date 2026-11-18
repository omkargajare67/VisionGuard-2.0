from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import health

app = FastAPI(
    title="VisionGuard 2.0 API",
    description="DEAM-Integrated Intelligent Product Quality Inspection and Automated Sorting System",
    version="0.1.0",
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to VisionGuard 2.0 API. Navigate to /docs for interactive API documentation.",
        "stage": 1,
    }
