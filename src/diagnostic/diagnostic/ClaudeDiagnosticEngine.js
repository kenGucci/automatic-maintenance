const Logger = require('../utils/Logger');

const logger = new Logger('ClaudeDiagnosticEngine');

class ClaudeDiagnosticEngine {
  constructor(config) {
    this.config = config;
    this.lastRun = null;
    this.results = null;
    this._client = null;
  }

  async _ensureClient() {
    if (this._client) return;
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required');
      this._client = new Anthropic({ apiKey });
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        throw new Error('@anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk');
      }
      throw e;
    }
  }

  async analyze(monitor) {
    const metrics = monitor.getCurrentMetrics();
    const alerts = monitor.checkThresholds();
    const history = monitor.getHistory(50);

    if (!metrics) {
      return { overall_status: 'unknown', summary: 'No metrics available', issues: [], actionable_steps: [] };
    }

    try {
      await this._ensureClient();
      const prompt = `You are an expert systems engineer analyzing server health metrics.

Current metrics:
${JSON.stringify(metrics, null, 2)}

Active alerts:
${JSON.stringify(alerts, null, 2)}

Recent history (last ${history.length} data points):
${JSON.stringify(history.slice(-20), null, 2)}

Analyze the system health and return a JSON object with:
1. "overall_status": "operational", "degraded", or "critical"
2. "summary": 2-3 sentence plain-text summary of system health
3. "issues": list of objects with "severity" (low/medium/high/critical), "area" (cpu/memory/disk/network/unknown), "description", and "recommendation"
4. "actionable_steps": list of specific actions to take (max 3)

Return ONLY valid JSON, no markdown or extra text.`;

      const response = await this._client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.2,
        system: 'You are a precise systems diagnostic engine. Respond only with valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.split('\n').slice(1).join('\n').replace(/```$/, '').trim();
      }
      const analysis = JSON.parse(text);

      this.lastRun = new Date().toISOString();
      this.results = {
        timestamp: this.lastRun,
        ...analysis,
        metrics_summary: {
          cpu: metrics.cpu_usage,
          memory: metrics.memory_usage,
          disk: metrics.disk_usage?.percent,
        },
      };
    } catch (error) {
      logger.error('Claude analysis failed', error);
      this.results = {
        timestamp: new Date().toISOString(),
        overall_status: alerts.length > 0 ? 'degraded' : 'operational',
        summary: `Claude analysis unavailable (${error.message}). Using threshold-based assessment.`,
        issues: alerts.map(a => ({
          severity: a.type,
          area: a.metric,
          description: a.message,
          recommendation: 'Investigate manually',
        })),
        actionable_steps: [],
      };
    }

    return this.results;
  }

  async chat(question, monitor) {
    const metrics = monitor.getCurrentMetrics() || {};
    const alerts = monitor.checkThresholds();
    const history = monitor.getHistory(50);

    try {
      await this._ensureClient();
      const prompt = `You are an expert systems engineer monitoring a production server.

Current system metrics:
${JSON.stringify(metrics, null, 2)}

Active alerts:
${JSON.stringify(alerts, null, 2)}

Recent history snippet:
${JSON.stringify(history.slice(-10), null, 2)}

The user asks: ${question}

Answer concisely and helpfully based on the data above. If you don't have enough data to answer, say so.`;

      const response = await this._client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 800,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].text.trim();
    } catch (error) {
      logger.error('Claude chat failed', error);
      return `Claude unavailable: ${error.message}`;
    }
  }

  getLastResults() {
    return this.results;
  }
}

module.exports = ClaudeDiagnosticEngine;
