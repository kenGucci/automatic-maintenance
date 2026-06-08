FROM node:20-slim AS agent

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]

FROM python:3.11-slim AS dashboard

WORKDIR /app
COPY requirements.txt pyproject.toml ./
RUN pip install --no-cache-dir -r requirements.txt
COPY dashboard/ ./dashboard/
EXPOSE 8080
CMD ["gunicorn", "dashboard.app:app", "--bind", "0.0.0.0:8080"]
