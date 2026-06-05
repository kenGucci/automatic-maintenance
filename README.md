# Automatic Maintenance

Automatic Maintenance is an autonomous AI agent designed to monitor, diagnose, and optimize systems without constant human intervention. It proactively detects issues, performs routine maintenance tasks, tracks performance metrics, and recommends or executes fixes before problems escalate.

## Features

- **Autonomous Monitoring** — Continuously tracks CPU, memory, disk, and network metrics
- **Intelligent Diagnostics** — Analyzes system health and generates actionable recommendations
- **Auto-Remediation** — Automatically executes fixes for detected issues (configurable)
- **Alert System** — Real-time alerts with severity levels (info, warning, critical)
- **Maintenance Scheduling** — Automated log rotation, disk cleanup, security scans, and backups
- **Web Dashboard** — Full-featured themed UI with dark/light mode for real-time monitoring
- **CrewAI Integration** — Multi-agent orchestration for complex maintenance tasks
- **GitHub Actions CI/CD** — Daily scheduled maintenance via automated workflows

## Architecture

The project uses a **dual-stack** approach:

- **Node.js** — Core agent runtime, system monitoring, diagnostics engine, and configuration management
- **Python (CrewAI + Flask)** — Multi-agent task orchestration and dashboard API server

```
index.js                    # Node.js entry point — bootstraps the agent
├── src/agent/               # MaintenanceAgent core logic
├── src/monitor/             # SystemMonitor — collects metrics
├── src/diagnostic/          # DiagnosticEngine — analyzes system health
├── src/config/              # ConfigManager — loads & manages settings
├── src/utils/               # Logger and utility modules
│
maintenance_crew.py         # Standalone CrewAI crew script
├── src/crew.py              # CrewAI researcher agent with SerperDevTool
│
dashboard/                 # Flask-powered web dashboard
├── app.py                   # API server (8 endpoints)
├── templates/index.html     # Dashboard SPA
├── static/css/theme.css     # Theme system (dark/light mode)
├── static/js/dashboard.js   # Navigation, API calls, auto-refresh
│
.github/workflows/main.yml  # Daily CI/CD at 3 AM UTC
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.10+ and pip
- Cloudflare API token (for CI/CD deployment)

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
pip install flask crewai crewai-tools
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration values
```

### 4. Start the Agent

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### 5. Start the Dashboard

```bash
python3 dashboard/app.py
```

The dashboard will be available at **http://127.0.0.1:8080**

## Dashboard

The web dashboard provides real-time visibility into your maintenance agent:

| Page | Description |
|------|-------------|
| **Overview** | Agent status, health score, uptime, recent alerts, task history |
| **Monitoring** | CPU/memory/disk/network metrics, usage bars, 24h history chart |
| **Diagnostics** | Service health cards, latency metrics, recommendations |
| **Settings** | Alert thresholds, auto-remediation toggle, notification channels |

### Theme Customization

The dashboard uses a CSS variable-based theme system with 100+ design tokens. To customize:

1. Open `dashboard/static/css/theme.css`
2. Edit the `:root` block for light mode variables
3. Edit the `[data-theme="dark"]` block for dark mode variables

Key variables:
- `--color-primary` — Primary accent color
- `--bg-body`, `--bg-surface`, `--bg-card` — Background colors
- `--text-primary`, `--text-secondary` — Text colors
- `--sidebar-width` — Sidebar width
- `--font-family` — Base font stack

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/overview` | GET | Agent status, health score, alert/task counts |
| `/api/metrics` | GET | Current CPU, memory, disk, network metrics |
| `/api/metrics/history` | GET | 24-hour metric history for charts |
| `/api/alerts` | GET | Recent alerts with type, message, timestamp |
| `/api/tasks` | GET | Maintenance task list with status |
| `/api/diagnostics` | GET | Service health, latency, recommendations |
| `/api/settings` | GET | Current configuration and thresholds |
| `/api/settings` | POST | Update agent configuration |

## CrewAI Agents

The project includes CrewAI-powered multi-agent orchestration:

- **Senior Researcher** — Uses SerperDevTool to research deployment processes and best practices
- **Senior Coder** — Writes and fixes maintenance code
- **Code Reviewer** — Reviews code for bugs and issues

Run the crew:

```bash
python3 maintenance_crew.py
# or via the src module:
python3 -m src.crew
```

## GitHub Actions

A daily maintenance workflow runs at **3 AM UTC**:

- Sets up Node.js 20 on Ubuntu
- Installs dependencies
- Runs the maintenance agent
- Uses a Cloudflare API token secret for deployment

You can also trigger it manually via `workflow_dispatch`.

## Bot Integration

See [BOT_SETUP.md](BOT_SETUP.md) for detailed bot configuration, troubleshooting, and security notes.

## Configuration

Key environment variables:

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for deployment |
| `MONITORING_INTERVAL` | Metrics collection interval (ms) |
| `ENVIRONMENT` | Runtime environment (development/production) |

Alert thresholds are configurable in the dashboard Settings page:
- CPU: warning 70%, critical 90%
- Memory: warning 75%, critical 95%
- Disk: warning 80%, critical 95%

## License

ISC

## Author

kenGucci — [𝕏 @suggestionii](https://x.com/suggestionii)
