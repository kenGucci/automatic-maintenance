/**
 * DiagnosticEngine - Analyzes system health and generates recommendations
 * Performs service health checks, latency measurements, and trend analysis.
 */

const net = require('net');
const Logger = require('../utils/Logger');

const logger = new Logger('DiagnosticEngine');

class DiagnosticEngine {
  constructor(config) {
    this.config = config;
    this.lastRun = null;
    this.results = null;
    this.recommendations = [];
  }

  /**
   * Run a full diagnostic check
   */
  async runDiagnostics(monitor) {
    logger.info('Running system diagnostics...');

    try {
      const metrics = monitor.getCurrentMetrics();
      const services = await this._checkServices();
      const alerts = monitor.checkThresholds();
      const trends = this._analyzeTrends(monitor.getHistory());

      const recommendations = this._generateRecommendations(metrics, alerts, trends);

      const results = {
        timestamp: new Date().toISOString(),
        overall_status: this._determineOverallStatus(services, alerts),
        services,
        alerts,
        trends,
        recommendations,
        metrics_summary: {
          cpu: metrics?.cpu_usage,
          memory: metrics?.memory_usage,
          disk: metrics?.disk_usage?.percent,
          load: metrics?.load_average,
        },
      };

      this.lastRun = results.timestamp;
      this.results = results;
      this.recommendations = recommendations;

      logger.info('Diagnostics complete', {
        status: results.overall_status,
        services: services.length,
        alerts: alerts.length,
        recommendations: recommendations.length,
      });

      return results;
    } catch (error) {
      logger.error('Diagnostics failed', error);
      return {
        timestamp: new Date().toISOString(),
        overall_status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get the last diagnostic results
   */
  getLastResults() {
    return this.results;
  }

  /**
   * Get current recommendations
   */
  getRecommendations() {
    return this.recommendations;
  }

  /**
   * Check the health of known services
   */
  async _checkServices() {
    const serviceChecks = [
      { name: 'API Gateway', port: 8080, protocol: 'http' },
      { name: 'Database', port: 5432, protocol: 'tcp' },
      { name: 'Cache Layer', port: 6379, protocol: 'tcp' },
      { name: 'Message Queue', port: 5672, protocol: 'tcp' },
      { name: 'Storage Service', port: 9000, protocol: 'http' },
      { name: 'Auth Service', port: 8443, protocol: 'https' },
    ];

    const results = [];

    for (const service of serviceChecks) {
      const start = Date.now();
      let status = 'healthy';
      let latencyMs = 0;

      try {
        // Attempt a basic connection check
        latencyMs = await this._checkPort(service.port, service.protocol);
        status = latencyMs < 100 ? 'healthy' : latencyMs < 500 ? 'degraded' : 'warning';
      } catch {
        status = 'unreachable';
        latencyMs = -1;
      }

      results.push({
        name: service.name,
        status,
        latency_ms: latencyMs,
        port: service.port,
        protocol: service.protocol,
        response_time: Date.now() - start,
      });
    }

    return results;
  }

  /**
   * Check if a port is reachable
   */
  _checkPort(port, protocol = 'tcp') {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const socket = new net.Socket();
      socket.setTimeout(2000);

      socket.on('connect', () => {
        const latency = Date.now() - start;
        socket.destroy();
        resolve(latency);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(2000);
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(new Error(`Port ${port} unreachable: ${err.message}`));
      });

      socket.connect(port, '127.0.0.1');
    });
  }

  /**
   * Analyze metric trends over time
   */
  _analyzeTrends(history) {
    if (!history || history.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    const avgRecent = {
      cpu: this._average(recent.map((h) => h.cpu_usage)),
      memory: this._average(recent.map((h) => h.memory_usage)),
    };

    const avgOlder = older.length > 0 ? {
      cpu: this._average(older.map((h) => h.cpu_usage)),
      memory: this._average(older.map((h) => h.memory_usage)),
    } : avgRecent;

    return {
      trend: 'stable',
      cpu: {
        current: avgRecent.cpu,
        previous: avgOlder.cpu,
        direction: avgRecent.cpu > avgOlder.cpu ? 'increasing' : avgRecent.cpu < avgOlder.cpu ? 'decreasing' : 'stable',
      },
      memory: {
        current: avgRecent.memory,
        previous: avgOlder.memory,
        direction: avgRecent.memory > avgOlder.memory ? 'increasing' : avgRecent.memory < avgOlder.memory ? 'decreasing' : 'stable',
      },
    };
  }

  /**
   * Generate recommendations based on diagnostics
   */
  _generateRecommendations(metrics, alerts, trends) {
    const recommendations = [];

    // CPU recommendations
    if (metrics?.cpu_usage > 70) {
      recommendations.push({
        priority: 'high',
        area: 'cpu',
        message: 'High CPU usage detected. Consider scaling horizontally or optimizing compute-intensive processes.',
      });
    }

    // Memory recommendations
    if (metrics?.memory_usage > 75) {
      recommendations.push({
        priority: 'high',
        area: 'memory',
        message: 'Memory usage is elevated. Review memory leaks or consider increasing available RAM.',
      });
    }

    // Disk recommendations
    const diskPercent = metrics?.disk_usage?.percent || 0;
    if (diskPercent > 80) {
      recommendations.push({
        priority: 'medium',
        area: 'disk',
        message: 'Disk usage approaching capacity. Schedule a cleanup or expand storage.',
      });
    }

    // Trend-based recommendations
    if (trends?.cpu?.direction === 'increasing') {
      recommendations.push({
        priority: 'medium',
        area: 'cpu',
        message: 'CPU usage trend is increasing. Monitor closely and prepare auto-scaling policies.',
      });
    }

    if (trends?.memory?.direction === 'increasing') {
      recommendations.push({
        priority: 'medium',
        area: 'memory',
        message: 'Memory usage trend is increasing. Investigate potential memory leaks.',
      });
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter((a) => a.type === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push({
        priority: 'critical',
        area: 'alerts',
        message: `${criticalAlerts.length} critical alert(s) active. Immediate attention required.`,
      });
    }

    // Default healthy recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'info',
        area: 'general',
        message: 'All systems operating within normal parameters. No action required.',
      });
    }

    return recommendations;
  }

  /**
   * Determine overall system status
   */
  _determineOverallStatus(services, alerts) {
    const criticalAlerts = alerts.filter((a) => a.type === 'critical');
    const degradedServices = services.filter((s) => s.status === 'degraded' || s.status === 'warning');
    const unreachableServices = services.filter((s) => s.status === 'unreachable');

    if (criticalAlerts.length > 0 || unreachableServices.length > 0) return 'critical';
    if (degradedServices.length > 0) return 'degraded';
    return 'operational';
  }

  /**
   * Calculate average of an array of numbers
   */
  _average(arr) {
    if (!arr.length) return 0;
    return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
  }
}

module.exports = DiagnosticEngine;
