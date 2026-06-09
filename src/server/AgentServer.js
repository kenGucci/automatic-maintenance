const http = require('http');
const os = require('os');
const Logger = require('../utils/Logger');

const logger = new Logger('AgentServer');

class AgentServer {
  constructor(agent) {
    this.agent = agent;
    this.server = null;
    this.port = parseInt(process.env.AGENT_PORT || '9090', 10);
  }

  start() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      try {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const path = url.pathname;

        if (path === '/api/overview') {
          this._handleOverview(req, res);
        } else if (path === '/api/metrics') {
          this._handleMetrics(req, res);
        } else if (path === '/api/alerts') {
          this._handleAlerts(req, res);
        } else if (path === '/api/diagnostics') {
          this._handleDiagnostics(req, res);
        } else if (path === '/api/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'running', source: 'live' }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'not_found' }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });

    this.server.on('error', (err) => {
      logger.error('Failed to start API server', { error: err.message });
    });

    this.server.listen(this.port, () => {
      logger.info(`Agent API server listening on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  _handleOverview(req, res) {
    const metrics = this.agent.monitor.getCurrentMetrics();
    const alerts = this.agent.monitor.checkThresholds();
    const status = this.agent.getStatus();

    const health = metrics ? Math.round(100 - (
      (metrics.cpu_usage * 0.4) +
      (metrics.memory_usage * 0.3) +
      ((metrics.disk_usage ? metrics.disk_usage.percent : 0) * 0.3)
    )) : 85;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      agent_status: status.running ? 'running' : 'stopped',
      last_check: metrics ? metrics.timestamp : new Date().toISOString(),
      uptime: status.uptime,
      total_alerts: status.total_alerts,
      critical_alerts: alerts.filter(a => a.type === 'critical').length,
      tasks_completed_today: status.completed_tasks,
      tasks_pending: status.pending_tasks,
      system_health_score: Math.max(0, Math.min(100, health)),
      source: 'live',
    }));
  }

  _handleMetrics(req, res) {
    const metrics = this.agent.monitor.getCurrentMetrics() || {
      cpu_usage: 0, memory_usage: 0, disk_usage: 0, active_processes: 0, uptime_seconds: 0,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      timestamp: new Date().toISOString(),
      cpu_usage: metrics.cpu_usage || 0,
      memory_usage: metrics.memory_usage || 0,
      disk_usage: (metrics.disk_usage && metrics.disk_usage.percent) || 0,
      network_in_mbps: 0,
      network_out_mbps: 0,
      active_processes: metrics.active_processes || 0,
      uptime_seconds: os.uptime(),
      hostname: os.hostname(),
      source: 'live',
    }));
  }

  _handleAlerts(req, res) {
    const alerts = this.agent.monitor.checkThresholds().map((a, i) => ({
      id: i + 1,
      type: a.type,
      message: a.message,
      timestamp: new Date().toISOString(),
      resolved: false,
      source: 'live',
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alerts));
  }

  _handleDiagnostics(req, res) {
    const diag = this.agent.diagnostic.getLastResults() || { overall_status: 'operational', services: [], recommendations: [] };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      services: diag.services || [],
      last_diagnostic_run: diag.timestamp || new Date().toISOString(),
      overall_status: diag.overall_status || 'operational',
      recommendations: (diag.recommendations || []).map(r => r.message || r),
      source: 'live',
    }));
  }
}

module.exports = AgentServer;
