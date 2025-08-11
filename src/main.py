"""
Document Processing API - Clean Architecture Implementation

A FastAPI application that combines Mistral OCR and LangExtract for
comprehensive document processing and structured information extraction.

Features:
- OCR processing for PDFs and images
- AI-powered information extraction
- Modular, clean architecture
- Comprehensive error handling
- Detailed API documentation

Author: Document Processing API Team
Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from .config import settings
from .routers import health, ocr, extraction, pipeline, workflows


# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Document Processing API...")
    logger.info(f"Debug mode: {settings.debug}")
    
    # Validate configuration on startup
    config_status = settings.validate_configuration()
    logger.info(f"Configuration status: {config_status}")
    
    if not config_status["mistral_api_configured"]:
        logger.warning("MISTRAL_API_KEY not configured - OCR endpoints will not work")
    
    if not config_status["langextract_api_configured"]:
        logger.warning("OpenAI/LangExtract API key not configured - extraction endpoints will not work")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Document Processing API...")


# Create FastAPI application with clean configuration
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "Health & Utilities",
            "description": "Health checks, configuration validation, and API documentation"
        },
        {
            "name": "OCR", 
            "description": "Optical Character Recognition endpoints for text extraction from documents"
        },
        {
            "name": "Information Extraction",
            "description": "AI-powered structured information extraction from text"
        },
        {
            "name": "Document Processing",
            "description": "Complete document processing pipeline combining OCR and extraction"
        },
        {
            "name": "Workflows",
            "description": "Visual workflow builder and execution engine for document processing"
        }
    ]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else ["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Handle HTTP exceptions with consistent error format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )


# Include routers with proper organization
app.include_router(health.router)
app.include_router(ocr.router)
app.include_router(extraction.router)
app.include_router(pipeline.router)
app.include_router(workflows.router)


# Health endpoint for load balancers and monitoring
@app.get("/ping", include_in_schema=False)
async def ping():
    """Simple ping endpoint for health monitoring."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}


# Application entry point
def main():
    """Run the application."""
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        access_log=True,
        log_level="debug" if settings.debug else "info"
    )


if __name__ == "__main__":
    main()
