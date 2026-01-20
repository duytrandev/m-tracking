"""
M-Tracking Analytics Service
FastAPI service for AI/LLM operations
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="M-Tracking Analytics API",
    description="AI/LLM service for transaction categorization and chat assistant",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analytics"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "M-Tracking Analytics API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# TODO: Import and include routers
# from app.routers import categorization, chat
# app.include_router(categorization.router, prefix="/api/v1")
# app.include_router(chat.router, prefix="/api/v1")
