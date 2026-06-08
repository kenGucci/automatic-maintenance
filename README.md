# AutoMend — AI Ops with Controlled Autonomy

Most infra tools tell you something is broken.  
**AutoMend investigates and fixes it.**

Stop paging humans for disk cleanup, log rotation, and threshold alerts your monitoring already saw. AutoMend is an autonomous AI agent that monitors, diagnoses, and remediates system issues — then sends you a report.

## Why this instead of scripts + alerts + DevOps tooling?

| You already have… | AutoMend adds… |
|---|---|
| PagerDuty/OpsGenie alerts | An agent that reads the alert, runs diagnostics, and attempts a fix before waking you up |
| Cron scripts | Context-aware execution — skips cleanup if disk is fine, escalates if a fix fails |
| Dashboards (Grafana, Datadog) | A companion that acts on what the dashboard shows, not just displays it |
| Runbooks | An agent that follows runbooks automatically and reports what happened |

**AutoMend doesn't replace your stack. It sits on top — watching, diagnosing, and fixing the things that don't need a human.**

## How it works: one real workflow

```
Disk usage hits 92% (warning threshold: 80%)
  ↓
AutoMend detects the alert
  ↓
Diagnostic Engine checks: log files, temp dirs, Docker overlay
  ↓
Identifies: unbounded nginx access logs (14GB)
  ↓
Auto-remediation: rotates logs, truncates old access logs, prunes Docker build cache
  ↓
Verifies: disk back to 54%
  ↓
Sends report to dashboard + email:
  "Disk usage spike resolved. Rotated nginx logs, freed 8.2GB."
```

All of this happens without a human in the loop — unless you configure it to require approval for destructive actions.

## Safety boundaries

AutoMend is designed for **controlled autonomy**:

| Action | Default behavior | Configurable |
|---|---|---|
| Read metrics & run diagnostics | ✅ Always allowed | — |
| Log rotation | ✅ Automatic | Can require approval |
| Temp file cleanup | ✅ Automatic | Can require approval |
| Service restarts | ❌ Requires approval | Can be enabled |
| Package updates | ❌ Requires approval | Can be enabled |
| File deletion | ✅ Age-gated (>24h) | Approval required for recent files |
| Config changes | ❌ Requires approval | — |

- **Audit trail**: every action is logged with timestamp, trigger, and result
- **Rollback**: remediation actions record state before changes where possible
- **Sandboxing**: destructive actions are dry-run first unless explicitly approved
- **Kill switch**: `AUTO_REMEDIATION=false` puts the agent in read-only mode

## Evidence

> **Coming soon:**
> - [ ] 30s demo clip — AutoMend detecting and fixing a disk spike live
> - [ ] Before/after screenshot — dashboard alert → resolved notification
> - [ ] Terminal log of a real incident it handled
> - [ ] Dashboard screenshot showing health score, alerts, and task history

![Dashboard preview](./dashboard_screenshot.png)

## Quick start

```bash
npm install
pip install flask crewai crewai-tools
cp .env.example .env
npm start                 # starts the agent
python3 dashboard/app.py  # starts the dashboard at http://127.0.0.1:8080
```

## Architecture

```
index.js  (Node.js entry point)
├── src/agent/           MaintenanceAgent — orchestrates everything
├── src/monitor/         SystemMonitor — collects CPU, memory, disk, network
├── src/diagnostic/      DiagnosticEngine — analyzes health, suggests fixes
├── src/config/          ConfigManager — env-based configuration


maintenance_crew.py      CrewAI multi-agent system (optional)
dashboard/               Flask web dashboard (8 API endpoints)
.github/workflows/       Daily CI/CD at 3 AM UTC
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `MONITORING_INTERVAL` | 30000 | Metrics collection interval (ms) |
| `AUTO_REMEDIATION` | true | Enable automatic fixes |
| `NOTIFICATION_CHANNELS` | email | Comma-separated channels |
| `LOG_LEVEL` | info | debug, info, warn, error |

Alert thresholds (configurable via dashboard):
- CPU: warning 70%, critical 90%
- Memory: warning 75%, critical 95%
- Disk: warning 80%, critical 95%

## License

ISC

## Author

Built by **kenGucci**
