const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const DiagnosticEngine = require('../diagnostic/DiagnosticEngine');

describe('DiagnosticEngine', () => {
  const config = {
    alertThresholds: {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 75, critical: 95 },
      disk: { warning: 80, critical: 95 },
    },
  };

  it('should create an engine instance', () => {
    const engine = new DiagnosticEngine(config);
    assert.ok(engine);
    assert.equal(engine.config, config);
  });

  it('should determine overall status as operational when healthy', () => {
    const engine = new DiagnosticEngine(config);
    const services = [{ name: 'Test', status: 'healthy', latency_ms: 10 }];
    const alerts = [];
    const status = engine._determineOverallStatus(services, alerts);
    assert.equal(status, 'operational');
  });

  it('should determine overall status as degraded with degraded services', () => {
    const engine = new DiagnosticEngine(config);
    const services = [{ name: 'Test', status: 'degraded', latency_ms: 500 }];
    const alerts = [];
    const status = engine._determineOverallStatus(services, alerts);
    assert.equal(status, 'degraded');
  });

  it('should determine overall status as critical with critical alerts', () => {
    const engine = new DiagnosticEngine(config);
    const services = [{ name: 'Test', status: 'healthy', latency_ms: 10 }];
    const alerts = [{ type: 'critical', metric: 'cpu', message: 'CPU critical' }];
    const status = engine._determineOverallStatus(services, alerts);
    assert.equal(status, 'critical');
  });

  it('should calculate average correctly', () => {
    const engine = new DiagnosticEngine(config);
    assert.equal(engine._average([10, 20, 30]), 20.0);
    assert.equal(engine._average([]), 0);
  });

  it('should generate recommendations for high CPU', () => {
    const engine = new DiagnosticEngine(config);
    const metrics = { cpu_usage: 85 };
    const recs = engine._generateRecommendations(metrics, [], { trend: 'stable' });
    assert.ok(recs.length > 0);
    assert.ok(recs.some(r => r.area === 'cpu'));
  });
});