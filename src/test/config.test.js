const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const ConfigManager = require('../config/ConfigManager');

describe('ConfigManager', () => {
  it('should load with sensible defaults', () => {
    const config = ConfigManager.load();
    assert.equal(config.environment, 'development');
    assert.equal(config.monitoringInterval, 30000);
    assert.equal(config.autoRemediation, true);
    assert.equal(config.dashboardPort, 8080);
  });

  it('should have alert thresholds', () => {
    const config = ConfigManager.load();
    assert.ok(config.alertThresholds);
    assert.equal(config.alertThresholds.cpu.warning, 70);
    assert.equal(config.alertThresholds.cpu.critical, 90);
    assert.equal(config.alertThresholds.memory.warning, 75);
    assert.equal(config.alertThresholds.memory.critical, 95);
    assert.equal(config.alertThresholds.disk.warning, 80);
    assert.equal(config.alertThresholds.disk.critical, 95);
  });

  it('should have maintenance schedule defaults', () => {
    const config = ConfigManager.load();
    assert.equal(config.maintenanceSchedule.logRotation, 'daily');
    assert.equal(config.maintenanceSchedule.diskCleanup, 'weekly');
    assert.equal(config.maintenanceSchedule.securityScan, 'daily');
    assert.equal(config.maintenanceSchedule.backup, 'daily');
  });

  it('should validate a good config', () => {
    const config = ConfigManager.load();
    const result = ConfigManager.validate(config);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('should reject invalid monitoring interval', () => {
    const result = ConfigManager.validate({ ...ConfigManager.DEFAULTS, monitoringInterval: 100 });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('should reject invalid environment', () => {
    const result = ConfigManager.validate({ ...ConfigManager.DEFAULTS, environment: 'staging' });
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
});