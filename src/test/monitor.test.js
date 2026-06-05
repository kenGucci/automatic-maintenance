const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const SystemMonitor = require('../monitor/SystemMonitor');

describe('SystemMonitor', () => {
  const config = {
    monitoringInterval: 30000,
    alertThresholds: {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 75, critical: 95 },
      disk: { warning: 80, critical: 95 },
    },
  };

  it('should create a monitor instance', () => {
    const monitor = new SystemMonitor(config);
    assert.ok(monitor);
    assert.equal(monitor.config, config);
  });

  it('should collect metrics', () => {
    const monitor = new SystemMonitor(config);
    const metrics = monitor.collect();
    assert.ok(metrics);
    assert.ok(typeof metrics.cpu_usage === 'number');
    assert.ok(typeof metrics.memory_usage === 'number');
    assert.ok(metrics.timestamp);
  });

  it('should return current metrics', () => {
    const monitor = new SystemMonitor(config);
    monitor.collect();
    const current = monitor.getCurrentMetrics();
    assert.ok(current);
    assert.equal(current, monitor.metrics);
  });

  it('should track history', () => {
    const monitor = new SystemMonitor(config);
    monitor.collect();
    const history = monitor.getHistory();
    assert.ok(Array.isArray(history));
    assert.ok(history.length >= 1);
  });

  it('should check thresholds and return alerts', () => {
    const monitor = new SystemMonitor(config);
    monitor.collect();
    const alerts = monitor.checkThresholds();
    assert.ok(Array.isArray(alerts));
  });

  it('should return empty alerts when no metrics', () => {
    const monitor = new SystemMonitor(config);
    const alerts = monitor.checkThresholds();
    assert.equal(alerts.length, 0);
  });
});