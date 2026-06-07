/**
 * ConfigManager - Loads and manages configuration for Automatic Maintenance
 * Reads from environment variables and .env files with sensible defaults.
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  static DEFAULTS = {
    environment: 'development',
    monitoringInterval: 30000,
    alertThresholds: {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 75, critical: 95 },
      disk: { warning: 80, critical: 95 },
    },
    autoRemediation: true,
    logLevel: 'info',
    dashboardPort: 8080,
    notificationChannels: ['email'],
    maintenanceSchedule: {
      logRotation: 'daily',
      diskCleanup: 'weekly',
      securityScan: 'daily',
      backup: 'daily',
    },
    gitlawb: {
      enabled: false,
      nodeUrl: 'https://node.gitlawb.com',
      did: null,
      keyPath: null,
      repoDid: null,
    },
  };

  static load() {
    const config = { ...ConfigManager.DEFAULTS };

    // Load .env file if it exists
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    }

    // Override with environment variables
    if (process.env.NODE_ENV) config.environment = process.env.NODE_ENV;
    if (process.env.MONITORING_INTERVAL) config.monitoringInterval = parseInt(process.env.MONITORING_INTERVAL, 10);
    if (process.env.LOG_LEVEL) config.logLevel = process.env.LOG_LEVEL;
    if (process.env.DASHBOARD_PORT) config.dashboardPort = parseInt(process.env.DASHBOARD_PORT, 10);
    if (process.env.AUTO_REMEDIATION) config.autoRemediation = process.env.AUTO_REMEDIATION === 'true';
    if (process.env.CLOUDFLARE_API_TOKEN) config.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

    // Gitlawb integration
    if (process.env.GITLAWB_ENABLED) config.gitlawb.enabled = process.env.GITLAWB_ENABLED === 'true';
    if (process.env.GITLAWB_NODE_URL) config.gitlawb.nodeUrl = process.env.GITLAWB_NODE_URL;
    if (process.env.GITLAWB_DID) config.gitlawb.did = process.env.GITLAWB_DID;
    if (process.env.GITLAWB_KEY_PATH) config.gitlawb.keyPath = process.env.GITLAWB_KEY_PATH;
    if (process.env.GITLAWB_REPO_DID) config.gitlawb.repoDid = process.env.GITLAWB_REPO_DID;

    // Notification channels
    if (process.env.NOTIFICATION_CHANNELS) {
      config.notificationChannels = process.env.NOTIFICATION_CHANNELS.split(',').map((c) => c.trim());
    }

    return config;
  }

  static validate(config) {
    const errors = [];

    if (config.monitoringInterval < 1000) {
      errors.push('monitoringInterval must be at least 1000ms');
    }

    if (!['development', 'production', 'test'].includes(config.environment)) {
      errors.push('environment must be development, production, or test');
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = ConfigManager;
