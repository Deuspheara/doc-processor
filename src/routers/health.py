"""
Health and utility endpoints.

This module contains endpoints for API health checks, configuration validation,
and other utility functions.
"""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from ..dependencies import SettingsDep
from ..models import HealthResponse

router = APIRouter(
    tags=["Health & Utilities"]
)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API health check",
    description="""
    Check the health and configuration status of the API.
    
    **Returns information about:**
    - Overall API status
    - Mistral OCR API configuration
    - LangExtract/OpenAI API configuration
    - Available endpoints
    
    **Use this endpoint to:**
    - Verify API is running
    - Check if API keys are configured
    - Troubleshoot configuration issues
    - Monitor service availability
    """
)
async def health_check(settings: SettingsDep = None):
    """Check API health and configuration status."""
    config_status = settings.validate_configuration()
    
    return HealthResponse(
        status="healthy",
        mistral_api_configured=config_status["mistral_api_configured"],
        langextract_api_configured=config_status["langextract_api_configured"],
        available_endpoints=[
            "/health",
            "/docs",
            "/ocr/extract",
            "/ocr/test", 
            "/extract/information",
            "/extract/models",
            "/process/document",
            "/process/invoice"
        ]
    )


@router.get(
    "/",
    response_class=HTMLResponse,
    summary="API documentation homepage",
    description="""
    Interactive API documentation and testing interface.
    
    Provides a user-friendly overview of all available endpoints
    with testing capabilities and troubleshooting guidance.
    """
)
async def root():
    """API Documentation and Test Interface"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Document Processing API</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; 
                padding: 20px;
                background-color: #f8f9fa;
                line-height: 1.6;
            }
            .container { 
                max-width: 1000px; 
                margin: 0 auto; 
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #e9ecef;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .endpoint { 
                background: #f8f9fa; 
                padding: 20px; 
                margin: 20px 0; 
                border-radius: 8px; 
                border-left: 4px solid #007bff;
            }
            .method { 
                color: white; 
                padding: 4px 12px; 
                border-radius: 4px; 
                font-size: 12px;
                font-weight: bold;
                margin-right: 10px;
            }
            .post { background-color: #28a745; }
            .get { background-color: #007bff; }
            code { 
                background: #e9ecef; 
                padding: 2px 6px; 
                border-radius: 4px;
                font-family: 'Monaco', 'Consolas', monospace;
            }
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .feature-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .alert {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .success {
                background: #d4edda;
                border-color: #c3e6cb;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                background: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 10px 10px 10px 0;
            }
            .btn:hover { background: #0056b3; }
            .btn-secondary {
                background: #6c757d;
            }
            .btn-secondary:hover { background: #545b62; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔥 Document Processing API</h1>
                <p><strong>Intelligent document processing combining Mistral OCR + LangExtract</strong></p>
                <p>Transform documents into structured data with AI-powered extraction</p>
            </div>
            
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>🔍 OCR Processing</h3>
                    <p>Extract text from PDF documents and images using Mistral's advanced OCR technology.</p>
                    <ul>
                        <li>PDF, PNG, JPG, WebP support</li>
                        <li>Multi-page processing</li>
                        <li>High accuracy text extraction</li>
                    </ul>
                </div>
                
                <div class="feature-card">
                    <h3>🧠 AI Extraction</h3>
                    <p>Extract structured information using advanced language models with few-shot learning.</p>
                    <ul>
                        <li>OpenAI GPT models</li>
                        <li>Custom extraction templates</li>
                        <li>Flexible entity definitions</li>
                    </ul>
                </div>
                
                <div class="feature-card">
                    <h3>⚡ Complete Pipeline</h3>
                    <p>Full document processing from raw files to structured data in a single API call.</p>
                    <ul>
                        <li>OCR + Extraction combined</li>
                        <li>Processing statistics</li>
                        <li>Error handling & validation</li>
                    </ul>
                </div>
            </div>
            
            <h2>📋 Available Endpoints</h2>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /process/document</h3>
                <p><strong>Complete Processing Pipeline</strong></p>
                <p>Process any document through OCR + information extraction in one call</p>
                <p><em>Input:</em> Document file + custom extraction configuration</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /process/invoice</h3>
                <p><strong>Invoice Processing (Preset)</strong></p>
                <p>Process invoices with predefined extraction for common invoice fields</p>
                <p><em>Input:</em> Invoice document file only</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /ocr/extract</h3>
                <p><strong>OCR Only</strong></p>
                <p>Extract text from documents without information extraction</p>
                <p><em>Input:</em> Document file (PDF/Image)</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /ocr/test</h3>
                <p><strong>OCR Testing</strong></p>
                <p>Test OCR functionality with detailed debugging information</p>
                <p><em>Input:</em> Document file</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method post">POST</span> /extract/information</h3>
                <p><strong>Information Extraction Only</strong></p>
                <p>Extract structured data from text using AI models</p>
                <p><em>Input:</em> Text + extraction configuration</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method get">GET</span> /extract/models</h3>
                <p><strong>Available Models</strong></p>
                <p>List available AI models for information extraction</p>
            </div>
            
            <div class="endpoint">
                <h3><span class="method get">GET</span> /health</h3>
                <p><strong>Health Check</strong></p>
                <p>Check API status and configuration</p>
            </div>
            
            <div class="alert">
                <h3>🚀 Quick Start</h3>
                <ol>
                    <li><strong>Health Check:</strong> Test <code>/health</code> to verify API configuration</li>
                    <li><strong>OCR Test:</strong> Use <code>/ocr/test</code> to verify document processing</li>
                    <li><strong>Invoice Demo:</strong> Try <code>/process/invoice</code> with a sample invoice</li>
                    <li><strong>Custom Processing:</strong> Use <code>/process/document</code> with your own extraction config</li>
                </ol>
            </div>
            
            <div class="alert success">
                <h3>📋 Configuration Requirements</h3>
                <p><strong>Environment Variables:</strong></p>
                <ul>
                    <li><code>MISTRAL_API_KEY</code> - Required for OCR processing</li>
                    <li><code>OPENAI_API_KEY</code> or <code>LANGEXTRACT_API_KEY</code> - Required for AI extraction</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="/docs" class="btn">📚 Interactive API Documentation</a>
                <a href="/redoc" class="btn btn-secondary">📖 ReDoc Documentation</a>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p><small>Document Processing API v1.0.0 | Built with FastAPI + Mistral OCR + LangExtract</small></p>
            </div>
        </div>
    </body>
    </html>
    """
