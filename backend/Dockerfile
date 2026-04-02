FROM python:3.11-slim

WORKDIR /app

# Copy requirements from backend directory
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the whole project (or just backend) so that `backend` module exists
COPY backend ./backend

# Ensure data directory exists
RUN mkdir -p /app/backend/data

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
