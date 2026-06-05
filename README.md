# Automatic Maintenance

Automatic Maintenance is an autonomous AI agent designed to monitor, diagnose, and optimize systems without constant human intervention. It proactively detects issues, performs routine maintenance tasks, tracks performance metrics, and recommends or executes fixes before problems escalate.

## Features

- **Autonomous Monitoring** — Continuously tracks CPU, memory, disk, and network metrics
- **Intelligent Diagnostics** — Analyzes system health and generates actionable recommendations
- **Auto-Remediation** — Automatically executes fixes for detected issues (configurable)
- **Alert System** — Real-time alerts with severity levels (info, warning, critical)
- **Maintenance Scheduling** — Automated log rotation, disk cleanup, security scans, and backups
- **Web Dashboard** — Full-featured themed UI with dark/light mode for real-time monitoring
- **Telegram Bot** — Chat with your infrastructure, get status & alerts on Telegram
- **X (Twitter) Bot** — Automated system health updates and alerts on X (@Auto_Mend)
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

## Telegram Bot

Chat with your infrastructure directly from Telegram. The bot responds to commands and natural language:

| Command | Description |
|---------|-------------|
| `/start` | Main menu with quick action buttons |
| `/status` | Agent status & health score |
| `/metrics` | CPU, Memory, Disk, Network with visual bars |
| `/alerts` | Recent alerts and warnings |
| `/diagnostics` | Service health check & latency |
| `/agents` | CrewAI agent status |
| `/dashboard` | Link to web dashboard |

You can also ask questions in plain English: *"How's the system?"*, *"Any critical alerts?"*, *"Check CPU"*

See [BOT_SETUP.md](BOT_SETUP.md) for full setup instructions.

## X (Twitter) Bot

Automatically share system health, alerts, and maintenance updates on X via **@Auto_Mend** (official project account):

| Post Type | Description | Example |
|-----------|-------------|----------|
| **Health Reports** | System health score and metrics | "✅ Healthy System Health Report - Health Score: 95%" |
| **Critical Alerts** | Immediate notifications of issues | "🚨 CRITICAL ALERT - CPU usage exceeded 90%" |
| **Maintenance Updates** | Task completion notifications | "✅ Maintenance Task Complete - Disk Cleanup" |
| **System Tips** | Best practices and insights | "💡 Tip: Regular log rotation prevents disk space issues" |

### Quick Setup

1. Get X API credentials (see [X_API_SETUP.md](X_API_SETUP.md))
2. Add credentials to `.env`:
   ```env
   X_API_KEY=your-api-key
   X_API_KEY_SECRET=your-api-secret
   X_ACCESS_TOKEN=your-access-token
   X_ACCESS_TOKEN_SECRET=your-access-token-secret
   X_POST_UPDATES=true
   ```
3. Test the bot:
   ```bash
   python3 x_bot.py
   ```

See [X_API_SETUP.md](X_API_SETUP.md) for complete setup instructions.

## Configuration

Key environment variables:

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for deployment |
| `MONITORING_INTERVAL` | Metrics collection interval (ms) |
| `ENVIRONMENT` | Runtime environment (development/production) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `TELEGRAM_AUTHORIZED_USERS` | Comma-separated Telegram chat IDs |
| `DASHBOARD_URL` | URL to the web dashboard |

Alert thresholds are configurable in the dashboard Settings page:
- CPU: warning 70%, critical 90%
- Memory: warning 75%, critical 95%
- Disk: warning 80%, critical 95%

## License

ISC

## Author

**@Auto_Mend** — Official project account on X

Built by **kenGucci** ([𝕏 @suggestionii](https://x.com/suggestionii))
