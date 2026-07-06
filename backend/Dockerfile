# Use official Python image as base
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend directory context
COPY requirements.txt ./

# Install Python dependencies (install CPU-only PyTorch first to save memory and disk space)
RUN pip install --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK punkt and punkt_tab tokenizers
RUN python -m nltk.downloader punkt punkt_tab

# Copy all backend files
COPY . ./backend/

# Expose Uvicorn port
EXPOSE 8000

# Set PYTHONPATH to root /app so uvicorn can find backend package
ENV PYTHONPATH=/app

# Run the FastAPI app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
