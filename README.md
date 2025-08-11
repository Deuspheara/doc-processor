# Document Processing App - Intelligent Document Processing 🚀

A full-stack application with **Next.js frontend** and **FastAPI backend** that combines **Mistral OCR API** and **LangExtract** for comprehensive document processing and intelligent information extraction with visual workflow management.

## ⚡ Quick Start

```bash
# 1. Clone and setup
git clone <repo-url>
cd finance_app

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start with Docker
./start.sh
# Or: docker-compose up --build

# 4. Open application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
```

## 📸 Screenshots

### Main Application Interface
<img src="screenshots/Screenshot%202025-08-11%20at%2019-32-50%20Document%20Processing%20App.png" alt="Document Processing App - Home" width="600">

### Document Upload & Processing
<img src="screenshots/Screenshot%202025-08-11%20at%2019-32-57%20Document%20Processing%20App.png" alt="Document Upload" width="600">

### Results View
<img src="screenshots/Screenshot%202025-08-11%20at%2019-33-07%20Document%20Processing%20App.png" alt="OCR Processing" width="600">

### Settings Panel
<img src="screenshots/Screenshot%202025-08-11%20at%2019-33-25%20Document%20Processing%20App.png" alt="Workflow Builder" width="600">

### Dialog creation workflow
<img src="screenshots/Screenshot%202025-08-11%20at%2019-34-46%20Document%20Processing%20App.png" alt="Results View" width="600">

### Workflow Builder
<img src="screenshots/Screenshot%202025-08-11%20at%2019-35-30%20Document%20Processing%20App.png" alt="Settings Panel" width="600">

## 📋 Overview

Transform documents into structured data using state-of-the-art OCR and AI-powered extraction:

- **🌐 Full-Stack Interface**: Modern React/Next.js web application with FastAPI backend
- **📊 Visual Workflows**: Create and manage document processing workflows with React Flow
- **📄 Mistral OCR Integration**: Direct API integration with Mistral OCR for high-quality text extraction from PDFs and images
- **🧠 LangExtract Power**: Structured information extraction using the LangExtract library with support for OpenAI, Gemini, and Ollama models
- **🔧 Node-Based Processing**: Visual workflow builder with configurable nodes for OCR, AI extraction, validation, and data export
- **⚡ Complete Pipeline**: Full document processing from upload to structured output in a single workflow
- **🐳 Docker Ready**: Complete containerized setup with docker-compose

## 🏗️ Architecture

The application follows a clean, modular architecture combining modern web technologies:

### Backend Architecture (FastAPI)
```
src/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration management (Pydantic Settings)
├── models/              # Pydantic models and schemas
│   └── workflow.py         # Workflow and node definitions
├── dependencies.py      # Dependency injection
├── services/            # Business logic layer
│   ├── ocr_service.py      # Mistral OCR API integration
│   ├── extraction_service.py  # LangExtract library integration
│   └── workflow_engine.py  # Visual workflow execution engine
└── routers/             # API endpoints organization
    ├── health.py           # Health checks and utilities
    ├── ocr.py              # OCR-specific endpoints
    ├── extraction.py       # Information extraction endpoints
    ├── workflows.py        # Workflow management endpoints
    └── pipeline.py         # Complete processing pipeline
```

### Frontend Architecture (Next.js)
```
web/src/
├── app/                 # Next.js App Router
│   ├── workflows/          # Workflow management pages
│   ├── document/           # Document processing interface
│   └── api/                # API route handlers
├── components/          # React components
│   ├── workflow/           # Workflow builder components
│   │   └── nodes/             # Individual workflow node components
│   └── Navigation.tsx      # App navigation
└── lib/                 # Utility libraries
    └── extractionUtils.ts  # Client-side extraction helpers
```

### Technology Stack

#### Core Technologies
- **Mistral OCR API**: Direct HTTP integration for text extraction from documents
- **LangExtract Library**: Structured information extraction with few-shot learning capabilities
- **React Flow**: Visual workflow builder for creating processing pipelines
- **FastAPI**: High-performance Python API framework with automatic OpenAPI documentation
- **Next.js**: Full-stack React framework with App Router and API routes

#### Key Design Principles
- **Direct API Integration**: No LangChain dependency - direct service integrations for optimal performance
- **Separation of Concerns**: Services handle business logic, routers handle HTTP, components handle UI
- **Dependency Injection**: Clean, testable service instantiation with FastAPI dependencies
- **Type Safety**: Comprehensive Pydantic models for all data structures and TypeScript for frontend
- **Visual Workflow Design**: Node-based processing pipelines with React Flow
- **Error Handling**: Centralized exception handling with detailed error responses

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to the project
cd finance_app

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env  # Create from template
```

### 2. Configuration

Set the following environment variables in `.env`:

```env
# Required for OCR processing via Mistral API
MISTRAL_API_KEY=your_mistral_api_key_here

# Required for AI extraction via LangExtract (choose one)
OPENAI_API_KEY=your_openai_api_key_here
# OR (LangExtract will use OPENAI_API_KEY if available)
LANGEXTRACT_API_KEY=your_openai_api_key_here

# Optional configuration
DEBUG=false
HOST=0.0.0.0
PORT=8000
```

### 3. Run the Application

```bash
# Development mode
python -m src.main

# Or with uvicorn directly
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test the API

Visit `http://localhost:8000` for the interactive documentation, or test with curl:

```bash
# Health check
curl http://localhost:8000/health

# Test OCR
curl -X POST -F "file=@sample_document.pdf" http://localhost:8000/ocr/test
```

## 📚 API Documentation

### Core Endpoints

#### 🏥 Health & Monitoring
- `GET /health` - API health and configuration status
- `GET /ping` - Simple health check for load balancers

#### 🔍 OCR Processing (Mistral API)
- `POST /ocr/extract` - Extract text from documents using Mistral OCR
- `POST /ocr/test` - Test OCR with debugging information

#### 🧠 Information Extraction (LangExtract)
- `POST /extract/information` - Extract structured data from text using LangExtract
- `GET /extract/models` - List available AI models (OpenAI, Gemini, Ollama)

#### 📊 Workflow Management
- `GET /workflows` - List all available workflows
- `POST /workflows` - Create a new workflow
- `GET /workflows/{id}` - Get workflow details
- `PUT /workflows/{id}` - Update workflow configuration
- `POST /workflows/{id}/execute` - Execute a workflow
- `POST /workflows/validate` - Validate workflow configuration

#### ⚡ Complete Pipeline
- `POST /process/document` - Full document processing (OCR + Extraction)
- `POST /process/invoice` - Invoice processing with preset configuration

### Interactive Documentation

- **Frontend Interface**: `http://localhost:3000` - Full web application
- **Swagger UI**: `http://localhost:8000/docs` - Interactive API documentation
- **ReDoc**: `http://localhost:8000/redoc` - Alternative API documentation

## 🔧 Usage Examples

### Simple OCR Processing

```python
import requests

# Extract text only
with open("document.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8000/ocr/extract",
        files={"file": f}
    )
    
result = response.json()
print(result["text"])
```

### Complete Document Processing

```python
import requests
import json

# Define what to extract
extraction_config = {
    "prompt_description": "Extract invoice details: vendor, amount, date",
    "examples": [
        {
            "text": "Invoice #12345 from ABC Corp. Total: $1,250.00",
            "extractions": [
                {
                    "extraction_class": "invoice_number",
                    "extraction_text": "12345",
                    "attributes": {"confidence": 1.0}
                },
                {
                    "extraction_class": "vendor",
                    "extraction_text": "ABC Corp",
                    "attributes": {"confidence": 1.0}
                },
                {
                    "extraction_class": "amount",
                    "extraction_text": "$1,250.00",
                    "attributes": {"currency": "USD"}
                }
            ]
        }
    ],
    "model_type": "openai",
    "model_id": "gpt-4o"
}

# Process document
with open("invoice.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8000/process/document",
        files={"file": f},
        data={"extraction_request": json.dumps(extraction_config)}
    )

result = response.json()
print("Extracted text:", result["ocr_text"][:200])
print("Entities found:", len(result["extracted_entities"]))
for entity in result["extracted_entities"]:
    print(f"- {entity['extraction_class']}: {entity['extraction_text']}")
```

### Invoice Processing (Preset)

```python
# Process invoice with predefined extraction
with open("invoice.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8000/process/invoice",
        files={"file": f}
    )

result = response.json()
# Automatically extracts: invoice number, vendor, amounts, dates, etc.
```

## 🧪 Testing

### Manual Testing

1. **Health Check**: `GET /health` - Verify configuration
2. **OCR Test**: `POST /ocr/test` - Test with a sample document
3. **Pipeline Test**: `POST /process/invoice` - Try with an invoice

### Supported File Types

- **PDF**: Documents up to 50MB
- **Images**: PNG, JPG, JPEG, WebP up to 50MB

### Troubleshooting

| Error | Solution |
|-------|----------|
| `MISTRAL_API_KEY not configured` | Set the environment variable |
| `File too large` | Use files under 50MB |
| `Unsupported file type` | Use PDF or supported image formats |
| `OCR extracted very little text` | Check document quality and readability |

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MISTRAL_API_KEY` | ✅ | Mistral API key for OCR processing |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI extraction |
| `LANGEXTRACT_API_KEY` | ⚠️ | Alternative to OPENAI_API_KEY |
| `DEBUG` | ❌ | Enable debug mode (default: false) |
| `HOST` | ❌ | Server host (default: 0.0.0.0) |
| `PORT` | ❌ | Server port (default: 8000) |

## 🔧 Technical Details

### Mistral OCR Integration

The application integrates directly with the Mistral OCR API for high-quality text extraction:

- **Direct API Calls**: Uses HTTP requests to `https://api.mistral.ai/v1/ocr`
- **Document Support**: PDFs, PNG, JPG, JPEG, WebP up to 50MB
- **Base64 Encoding**: Converts documents to data URLs for API transmission
- **Markdown Output**: Extracts text in structured markdown format
- **Page Processing**: Handles multi-page documents with page-by-page extraction

### LangExtract Integration

LangExtract provides powerful structured information extraction capabilities:

- **Few-Shot Learning**: Uses example-based extraction for high accuracy
- **Multiple Providers**: Supports OpenAI, Gemini, and Ollama language models
- **Structured Output**: Extracts entities with classes, text, and attributes
- **Type Safety**: Full Pydantic model validation for extraction results
- **Customizable Prompts**: Flexible prompt descriptions for different extraction tasks

### Workflow Engine

Visual workflow builder powered by React Flow:

- **Node Types**: DocumentInput, OCRProcessor, AIExtractor, DataValidator, ExportData
- **Visual Editor**: Drag-and-drop interface for building processing pipelines
- **Real-time Execution**: Execute workflows and see results in real-time
- **Validation**: Built-in validation for workflow configuration and node connections
- **Extensible**: Easy to add new node types and processing capabilities

### Model Configuration

- **Default Model**: OpenAI GPT-4o via LangExtract
- **Supported Providers**: OpenAI, Gemini, Ollama (through LangExtract)
- **Customizable**: Change model via API parameters or workflow node configuration
- **API Key Management**: Centralized configuration with fallback options

## 🐳 Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
EXPOSE 8000

CMD ["python", "-m", "src.main"]
```

```bash
# Build and run
docker build -t document-processing-api .
docker run -p 8000:8000 -e MISTRAL_API_KEY=your_key document-processing-api
```

## 🚀 Production Considerations

### Performance
- Use `uvicorn` with multiple workers for production
- Consider Redis caching for frequently processed documents
- Implement rate limiting for API endpoints

### Monitoring
- Use `/ping` endpoint for health checks
- Monitor processing times and error rates
- Set up logging aggregation

### Security
- Use HTTPS in production
- Implement API key authentication
- Validate and sanitize file uploads
- Set appropriate CORS policies