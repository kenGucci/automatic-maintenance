#!/usr/bin/env node

/**
 * Automatic Maintenance - Autonomous System Maintenance Agent
 * Monitors, diagnoses, and optimizes systems without constant human intervention
 */

const MaintenanceAgent = require('./src/agent/MaintenanceAgent');
const SystemMonitor = require('./src/monitor/SystemMonitor');
const DiagnosticEngine = require('./src/diagnostic/DiagnosticEngine');
const ConfigManager = require('./src/config/ConfigManager');
const Logger = require('./src/utils/Logger');

// Sentry — error tracking (optional, requires SENTRY_DSN env)
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0.2 });
    const logger = new Logger('Sentry');
    logger.info('Sentry error tracking initialized');
  } catch (e) {
    // @sentry/node not installed, skip
  }
}

const logger = new Logger('AutomaticMaintenance');

let agent = null;

/**
 * Initialize and start the autonomous maintenance agent
 */
async function bootstrap() {
  try {
    logger.info('🚀 Starting Automatic Maintenance Agent...');
    
    // Load configuration
    const config = ConfigManager.load();
    logger.info('✅ Configuration loaded', { environment: config.environment });

    // Initialize system components
    const monitor = new SystemMonitor(config);
    const diagnostic = new DiagnosticEngine(config);
    agent = new MaintenanceAgent(config, monitor, diagnostic);

    // Start monitoring
    logger.info('📊 Starting system monitoring...');
    await agent.start();

    logger.info('✨ Automatic Maintenance Agent is running');
    logger.info(`🔄 Monitoring interval: ${config.monitoringInterval}ms`);
    
  } catch (error) {
    logger.error('❌ Failed to start Automatic Maintenance Agent', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('⏹️  Shutting down Automatic Maintenance Agent...');
  if (agent) agent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('⏹️  Shutting down Automatic Maintenance Agent...');
  if (agent) agent.stop();
  process.exit(0);
});

// Start the application
bootstrap().catch((error) => {
  logger.error('🔥 Fatal error', error);
  process.exit(1);
});

module.exports = { MaintenanceAgent, SystemMonitor, DiagnosticEngine };
