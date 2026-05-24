# Production Dockerfile for GDB-UI Backend
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gdb \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY . .

# Create output directory for compiled binaries
RUN mkdir -p output

# Expose port
EXPOSE 10000

# Run the application with gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:10000", "main:app"]

# Healthcheck to ensure the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1
