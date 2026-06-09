import os, json, sys, time, socket
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.claude_client import ClaudeClient


class ClaudeDiagnosticEngine:
    def __init__(self):
        self._claude = ClaudeClient()
        self.last_run = None
        self.results = None

    def analyze(self, collector):
        metrics = collector.get_current()
        alerts = collector.check_thresholds()
        history = collector.get_history(50)

        if not metrics:
            return {"overall_status": "unknown", "summary": "No metrics available", "issues": [], "actionable_steps": []}

        try:
            analysis = self._claude.analyze_metrics(metrics, alerts, history)
        except Exception as e:
            analysis = {
                "overall_status": "degraded" if alerts else "operational",
                "summary": f"Claude analysis unavailable ({e}). Falling back to threshold-based assessment.",
                "issues": [{"severity": a["type"], "area": a["metric"], "description": a["message"], "recommendation": "Investigate manually"} for a in alerts],
                "actionable_steps": [],
            }

        self.last_run = datetime.utcnow().isoformat()
        self.results = {
            "timestamp": self.last_run,
            "overall_status": analysis.get("overall_status", "unknown"),
            "summary": analysis.get("summary", ""),
            "issues": analysis.get("issues", []),
            "actionable_steps": analysis.get("actionable_steps", []),
            "metrics_summary": {
                "cpu": metrics.get("cpu_usage"),
                "memory": metrics.get("memory_usage"),
                "disk": metrics.get("disk_usage", {}).get("percent"),
            },
        }
        return self.results

    def chat(self, question, collector):
        metrics = collector.get_current() or {}
        alerts = collector.check_thresholds()
        history = collector.get_history(50)

        try:
            return self._claude.ask(question, metrics, alerts, history)
        except Exception as e:
            return f"Claude unavailable: {e}"
