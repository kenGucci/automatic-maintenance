"""Automatic Maintenance Dashboard - Flask Server"""

import os, time, hashlib, math, json
from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError

# Sentry — error tracking (optional, requires SENTRY_DSN env)
_sentry_dsn = os.environ.get('SENTRY_DSN')
if _sentry_dsn:
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=_sentry_dsn, environment=os.environ.get('NODE_ENV', 'development'), traces_sample_rate=0.2)
    except ImportError:
        pass

_basedir = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__,
    template_folder=os.path.join(_basedir, 'templates'),
    static_folder=os.path.join(_basedir, 'static'),
    static_url_path='/static')

BUCKET_SECONDS = 300  # 5min windows so data stays stable between refreshes

AGENT_URL = os.environ.get('AGENT_URL', 'http://localhost:9090')

def _try_agent(path, timeout=2):
    """Fetch data from the live Node.js agent. Returns None if unavailable."""
    try:
        req = Request(f'{AGENT_URL}{path}', headers={'User-Agent': 'AutoMend-Dashboard'})
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except (URLError, ConnectionRefusedError, OSError, json.JSONDecodeError):
        return None

def _is_live():
    """Check if the Node.js agent is running and serving real data."""
    data = _try_agent('/api/health')
    return data is not None and data.get('source') == 'live'

SEED_AGENTS = [
    {"id": "agent-1", "name": "Production-Web-01", "type": "server", "role": "Web Server", "base_health": 92, "base_tasks": 187, "base_success": 96},
    {"id": "agent-2", "name": "Staging-API-02", "type": "server", "role": "API Gateway", "base_health": 88, "base_tasks": 134, "base_success": 93},
    {"id": "agent-3", "name": "DB-Replica-East", "type": "server", "role": "Database", "base_health": 78, "base_tasks": 212, "base_success": 89},
    {"id": "agent-4", "name": "Cache-Cluster-01", "type": "docker", "role": "Cache Layer", "base_health": 95, "base_tasks": 98, "base_success": 99},
    {"id": "agent-5", "name": "Worker-Pool-03", "type": "kubernetes", "role": "Worker", "base_health": 84, "base_tasks": 256, "base_success": 91},
]

def _bucket():
    return str(int(time.time() / BUCKET_SECONDS))

def _seed(key, offset=0):
    h = hashlib.md5((key + str(offset)).encode()).hexdigest()
    return int(h, 16)

def _v(key, lo, hi, offset=0):
    r = _seed(key, offset)
    return round(lo + (r % (hi - lo + 1)) + (r % 100) / 100, 1)

def _pick(lst, key, offset=0):
    return lst[_seed(key, offset) % len(lst)]

def _ago(seconds):
    return (datetime.utcnow() - timedelta(seconds=seconds)).isoformat()

def _generate_overview(b):
    health = _v(b + "health", 82, 98)
    tasks = _v(b + "tasks_today", 5, 18, 1)
    pending = _v(b + "tasks_pending", 1, 6, 2)
    alerts = _v(b + "total_alerts", 6, 22, 3)
    critical = _v(b + "crit_alerts", 0, 3, 4)
    uptime_h = 72 + _v(b + "uptime_extra", 0, 48, 5)
    return {
        "agent_status": "running",
        "last_check": datetime.utcnow().isoformat(),
        "uptime": f"{int(uptime_h)}h {int(_v(b, 0, 59, 6))}m",
        "total_alerts": int(alerts),
        "critical_alerts": int(critical),
        "tasks_completed_today": int(tasks),
        "tasks_pending": int(pending),
        "system_health_score": health,
    }

def _generate_metrics(b):
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu_usage": _v(b + "cpu", 8, 88),
        "memory_usage": _v(b + "mem", 22, 92),
        "disk_usage": _v(b + "disk", 12, 72),
        "network_in_mbps": _v(b + "netin", 0.3, 52, 1),
        "network_out_mbps": _v(b + "netout", 0.2, 32, 2),
        "active_processes": int(_v(b + "procs", 45, 310, 3)),
        "uptime_seconds": int(time.time()) - 1700000000,
    }

def _generate_history(b):
    base = _v(b + "hist_base", 0, 200, 1)
    history = []
    now = datetime.utcnow()
    for i in range(24):
        t = now - timedelta(hours=i)
        hb = b + f"hist_{i}"
        history.append({
            "timestamp": t.isoformat(),
            "cpu_usage": _v(hb + "cpu", 10, 78, int(base + i)),
            "memory_usage": _v(hb + "mem", 25, 82, int(base + i + 7)),
            "disk_usage": _v(hb + "disk", 15, 62, int(base + i + 13)),
        })
    return sorted(history, key=lambda x: x["timestamp"])

def _generate_alerts(b):
    types = ["warning", "warning", "info", "info", "critical"]
    messages = [
        "CPU usage exceeded 80% threshold",
        "Memory usage approaching critical level",
        "Disk cleanup completed successfully",
        "Network latency spike detected",
        "Service health check passed",
        "Auto-scaling triggered for worker pool",
        "Log rotation completed",
        "SSL certificate expires in 30 days",
        "Database connection pool reaching limit",
        "Scheduled backup completed",
        "High memory allocation in worker process",
        "Docker build cache pruned automatically",
    ]
    n = int(_v(b + "alert_count", 3, 8, 99))
    alerts = []
    for i in range(n):
        alerts.append({
            "id": i + 1,
            "type": _pick(types, b + f"at_{i}", i),
            "message": _pick(messages, b + f"am_{i}", i + 7),
            "timestamp": _ago(int(_v(b + f"ats_{i}", 60, 7200, i + 3))),
            "resolved": _v(b + f"ar_{i}", 0, 1, i + 5) > 0.5,
        })
    return sorted(alerts, key=lambda x: x["timestamp"], reverse=True)

def _generate_tasks(b):
    names = ["Log Rotation", "Disk Cleanup", "Security Scan", "Dependency Update",
             "Backup Verification", "Performance Audit", "Cache Flush", "Health Check",
             "Config Sync", "Certificate Renewal", "Package Update", "Temp File Cleanup"]
    statuses = ["completed", "completed", "completed", "running", "pending", "failed"]
    n = int(_v(b + "task_count", 5, 10, 50))
    tasks = []
    for i in range(n):
        tasks.append({
            "id": i + 1,
            "name": _pick(names, b + f"tn_{i}", i),
            "status": _pick(statuses, b + f"ts_{i}", i + 3),
            "duration_seconds": int(_v(b + f"td_{i}", 4, 310, i + 7)),
            "timestamp": _ago(int(_v(b + f"tt_{i}", 30, 5400, i + 11))),
        })
    return tasks

def _generate_diagnostics(b):
    services = [
        {"name": "API Gateway", "base_latency": 45, "base_status": "healthy"},
        {"name": "Database", "base_latency": 82, "base_status": "healthy"},
        {"name": "Cache Layer", "base_latency": 5, "base_status": "healthy"},
        {"name": "Message Queue", "base_latency": 28, "base_status": "healthy"},
        {"name": "Storage Service", "base_latency": 65, "base_status": "healthy"},
        {"name": "Auth Service", "base_latency": 35, "base_status": "healthy"},
    ]
    svcs = []
    for s in services:
        lat = _v(b + "lat_" + s["name"], s["base_latency"] * 0.7, s["base_latency"] * 1.5, 1)
        statuses = ["healthy", "healthy", "healthy", "degraded"] if s["base_status"] == "healthy" else [s["base_status"]]
        status = _pick(statuses, b + "st_" + s["name"], 2)
        svcs.append({
            "name": s["name"],
            "status": status,
            "latency_ms": int(lat),
        })
    return {
        "services": svcs,
        "last_diagnostic_run": _ago(120),
        "overall_status": "operational",
        "recommendations": [
            "Consider increasing cache TTL for frequently accessed endpoints",
            "Monitor database connection pool usage during peak hours",
            "Schedule off-peak log rotation to minimize latency impact",
        ],
    }

# --- Routes ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/api/mode")
def api_mode():
    return jsonify({"mode": "live" if _is_live() else "demo"})

@app.route("/api/overview")
def api_overview():
    data = _try_agent('/api/overview')
    if data:
        data.pop('source', None)
        return jsonify(data)
    return jsonify(_generate_overview(_bucket()))

@app.route("/api/metrics")
def api_metrics():
    data = _try_agent('/api/metrics')
    if data:
        data.pop('source', None)
        return jsonify(data)
    return jsonify(_generate_metrics(_bucket()))

@app.route("/api/metrics/history")
def api_metrics_history():
    return jsonify(_generate_history(_bucket()))

@app.route("/api/alerts")
def api_alerts():
    data = _try_agent('/api/alerts')
    if data:
        for a in data:
            a.pop('source', None)
        return jsonify(data)
    return jsonify(_generate_alerts(_bucket()))

@app.route("/api/tasks")
def api_tasks():
    return jsonify(_generate_tasks(_bucket()))

@app.route("/api/diagnostics")
def api_diagnostics():
    data = _try_agent('/api/diagnostics')
    if data:
        data.pop('source', None)
        return jsonify(data)
    return jsonify(_generate_diagnostics(_bucket()))

@app.route("/api/settings")
def api_settings():
    return jsonify({
        "monitoring_interval_ms": 30000,
        "auto_remediation_enabled": True,
        "notification_channels": ["email", "slack"],
        "alert_thresholds": {
            "cpu_warning": 70, "cpu_critical": 90,
            "memory_warning": 75, "memory_critical": 95,
            "disk_warning": 80, "disk_critical": 95,
        },
        "maintenance_schedule": {
            "log_rotation": "daily",
            "disk_cleanup": "weekly",
            "security_scan": "daily",
            "backup": "daily",
        },
    })

@app.route("/api/activity")
def api_activity():
    b = _bucket() + "_act"
    events = [
        "Agent Production-Web-01 completed log rotation",
        "Threshold alert cleared: CPU on Staging-API-02",
        "Diagnostic engine analyzed 12 service endpoints",
        "Auto-remediation: disk cleanup on DB-Replica-East",
        "Health check passed for all 5 agents",
        "Agent Cache-Cluster-01 flushed expired keys",
        "Security scan completed: 0 vulnerabilities found",
        "Backup verification: all snapshots consistent",
        "Config sync pushed to Worker-Pool-03",
        "Agent Staging-API-02 rotated access logs",
        "Docker build cache pruned on Worker-Pool-03",
        "SSL certificate check: 30 days until expiry",
        "Memory optimization applied to Production-Web-01",
        "Network latency spike detected and resolved",
        "Scheduled maintenance window opened for DB-Replica-East",
    ]
    n = int(_v(b + "n", 6, 12, 1))
    items = []
    for i in range(n):
        items.append({
            "id": i + 1,
            "message": _pick(events, b + f"ev_{i}", i),
            "type": _pick(["action", "action", "action", "alert", "info", "success"], b + f"et_{i}", i + 3),
            "timestamp": _ago(int(_v(b + f"ets_{i}", 10, 3600, i + 7))),
        })
    return jsonify({"events": sorted(items, key=lambda x: x["timestamp"], reverse=True)})

@app.route("/chat")
def chat_page():
    return render_template("chat.html")

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "")
    image_b64 = data.get("image", "")
    if not question and not image_b64:
        return jsonify({"error": "question or image is required"}), 400

    # Try live agent first
    agent = _try_agent('/api/health')
    if agent and not image_b64:
        try:
            from urllib.request import Request, urlopen
            req = Request(
                f'{AGENT_URL}/api/chat',
                method='POST',
                data=json.dumps({"question": question}).encode(),
                headers={'Content-Type': 'application/json', 'User-Agent': 'AutoMend-Dashboard'}
            )
            with urlopen(req, timeout=10) as resp:
                return jsonify(json.loads(resp.read().decode()))
        except Exception:
            pass

    # Fallback: use Claude directly from dashboard if ANTHROPIC_API_KEY is set
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            b = _bucket()
            metrics = _generate_metrics(b)
            alerts = _generate_alerts(b)

            content = []
            system_prompt = "You are an expert systems engineer and AI ops assistant for AutoMend."

            has_image = bool(image_b64)
            context_intro = ""

            if has_image:
                system_prompt += " You can analyze images, screenshots, and diagrams."
                context_intro = "The user has also uploaded an image."

                import re
                img_match = re.match(r'data:image/(\w+);base64,(.+)', image_b64)
                if img_match:
                    media_type = f"image/{img_match.group(1)}"
                    img_data = img_match.group(2)
                else:
                    media_type = "image/png"
                    img_data = image_b64

                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": img_data,
                    }
                })

            if question:
                user_msg = f"""{context_intro}

Current system metrics:
{json.dumps(metrics, indent=2)}

Recent alerts:
{json.dumps(alerts[:5], indent=2)}

User question: {question}

Answer concisely based on the data."""
            else:
                user_msg = f"""{context_intro}

Current system metrics:
{json.dumps(metrics, indent=2)}

Recent alerts:
{json.dumps(alerts[:5], indent=2)}

The user uploaded an image. Please analyze it and describe what you see. If it relates to system monitoring or infrastructure, provide insights."""

            content.append({
                "type": "text",
                "text": user_msg,
            })

            response = client.messages.create(
                model=os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514"),
                max_tokens=1000,
                temperature=0.3,
                system=system_prompt,
                messages=[{"role": "user", "content": content}],
            )
            return jsonify({
                "question": question,
                "answer": response.content[0].text.strip(),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "dashboard",
            })
        except Exception as e:
            return jsonify({"error": f"Claude unavailable: {e}"}), 500

    if image_b64:
        return jsonify({"answer": "Image received! To enable AI image analysis, set ANTHROPIC_API_KEY in your .env file."}), 200

    return jsonify({"answer": "I'm running in fallback mode. For full AI responses, start the live agent or set ANTHROPIC_API_KEY. Your question was noted though!"}), 200


@app.route("/api/actions")
def api_actions():
    data = _try_agent('/api/actions')
    if data is not None:
        return jsonify(data)
    actions = [
        {"name": "Log Rotation", "result": "Rotated 12 log files (freed 412MB)", "timestamp": _ago(180), "status": "completed"},
        {"name": "Disk Cleanup", "result": "Cleaned 89 temp files (freed 234MB)", "timestamp": _ago(360), "status": "completed"},
        {"name": "Log Rotation", "result": "Rotated 8 log files (freed 298MB)", "timestamp": _ago(1800), "status": "completed"},
        {"name": "Cache Flush", "result": "Cleared Redis cache (freed 156MB)", "timestamp": _ago(3600), "status": "completed"},
        {"name": "Disk Cleanup", "result": "Cleaned 45 temp files (freed 112MB)", "timestamp": _ago(7200), "status": "completed"},
    ]
    return jsonify(actions)

@app.route("/api/settings", methods=["POST"])
def api_update_settings():
    return jsonify({"status": "saved", "message": "Settings updated successfully"})

@app.route("/api/agents")
def api_agents():
    b = _bucket()
    agents = []
    for a in SEED_AGENTS:
        ab = b + a["id"]
        hs = _v(ab + "hs", max(60, a["base_health"] - 15), min(99, a["base_health"] + 8), 1)
        tc = int(_v(ab + "tc", a["base_tasks"] - 20, a["base_tasks"] + 25, 2))
        sr = _v(ab + "sr", max(75, a["base_success"] - 8), min(99, a["base_success"] + 4), 3)
        runtime_h = _v(ab + "rt", 48, 168, 4)
        agents.append({
            "name": a["name"],
            "role": a["role"],
            "type": a["type"],
            "status": _pick(["active", "active", "active", "warning"], ab + "st", 5),
            "health_score": hs,
            "tasks_completed": tc,
            "success_rate": sr,
            "last_action": _pick([
                "Researched deployment best practices",
                "Fixed memory leak in monitor module",
                "Reviewed PR #42",
                "Auto-remediated disk threshold warning",
                "Optimized database query performance",
                "Rotated access logs on web server",
                "Pruned Docker build cache",
            ], ab + "la", 6),
            "runtime": f"{int(runtime_h)}h {int(_v(ab, 0, 59, 7))}m",
            "started_at": (datetime.utcnow() - timedelta(hours=int(runtime_h))).isoformat(),
            "uptime_hours": runtime_h,
            "cpu": _v(ab + "cpu", 10, 92, 8),
            "memory": _v(ab + "mem", 20, 92, 9),
            "alerts": int(_v(ab + "al", 0, 8, 10)),
            "last_active": _ago(int(_v(ab + "la2", 10, 1800, 11))),
        })
    return jsonify({
        "agents": agents,
        "crew_status": "operational",
        "total_tasks_completed": sum(a["tasks_completed"] for a in agents),
        "average_success_rate": round(sum(a["success_rate"] for a in agents) / len(agents), 1),
    })

# --- Bankr / Crypto Routes ---

@app.route("/api/bankr/portfolio")
def api_bankr_portfolio():
    from dashboard.bankr_client import get_portfolio, get_wallet_info
    portfolio = get_portfolio()
    info = get_wallet_info()
    return jsonify({
        "portfolio": portfolio or {"error": "Bankr API unavailable"},
        "info": info or {"error": "Bankr API unavailable"},
    })

@app.route("/api/bankr/tokens")
def api_bankr_tokens():
    from dashboard.bankr_client import search_tokens, get_token_info
    q = request.args.get("q", "")
    if q:
        return jsonify(search_tokens(q) or {"error": "Bankr API unavailable"})
    return jsonify({"tokens": []})

@app.route("/api/bankr/credits")
def api_bankr_credits():
    from dashboard.bankr_client import check_credits
    return jsonify(check_credits() or {"error": "Bankr API unavailable"})

# --- Pro Dashboard Routes ---

@app.route("/dashboard/pro")
def pro_dashboard():
    return render_template("pro-dashboard.html")

@app.route("/api/pro/agents")
def api_pro_agents():
    b = _bucket() + "_pro"
    agents = []
    for a in SEED_AGENTS:
        ab = b + a["id"]
        hs = _v(ab + "hs", max(60, a["base_health"] - 15), min(99, a["base_health"] + 8), 1)
        tc = int(_v(ab + "tc", a["base_tasks"] - 20, a["base_tasks"] + 25, 2))
        sr = _v(ab + "sr", max(75, a["base_success"] - 8), min(99, a["base_success"] + 4), 3)
        runtime_h = _v(ab + "rt", 48, 168, 4)
        agents.append({
            "id": a["id"],
            "name": a["name"],
            "type": a["type"],
            "role": a["role"],
            "status": _pick(["active", "active", "active", "warning"], ab + "st", 5),
            "health_score": hs,
            "tasks_completed": tc,
            "success_rate": sr,
            "cpu": _v(ab + "cpu", 10, 92, 8),
            "memory": _v(ab + "mem", 20, 92, 9),
            "alerts": int(_v(ab + "al", 0, 8, 10)),
            "runtime": f"{int(runtime_h)}h {int(_v(ab, 0, 59, 7))}m",
            "uptime_hours": runtime_h,
            "last_active": _ago(int(_v(ab + "la2", 10, 1800, 11))),
        })
    return jsonify({"agents": agents})

@app.route("/api/pro/alerts")
def api_pro_alerts():
    b = _bucket() + "_pro_al"
    agents = SEED_AGENTS
    alert_msgs = [
        "CPU threshold exceeded", "Memory usage spike", "Disk space low",
        "Service unresponsive", "SSL cert expiring", "Connection pool full",
        "High latency detected", "Backup completed", "Config drift detected",
        "Security scan passed",
    ]
    alerts = []
    aid = 1
    for a in agents:
        ab = b + a["id"]
        n = int(_v(ab + "n", 1, 4, 1))
        for i in range(n):
            alerts.append({
                "id": aid,
                "agent_name": a["name"],
                "type": _pick(["critical", "warning", "warning", "info", "info"], ab + f"t_{i}", i),
                "message": _pick(alert_msgs, ab + f"m_{i}", i + 3),
                "timestamp": _ago(int(_v(ab + f"ts_{i}", 60, 2880, i + 7))),
            })
            aid += 1
    return jsonify({"alerts": sorted(alerts, key=lambda x: x["timestamp"], reverse=True)})

@app.route("/api/pro/analytics")
def api_pro_analytics():
    b = _bucket() + "_pro_an"
    return jsonify({
        "avg_response_time": round(_v(b + "art", 20, 200, 1), 1),
        "maintenance_tasks": int(_v(b + "mt", 50, 500, 2)),
        "auto_remediation_rate": round(_v(b + "arr", 85, 99, 3), 1),
        "success_history": [round(_v(b + f"sh_{i}", 85, 99, i * 3), 1) for i in range(30)],
        "task_distribution": [int(_v(b + f"td_{i}", 10, 35, i * 5)) for i in range(5)],
    })

@app.route("/api/pro/maintenance")
def api_pro_maintenance():
    b = _bucket() + "_pro_mt"
    maint_tasks = [
        "Log Rotation", "Security Scan", "Disk Cleanup",
        "Backup Verification", "Dependency Update", "Cache Flush",
        "Cert Renewal", "Config Sync", "Health Check", "Performance Audit",
    ]
    schedules = []
    for a in SEED_AGENTS:
        ab = b + a["id"]
        items = []
        for _ in range(int(_v(ab + "n", 4, 7, 1))):
            tid = int(_v(ab + "tid", 0, 99999, len(items) + 2))
            items.append({
                "task": _pick(maint_tasks, ab + f"tk_{tid}", tid),
                "last_run": _ago(int(_v(ab + f"lr_{tid}", 600, 259200, tid + 5))),
                "status": _pick(["completed", "completed", "running", "pending"], ab + f"st_{tid}", tid + 3),
            })
        schedules.append({
            "agent_name": a["name"],
            "status": _pick(["On track", "On track", "On track", "Needs attention"], ab + "st", 99),
            "items": items,
        })
    return jsonify({"schedules": schedules})

@app.route("/api/pro/connect", methods=["POST"])
def api_pro_connect():
    return jsonify({"status": "connected", "agent_id": f"agent-{len(SEED_AGENTS) + 1}"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
