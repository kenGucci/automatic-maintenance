/**
 * Configuration management
 */

const dotenv = require('dotenv');
dotenv.config();

const config = {
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '27017'),
    name: process.env.DB_NAME || 'maintenance_db',
    uri: process.env.DB_URI || 'mongodb://localhost:27017/maintenance_db'
  },

  monitoring: {
    interval: parseInt(process.env.MONITOR_INTERVAL || '5000'),
    cpuThreshold: parseFloat(process.env.CPU_THRESHOLD || '0.85'),
    memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD || '0.90'),
    autoRepair: process.env.AUTO_REPAIR === 'true'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/agent.log'
  },

  api: {
    port: parseInt(process.env.API_PORT || '3000'),
    host: process.env.API_HOST || 'localhost'
  }
};

module.exports = config;
