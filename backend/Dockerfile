# Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=regland_backend.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Collect static files
RUN python manage.py collectstatic --noinput --settings=regland_backend.settings

# Create startup script without migrations (database is read-only in production)
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Validating Django project..."\n\
python manage.py check --settings=regland_backend.settings\n\
echo "Starting gunicorn server..."\n\
exec gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 300 --worker-class sync --max-requests 1000 --max-requests-jitter 100 --preload regland_backend.wsgi:application' > /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Run startup script
CMD ["/app/start.sh"]