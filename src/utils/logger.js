/**
 * Logger utility
 */

const chalk = require('chalk');

class Logger {
  constructor(namespace = '') {
    this.namespace = namespace;
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  _format(level, message, data) {
    const timestamp = new Date().toISOString();
    const ns = this.namespace ? `[${this.namespace}]` : '';
    const levelStr = level.toUpperCase();
    let output = `${timestamp} ${levelStr} ${ns} ${message}`;
    if (data) output += ` ${JSON.stringify(data)}`;
    return output;
  }

  debug(message, data) {
    if (this.levels[this.logLevel] <= this.levels.debug)
      console.log(chalk.gray(this._format('debug', message, data)));
  }

  info(message, data) {
    if (this.levels[this.logLevel] <= this.levels.info)
      console.log(chalk.cyan(this._format('info', message, data)));
  }

  warn(message, data) {
    if (this.levels[this.logLevel] <= this.levels.warn)
      console.log(chalk.yellow(this._format('warn', message, data)));
  }

  error(message, data) {
    if (this.levels[this.logLevel] <= this.levels.error)
      console.error(chalk.red(this._format('error', message, data)));
  }
}

module.exports = Logger;
