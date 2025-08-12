# Document Processing App - Intelligent Document Processing 🚀

A full-stack application with **Next.js frontend** and **FastAPI backend** that combines **Mistral OCR API** and **LangExtract** for comprehensive document processing and intelligent information extraction with visual workflow management, powered by **Convex** for real-time backend infrastructure and **Clerk** for authentication.

## ⚡ Quick Start

```bash
# 1. Clone and setup
git clone <repo-url>
cd finance_app

# 2. Configure environment (Backend)
cp .env.example .env
# Edit .env with your API keys

# 3. Configure frontend environment
cd web
cp .env.example .env.local
# Add Convex and Clerk configuration

# 4. Start with Docker
./start.sh
# Or: docker-compose up --build

# 5. Open application
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
- **� Authentication & User Management**: Secure user authentication and session management with Clerk
- **💾 Real-time Backend**: Convex provides real-time database, file storage, and serverless functions
- **�📊 Visual Workflows**: Create and manage document processing workflows with React Flow
- **📄 Mistral OCR Integration**: Direct API integration with Mistral OCR for high-quality text extraction from PDFs and images
- **🧠 LangExtract Power**: Structured information extraction using the LangExtract library with support for OpenAI, Gemini, and Ollama models
- **🔧 Node-Based Processing**: Visual workflow builder with configurable nodes for OCR, AI extraction, validation, and data export
- **⚡ Complete Pipeline**: Full document processing from upload to structured output in a single workflow
- **🐳 Docker Ready**: Complete containerized setup with docker-compose
- **📱 Multi-user Support**: Per-user document and workflow management with secure data isolation

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

### Frontend Architecture (Next.js + Convex + Clerk)
```
web/src/
├── app/                 # Next.js App Router
│   ├── workflows/          # Workflow management pages
│   ├── document/           # Document processing interface
│   ├── sign-in/            # Clerk authentication pages
│   ├── sign-up/            # Clerk registration pages
│   └── api/                # API route handlers
├── components/          # React components
│   ├── workflow/           # Workflow builder components
│   │   └── nodes/             # Individual workflow node components
│   └── Navigation.tsx      # App navigation with user management
├── lib/                 # Utility libraries
│   └── extractionUtils.ts  # Client-side extraction helpers
├── middleware.ts        # Clerk authentication middleware
└── convex/              # Convex backend functions
    ├── schema.ts           # Database schema definitions
    ├── auth.config.ts      # Clerk + Convex authentication
    ├── documents.ts        # Document management functions
    ├── workflows.ts        # Workflow CRUD operations
    └── users.ts            # User profile management
```

### Technology Stack

#### Core Technologies
- **Mistral OCR API**: Direct HTTP integration for text extraction from documents
- **LangExtract Library**: Structured information extraction with few-shot learning capabilities
- **React Flow**: Visual workflow builder for creating processing pipelines
- **FastAPI**: High-performance Python API framework with automatic OpenAPI documentation
- **Next.js**: Full-stack React framework with App Router and API routes

#### Backend Infrastructure
- **Convex**: Real-time backend-as-a-service providing:
  - 🗄️ **Real-time Database**: Reactive queries with automatic UI updates
  - 📁 **File Storage**: Secure document upload and storage
  - ⚡ **Serverless Functions**: TypeScript functions for business logic
  - 🔄 **Real-time Sync**: Automatic data synchronization across clients
  - 🛡️ **Built-in Security**: Row-level security and data isolation

#### Authentication & User Management
- **Clerk**: Complete authentication solution featuring:
  - 🔐 **Multi-factor Authentication**: Email, phone, and authenticator app support
  - 👥 **Social Logins**: Google, GitHub, Discord, and more
  - 🎨 **Customizable UI**: Pre-built components with full customization
  - 🛡️ **Security First**: JWT tokens, session management, and user verification
  - 📱 **Multi-device Support**: Seamless authentication across devices

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

#### Backend Configuration
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

#### Frontend Configuration (Convex + Clerk)
Set the following environment variables in `web/.env.local`:

```env
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOY_KEY=your_convex_deploy_key

# Clerk Authentication Configuration  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev

# Optional: Webhook configuration for user sync
CLERK_WEBHOOK_SECRET=whsec_xxx
```

#### Setting up Convex
1. **Install Convex CLI**: `npm install -g convex`
2. **Initialize Convex**: `cd web && npx convex dev`
3. **Deploy Schema**: Convex will automatically deploy your schema and functions
4. **Get your deployment URL**: Copy from Convex dashboard to `NEXT_PUBLIC_CONVEX_URL`

#### Setting up Clerk
1. **Create Clerk Application**: Visit [clerk.com](https://clerk.com) and create a new application
2. **Configure Authentication**: Enable desired sign-in methods (email, social, etc.)
3. **Copy API Keys**: Get publishable and secret keys from Clerk dashboard
4. **Configure JWT**: Set JWT issuer domain for Convex integration

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

#### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `MISTRAL_API_KEY` | ✅ | Mistral API key for OCR processing |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI extraction |
| `LANGEXTRACT_API_KEY` | ⚠️ | Alternative to OPENAI_API_KEY |
| `DEBUG` | ❌ | Enable debug mode (default: false) |
| `HOST` | ❌ | Server host (default: 0.0.0.0) |
| `PORT` | ❌ | Server port (default: 8000) |

#### Frontend (web/.env.local)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | ✅ | Convex deployment URL |
| `CONVEX_DEPLOY_KEY` | ✅ | Convex deployment key (for CI/CD) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable API key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret API key |
| `CLERK_JWT_ISSUER_DOMAIN` | ✅ | Clerk JWT issuer domain |
| `CLERK_WEBHOOK_SECRET` | ⚠️ | Webhook secret for user sync |

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

### Convex Database Schema

The application uses Convex for real-time data management with the following schema:

#### Users Table
```typescript
users: {
  userId: string,           // Clerk user ID
  email: string,
  firstName?: string,
  lastName?: string,
  imageUrl?: string,
  createdAt: string,
  updatedAt: string,
}
```

#### Documents Table
```typescript
documents: {
  filename: string,
  status: "processing" | "processed" | "failed",
  timestamp: string,
  file_size_mb: number,
  content_type: string,
  userId?: string,          // Owner user ID
  processing_result?: {
    ocr_text: string,
    extracted_entities: Array<{
      extraction_class: string,
      extraction_text: string,
      attributes: any,
      start_char?: number,
      end_char?: number,
    }>,
    extraction_metadata: any,
    processing_stats: any,
  },
  error_message?: string,
}
```

#### Workflows Table  
```typescript
workflows: {
  name: string,
  description?: string,
  definition: any,          // React Flow nodes and edges
  is_active: boolean,
  created_at: string,
  updated_at: string,
  userId?: string,          // Owner user ID
}
```

#### Workflow Executions Table
```typescript
workflow_executions: {
  workflow_id: Id<"workflows">,
  status: "pending" | "running" | "completed" | "failed",
  input_data?: any,
  output_data?: any,
  started_at: string,
  completed_at?: string,
  userId?: string,          // Executor user ID
}
```

### Model Configuration

- **Default Model**: OpenAI GPT-4o via LangExtract
- **Supported Providers**: OpenAI, Gemini, Ollama (through LangExtract)
- **Customizable**: Change model via API parameters or workflow node configuration
- **API Key Management**: Centralized configuration with fallback options

## 🔐 Authentication & User Management

### Clerk Integration

The application uses Clerk for complete user authentication and management:

#### Features
- **Sign-up/Sign-in**: Email and password authentication
- **Social Logins**: Support for Google, GitHub, Discord, and other providers
- **Multi-factor Authentication**: Email codes, SMS, and authenticator apps
- **User Profiles**: Automatic profile management with avatars
- **Session Management**: Secure JWT-based sessions with automatic refresh
- **Password Reset**: Built-in password recovery flow
- **Email Verification**: Automatic email verification for new users

#### Authentication Flow
1. **Public Routes**: `/sign-in`, `/sign-up` are accessible without authentication
2. **Protected Routes**: All other routes require authentication via Clerk middleware
3. **User Context**: User information available throughout the application
4. **Automatic Sync**: User profiles automatically synced with Convex database

#### Clerk + Convex Integration
```typescript
// Authentication configuration for Convex
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

#### User Data Management
- **Automatic User Creation**: New users automatically added to Convex database
- **Profile Synchronization**: User profile updates sync between Clerk and Convex
- **Data Isolation**: All user data (documents, workflows) properly isolated by userId
- **Secure Access**: Row-level security ensures users only access their own data

## 💾 Real-time Backend with Convex

### Convex Features

#### Database Capabilities
- **Real-time Queries**: Automatic UI updates when data changes
- **TypeScript Schema**: Fully typed database operations
- **Indexing**: Optimized queries with custom indexes
- **Transactions**: ACID compliance for complex operations
- **Pagination**: Built-in pagination for large datasets

#### File Storage
- **Secure Uploads**: Direct file uploads to Convex storage
- **File Management**: Automatic file cleanup and organization
- **Access Control**: User-based file access permissions
- **CDN Integration**: Fast file delivery via global CDN

#### Serverless Functions
- **Query Functions**: Read data with real-time subscriptions
- **Mutation Functions**: Write data with optimistic updates
- **Action Functions**: External API integrations and side effects
- **Scheduled Functions**: Cron jobs and background processing
- **HTTP Actions**: Direct HTTP endpoints for webhooks and APIs

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
- **Convex**: Automatic scaling and global edge deployment
- **Clerk**: Built-in performance optimization and global CDN

### Monitoring
- Use `/ping` endpoint for health checks
- Monitor processing times and error rates
- Set up logging aggregation
- **Convex Dashboard**: Real-time performance metrics and function logs
- **Clerk Analytics**: User authentication and session analytics

### Security
- Use HTTPS in production
- Implement API key authentication
- Validate and sanitize file uploads
- Set appropriate CORS policies
- **Clerk Security**: Enterprise-grade security with SOC 2 compliance
- **Convex Security**: Built-in row-level security and data encryption

### Deployment
#### Frontend (Next.js + Convex + Clerk)
```bash
# Deploy to Vercel (recommended)
npm run build
vercel deploy

# Deploy Convex functions
npx convex deploy --prod

# Configure production environment variables
# - Add Clerk production keys
# - Add Convex production URL
# - Configure webhooks for user sync
```

#### Backend (FastAPI)
```bash
# Traditional deployment
docker build -t document-processing-api .
docker run -p 8000:8000 -e MISTRAL_API_KEY=your_key document-processing-api

# Or use cloud providers
# - AWS ECS/Fargate
# - Google Cloud Run  
# - Azure Container Instances
```

### Scaling Considerations
- **Convex**: Automatically scales with usage, no configuration needed
- **Clerk**: Supports unlimited users with enterprise plans
- **FastAPI Backend**: Scale horizontally with load balancers
- **File Processing**: Consider queue-based processing for large documents