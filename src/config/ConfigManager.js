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
    notification: {
      slackWebhookUrl: null,
      smtpHost: null,
      smtpPort: 587,
      smtpUser: null,
      smtpPass: null,
      emailFrom: null,
      emailTo: null,
    },
    remoteHosts: [],
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

    // Notification channels
    if (process.env.NOTIFICATION_CHANNELS) {
      config.notificationChannels = process.env.NOTIFICATION_CHANNELS.split(',').map((c) => c.trim());
    }

    config.notification.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    config.notification.smtpHost = process.env.SMTP_HOST || null;
    config.notification.smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    config.notification.smtpUser = process.env.SMTP_USER || null;
    config.notification.smtpPass = process.env.SMTP_PASS || null;
    config.notification.emailFrom = process.env.EMAIL_FROM || null;
    config.notification.emailTo = process.env.EMAIL_TO || null;

    // Remote hosts
    if (process.env.REMOTE_HOSTS) {
      config.remoteHosts = process.env.REMOTE_HOSTS.split(',').map(h => ({
        host: h.trim(),
        port: parseInt(process.env[`SSH_PORT_${h.trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')}`] || '22', 10),
        username: process.env[`SSH_USER_${h.trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '_')}`] || 'root',
        privateKeyPath: process.env.SSH_KEY_PATH || null,
      }));
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
