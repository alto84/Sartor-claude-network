# Sartor Claude Network MCP Server
# Multi-stage Docker build for optimal size and security
# Date: 2025-11-03

# Stage 1: Builder
FROM python:3.12-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /build

# Copy requirements file
COPY requirements-complete.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install wheel
RUN pip install --upgrade pip wheel setuptools

# Install Python dependencies
RUN pip install -r requirements-complete.txt || \
    (echo "Some optional dependencies failed, installing core only..." && \
     pip install aiohttp websockets pyyaml requests python-dotenv pytest pytest-asyncio psutil)

# Stage 2: Runtime
FROM python:3.12-slim

# Labels
LABEL maintainer="Sartor Claude Network Team" \
      version="1.0.0" \
      description="MCP Server for Sartor Claude Network" \
      org.opencontainers.image.source="https://github.com/alto84/Sartor-claude-network"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    MCP_HOST="0.0.0.0" \
    MCP_PORT="8080" \
    LOG_LEVEL="INFO"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create non-root user
RUN groupadd -r mcp && useradd -r -g mcp -m -s /bin/bash mcp

# Create application directory
WORKDIR /app

# Copy application code
COPY --chown=mcp:mcp . .

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/tests/results && \
    chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${MCP_PORT}/health || exit 1

# Expose port
EXPOSE 8080

# Volume for persistent data
VOLUME ["/app/data", "/app/logs"]

# Default command - run the MCP server
CMD ["python", "mcp_server.py"]

# Alternative commands (override with docker run command)
# For running tests: docker run <image> python tests/run_all_tests.py
# For gateway client: docker run <image> python -m gateway_client
# For interactive shell: docker run -it <image> /bin/bash