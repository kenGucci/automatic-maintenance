FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir psutil

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py .
COPY dashboard/ ./dashboard/

EXPOSE 8080 9090

CMD python3 agent.py & gunicorn dashboard.app:app --bind 0.0.0.0:8080
