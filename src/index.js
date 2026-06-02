/**
 * Automatic Maintenance Agent
 * Main entry point for the autonomous maintenance system
 */

const dotenv = require('dotenv');
const chalk = require('chalk');
const AutomaticMaintenance = require('./agent');
const Logger = require('./utils/logger');

dotenv.config();

const logger = new Logger('index.js');

async function main() {
  try {
    logger.info(chalk.blue('🚀 Starting Automatic Maintenance Agent...'));

    const agent = new AutomaticMaintenance({
      monitoringInterval: parseInt(process.env.MONITOR_INTERVAL || '5000'),
      cpuThreshold: parseFloat(process.env.CPU_THRESHOLD || '0.85'),
      memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD || '0.90'),
      autoRepair: process.env.AUTO_REPAIR === 'true'
    });

    await agent.start();
    logger.info(chalk.green('✓ Agent started successfully'));

    process.on('SIGINT', async () => {
      logger.info(chalk.yellow('\n⏸️  Shutting down...'));
      await agent.stop();
      logger.info(chalk.green('✓ Agent stopped'));
      process.exit(0);
    });
  } catch (error) {
    logger.error(chalk.red('✗ Failed to start agent:'), error);
    process.exit(1);
  }
}

main();
