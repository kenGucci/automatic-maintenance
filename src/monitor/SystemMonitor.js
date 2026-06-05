/**
 * SystemMonitor - Collects system metrics for Automatic Maintenance
 * Tracks CPU, memory, disk, and network usage using Node.js APIs.
 */

const os = require('os');
const fs = require('fs');
const Logger = require('../utils/Logger');

const logger = new Logger('SystemMonitor');

class SystemMonitor {
  constructor(config) {
    this.config = config;
    this.metrics = null;
    this.history = [];
    this.maxHistorySize = 1440; // 24h at 1-minute intervals
    this._interval = null;
  }

  /**
   * Start collecting metrics at the configured interval
   */
  start() {
    const interval = this.config.monitoringInterval || 30000;
    logger.info('Starting system monitor', { intervalMs: interval });

    // Collect immediately
    this.collect();

    // Then on interval
    this._interval = setInterval(() => {
      this.collect();
    }, interval);
  }

  /**
   * Stop collecting metrics
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
      logger.info('System monitor stopped');
    }
  }

  /**
   * Collect current system metrics
   */
  collect() {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // CPU usage (average across all cores)
      const cpuUsage = this._calculateCpuUsage(cpus);

      // Memory usage
      const memoryUsage = ((usedMem / totalMem) * 100).toFixed(1);

      // Disk usage (root partition)
      const diskUsage = this._getDiskUsage();

      // Load averages (1, 5, 15 min)
      const loadAvg = os.loadavg();

      // Network (from /proc/net/dev on Linux or netstat on macOS)
      const network = this._getNetworkStats();

      // Process info
      const processCount = Object.keys(this._getProcessList()).length;

      const metrics = {
        timestamp: new Date().toISOString(),
        cpu_usage: parseFloat(cpuUsage),
        memory_usage: parseFloat(memoryUsage),
        memory_total_mb: Math.round(totalMem / 1024 / 1024),
        memory_used_mb: Math.round(usedMem / 1024 / 1024),
        disk_usage: diskUsage,
        load_average: {
          '1min': parseFloat(loadAvg[0].toFixed(2)),
          '5min': parseFloat(loadAvg[1].toFixed(2)),
          '15min': parseFloat(loadAvg[2].toFixed(2)),
        },
        network,
        active_processes: processCount,
        uptime_seconds: os.uptime(),
        platform: os.platform(),
        hostname: os.hostname(),
      };

      this.metrics = metrics;
      this._addToHistory(metrics);

      logger.debug('Metrics collected', {
        cpu: metrics.cpu_usage,
        memory: metrics.memory_usage,
        disk: metrics.disk_usage?.percent,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to collect metrics', error);
      return null;
    }
  }

  /**
   * Get the current metrics
   */
  getCurrentMetrics() {
    return this.metrics;
  }

  /**
   * Get metric history
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  /**
   * Check if any metric exceeds alert thresholds
   */
  checkThresholds() {
    if (!this.metrics) return [];

    const alerts = [];
    const thresholds = this.config.alertThresholds || {};

    // CPU check
    if (this.metrics.cpu_usage >= (thresholds.cpu?.critical || 90)) {
      alerts.push({ type: 'critical', metric: 'cpu', value: this.metrics.cpu_usage, message: `CPU usage at ${this.metrics.cpu_usage}% (critical)` });
    } else if (this.metrics.cpu_usage >= (thresholds.cpu?.warning || 70)) {
      alerts.push({ type: 'warning', metric: 'cpu', value: this.metrics.cpu_usage, message: `CPU usage at ${this.metrics.cpu_usage}% (warning)` });
    }

    // Memory check
    if (this.metrics.memory_usage >= (thresholds.memory?.critical || 95)) {
      alerts.push({ type: 'critical', metric: 'memory', value: this.metrics.memory_usage, message: `Memory usage at ${this.metrics.memory_usage}% (critical)` });
    } else if (this.metrics.memory_usage >= (thresholds.memory?.warning || 75)) {
      alerts.push({ type: 'warning', metric: 'memory', value: this.metrics.memory_usage, message: `Memory usage at ${this.metrics.memory_usage}% (warning)` });
    }

    // Disk check
    const diskPercent = this.metrics.disk_usage?.percent || 0;
    if (diskPercent >= (thresholds.disk?.critical || 95)) {
      alerts.push({ type: 'critical', metric: 'disk', value: diskPercent, message: `Disk usage at ${diskPercent}% (critical)` });
    } else if (diskPercent >= (thresholds.disk?.warning || 80)) {
      alerts.push({ type: 'warning', metric: 'disk', value: diskPercent, message: `Disk usage at ${diskPercent}% (warning)` });
    }

    return alerts;
  }

  // --- Private methods ---

  _calculateCpuUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const totalUsage = totalTick - totalIdle;
    return ((totalUsage / totalTick) * 100).toFixed(1);
  }

  _getDiskUsage() {
    try {
      // Use statfs for disk info (cross-platform fallback)
      const stats = fs.statfsSync('/');
      const total = stats.bsize * stats.blocks;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      const percent = ((used / total) * 100).toFixed(1);

      return {
        total_gb: (total / 1024 / 1024 / 1024).toFixed(1),
        used_gb: (used / 1024 / 1024 / 1024).toFixed(1),
        free_gb: (free / 1024 / 1024 / 1024).toFixed(1),
        percent: parseFloat(percent),
      };
    } catch {
      return { total_gb: 0, used_gb: 0, free_gb: 0, percent: 0 };
    }
  }

  _getNetworkStats() {
    const interfaces = os.networkInterfaces();
    const result = {};

    for (const [name, addrs] of Object.entries(interfaces)) {
      // Skip internal interfaces
      const external = addrs.filter((a) => !a.internal);
      if (external.length > 0) {
        result[name] = external.map((a) => ({
          address: a.address,
          family: a.family,
        }));
      }
    }

    return result;
  }

  _getProcessList() {
    // Simplified process info using process module
    return { [process.pid]: { pid: process.pid, title: process.title } };
  }

  _addToHistory(metrics) {
    this.history.push({
      timestamp: metrics.timestamp,
      cpu_usage: metrics.cpu_usage,
      memory_usage: metrics.memory_usage,
      disk_usage: metrics.disk_usage?.percent || 0,
    });

    // Trim history to max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }
}

module.exports = SystemMonitor;
