FROM ghcr.io/astral-sh/uv:python3.10-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY .env.example .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Health check - updated to use new endpoint structure
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ping || exit 1

# Run the application using the new main module
CMD ["python", "-m", "src.main"]