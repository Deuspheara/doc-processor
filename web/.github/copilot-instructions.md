# Document Processing Next.js App

This project is a Next.js application for document processing with the following features:
- Document Detection & Routing with auto-detection of document types
- Visual Workflow Builder (like n8n)
- Automation for parser selection
- LLM Integration (OpenAI, OpenRouter, etc.)
- Modular architecture for easy parser addition

## Project Status

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project  
- [x] Install Required Extensions (No extensions required)
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## API Integration

The app integrates with a document processing API that provides:
- OCR text extraction from documents
- Information extraction using LangExtract
- Complete document processing pipeline
- Health checks and model information

## Architecture

- Modular design for adding new parsers easily
- Simple UX for non-technical users
- Visual workflow editor
- Support for multiple LLM providers
- Auto-detection and routing of document types

## Features Implemented

- Dashboard with API health monitoring and statistics
- Document upload with drag-and-drop interface
- Auto document type detection (invoices, receipts, contracts, legal docs, forms)
- Visual workflow builder with ReactFlow
- Settings page for API configuration and LLM selection
- Proxy API routes for document processing
- Responsive UI with Tailwind CSS
- TypeScript throughout for type safety

## Development Server

The project is now running at:
- Local: http://localhost:3000
- Network: http://192.168.1.77:3000

To launch in debug mode, use the VS Code debugger or run `npm run dev` in the terminal.
