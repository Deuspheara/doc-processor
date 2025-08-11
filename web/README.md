# Document Processing App

A Next.js application for intelligent document processing with OCR, information extraction, and workflow automation.

## Features

- **Document Detection & Routing**: Automatically detect document types (invoices, contracts, receipts, etc.) and route to appropriate parsers
- **Visual Workflow Builder**: Create custom document processing workflows with a drag-and-drop interface
- **OCR Processing**: Extract text from PDFs and images using Mistral OCR
- **Information Extraction**: Extract structured data using LangExtract with multiple LLM providers
- **LLM Integration**: Support for OpenAI, OpenRouter, and other LLM providers
- **Modular Architecture**: Easy to add new document parsers and processing modules

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │  Document API   │
│   (React/Next)  │────│   Routes        │────│  (FastAPI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        ▼
        │                        │              ┌─────────────────┐
        │                        │              │   Mistral OCR   │
        │                        │              └─────────────────┘
        │                        │                        │
        ▼                        │                        ▼
┌─────────────────┐              │              ┌─────────────────┐
│  Workflow       │              │              │  LangExtract    │
│  Builder        │              │              │  (OpenAI/etc.)  │
└─────────────────┘              │              └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │  File Storage   │
│  (Workflows)    │    │  (Documents)    │
└─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Document Processing API running (see API Integration section)

### Installation

1. Clone the repository and navigate to the project:
```bash
cd web
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your API endpoint:
```bash
DOCUMENT_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Integration

This app integrates with a FastAPI-based document processing service. The API provides:

### Endpoints Used

- **GET /health**: Check API status and configuration
- **POST /ocr/extract**: Extract text from documents
- **POST /extract/information**: Extract structured information from text
- **POST /process/document**: Complete document processing pipeline
- **POST /process/invoice**: Process invoice documents with preset configuration

### Setting Up the Document API

The app expects a document processing API to be running. You can:

1. Set up your own FastAPI service using the provided OpenAPI specification
2. Update the `DOCUMENT_API_URL` in your environment variables
3. Configure API keys in the Settings page

## Usage Guide

### 1. Dashboard
- View API status and connection health
- See processing statistics
- Quick access to main features

### 2. Upload Documents
- Drag & drop or select files (PDF, PNG, JPG, JPEG, WebP)
- Choose document type or use auto-detection
- Configure custom extraction rules
- View extracted text and structured data

### 3. Workflow Builder
- Create visual workflows with drag-and-drop components
- Add processing nodes (OCR, classification, extraction, validation)
- Save and reuse workflows
- Export workflows as JSON

### 4. Settings
- Configure API endpoints and keys
- Set default LLM models
- Adjust processing parameters

## Document Types Supported

The app can automatically detect and process:

- **Invoices**: Extract vendor info, amounts, dates, line items
- **Receipts**: Extract store details, transaction info, items
- **Contracts**: Extract parties, terms, dates, key clauses
- **Legal Documents**: Extract case info, parties, facts
- **Forms**: Extract field values and applicant information
- **Custom Documents**: User-defined extraction rules

## Available Components

### Processing Nodes
- **Document Input**: File upload and document reception
- **OCR Processor**: Text extraction from images/PDFs
- **Document Classifier**: Automatic document type detection
- **Information Extractor**: Structured data extraction
- **Data Validator**: Validate extracted information
- **Output Formatter**: Format results for export
- **Webhook**: Send data to external systems

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── upload/            # Document upload page
│   ├── workflows/         # Workflow builder page
│   ├── settings/          # Configuration page
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Dashboard page
├── components/            # React components
│   └── Navigation.tsx     # Main navigation
└── lib/                   # Utility libraries
    └── documentDetection.ts # Document type detection
```

### Key Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Flow**: Visual workflow builder
- **Radix UI**: Accessible UI components
- **Lucide React**: Icon library
- **Zustand**: State management
- **React Dropzone**: File upload handling

### Adding New Document Types

1. Add patterns to `/lib/documentDetection.ts`
2. Define extraction configuration
3. Update the document type selector in upload page
4. Test with sample documents

### Adding New Workflow Nodes

1. Define node type in workflows page
2. Add node configuration UI
3. Implement processing logic
4. Update workflow execution engine

## Environment Variables

```bash
# Required
DOCUMENT_API_URL=http://localhost:8000

# Optional (can be configured in UI)
MISTRAL_API_KEY=your_mistral_key
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key

# App Configuration
NEXT_PUBLIC_APP_NAME="Document Processing App"
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker

```bash
# Build image
docker build -t document-processor .

# Run container
docker run -p 3000:3000 -e DOCUMENT_API_URL=your_api_url document-processor
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- Check the [Issues](https://github.com/your-repo/issues) page for known problems
- Create a new issue for bugs or feature requests
- Refer to the API documentation for backend integration details
