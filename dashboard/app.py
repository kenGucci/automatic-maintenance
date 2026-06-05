"""Automatic Maintenance Dashboard - Flask Server"""

from flask import Flask, render_template, jsonify
import random
import time
from datetime import datetime, timedelta

app = Flask(__name__)


def generate_mock_metrics():
    """Generate realistic mock system metrics."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu_usage": round(random.uniform(5, 85), 1),
        "memory_usage": round(random.uniform(20, 90), 1),
        "disk_usage": round(random.uniform(10, 70), 1),
        "network_in_mbps": round(random.uniform(0.5, 50), 2),
        "network_out_mbps": round(random.uniform(0.3, 30), 2),
        "active_processes": random.randint(50, 300),
        "uptime_seconds": int(time.time()) - 1700000000,
    }


def generate_mock_alerts():
    """Generate mock alert data."""
    alert_types = ["warning", "critical", "info"]
    alert_messages = [
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
    ]
    alerts = []
    for i in range(random.randint(3, 8)):
        alerts.append({
            "id": i + 1,
            "type": random.choice(alert_types),
            "message": random.choice(alert_messages),
            "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(0, 120))).isoformat(),
            "resolved": random.choice([True, False, False]),
        })
    return sorted(alerts, key=lambda x: x["timestamp"], reverse=True)


def generate_mock_tasks():
    """Generate mock maintenance task data."""
    task_statuses = ["completed", "running", "pending", "failed"]
    task_names = [
        "Log Rotation",
        "Disk Cleanup",
        "Security Scan",
        "Dependency Update",
        "Backup Verification",
        "Performance Audit",
        "Cache Flush",
        "Health Check",
        "Config Sync",
        "Certificate Renewal",
    ]
    tasks = []
    for i in range(random.randint(5, 10)):
        tasks.append({
            "id": i + 1,
            "name": random.choice(task_names),
            "status": random.choice(task_statuses),
            "duration_seconds": random.randint(5, 300),
            "timestamp": (datetime.utcnow() - timedelta(minutes=random.randint(0, 60))).isoformat(),
        })
    return tasks


def generate_mock_history():
    """Generate mock metric history for charts."""
    history = []
    now = datetime.utcnow()
    for i in range(24):
        t = now - timedelta(hours=i)
        history.append({
            "timestamp": t.isoformat(),
            "cpu_usage": round(random.uniform(10, 75), 1),
            "memory_usage": round(random.uniform(25, 80), 1),
            "disk_usage": round(random.uniform(15, 60), 1),
        })
    return sorted(history, key=lambda x: x["timestamp"])


# --- Routes ---


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/overview")
def api_overview():
    return jsonify({
        "agent_status": "running",
        "last_check": datetime.utcnow().isoformat(),
        "uptime": "72h 15m",
        "total_alerts": random.randint(5, 20),
        "critical_alerts": random.randint(0, 3),
        "tasks_completed_today": random.randint(5, 15),
        "tasks_pending": random.randint(1, 5),
        "system_health_score": round(random.uniform(70, 99), 1),
    })


@app.route("/api/metrics")
def api_metrics():
    return jsonify(generate_mock_metrics())


@app.route("/api/metrics/history")
def api_metrics_history():
    return jsonify(generate_mock_history())


@app.route("/api/alerts")
def api_alerts():
    return jsonify(generate_mock_alerts())


@app.route("/api/tasks")
def api_tasks():
    return jsonify(generate_mock_tasks())


@app.route("/api/diagnostics")
def api_diagnostics():
    services = [
        {"name": "API Gateway", "status": random.choice(["healthy", "healthy", "degraded"]), "latency_ms": random.randint(10, 200)},
        {"name": "Database", "status": random.choice(["healthy", "healthy", "warning"]), "latency_ms": random.randint(5, 150)},
        {"name": "Cache Layer", "status": "healthy", "latency_ms": random.randint(1, 10)},
        {"name": "Message Queue", "status": random.choice(["healthy", "healthy", "degraded"]), "latency_ms": random.randint(5, 50)},
        {"name": "Storage Service", "status": "healthy", "latency_ms": random.randint(20, 100)},
        {"name": "Auth Service", "status": "healthy", "latency_ms": random.randint(10, 50)},
    ]
    return jsonify({
        "services": services,
        "last_diagnostic_run": datetime.utcnow().isoformat(),
        "overall_status": "operational",
        "recommendations": [
            "Consider increasing cache TTL for frequently accessed endpoints",
            "Monitor database connection pool usage during peak hours",
        ],
    })


@app.route("/api/settings")
def api_settings():
    return jsonify({
        "monitoring_interval_ms": 30000,
        "alert_thresholds": {
            "cpu_warning": 70,
            "cpu_critical": 90,
            "memory_warning": 75,
            "memory_critical": 95,
            "disk_warning": 80,
            "disk_critical": 95,
        },
        "auto_remediation_enabled": True,
        "notification_channels": ["email", "slack"],
        "maintenance_schedule": {
            "log_rotation": "daily",
            "disk_cleanup": "weekly",
            "security_scan": "daily",
            "backup": "daily",
        },
    })


@app.route("/api/settings", methods=["POST"])
def api_update_settings():
    # In a real app, this would persist settings
    return jsonify({"status": "saved", "message": "Settings updated successfully"})


@app.route("/api/agents")
def api_agents():
    """Return agent status data."""
    return jsonify({
        "agents": [
            {
                "name": "Senior Researcher",
                "role": "Research & Analysis",
                "status": "active",
                "tasks_completed": 47,
                "success_rate": 94.0,
                "last_action": "Researched deployment best practices",
            },
            {
                "name": "Senior Coder",
                "role": "Code Generation & Fixes",
                "status": "active",
                "tasks_completed": 63,
                "success_rate": 91.0,
                "last_action": "Fixed memory leak in monitor module",
            },
            {
                "name": "Code Reviewer",
                "role": "Quality Assurance",
                "status": "active",
                "tasks_completed": 55,
                "success_rate": 97.0,
                "last_action": "Reviewed PR #42",
            },
        ],
        "crew_status": "operational",
        "total_tasks_completed": 165,
        "average_success_rate": 94.0,
    })


if __name__ == "__main__":
    app.run(debug=True, port=8080)
    