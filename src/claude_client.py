import os, json, sys

try:
    import anthropic
except ImportError:
    anthropic = None


class ClaudeClient:
    def __init__(self):
        self._client = None
        self._model = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514")

    def _ensure_client(self):
        if self._client:
            return
        if anthropic is None:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        self._client = anthropic.Anthropic(api_key=api_key)

    def analyze_metrics(self, metrics, alerts, history):
        self._ensure_client()
        prompt = f"""You are an expert systems engineer analyzing server health metrics.

Current metrics:
{json.dumps(metrics, indent=2)}

Active alerts:
{json.dumps(alerts, indent=2)}

Recent history (last {len(history)} data points):
{json.dumps(history[-20:], indent=2)}

Analyze the system health and return a JSON object with:
1. "overall_status": "operational", "degraded", or "critical"
2. "summary": 2-3 sentence plain-text summary of system health
3. "issues": list of objects with "severity" (low/medium/high/critical), "area" (cpu/memory/disk/network/unknown), "description", and "recommendation"
4. "actionable_steps": list of specific command-line or operational steps to take (max 3)

Return ONLY valid JSON, no markdown or extra text."""
        response = self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            temperature=0.2,
            system="You are a precise systems diagnostic engine. Respond only with valid JSON.",
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        return json.loads(text)

    def ask(self, question, metrics, alerts, history):
        self._ensure_client()
        prompt = f"""You are an expert systems engineer monitoring a production server.

Current system metrics:
{json.dumps(metrics, indent=2)}

Active alerts:
{json.dumps(alerts, indent=2)}

Recent history snippet:
{json.dumps(history[-10:], indent=2)}

The user asks: {question}

Answer concisely and helpfully based on the data above. If you don't have enough data to answer, say so."""
        response = self._client.messages.create(
            model=self._model,
            max_tokens=800,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
