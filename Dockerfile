FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends tini && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir psutil

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py .
COPY dashboard/ ./dashboard/

EXPOSE 8080 9090

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD python3 agent.py & gunicorn dashboard.app:app --bind 0.0.0.0:8080 & wait
