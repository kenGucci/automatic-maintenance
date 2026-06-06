/**
 * Logger - Structured logging utility for Automatic Maintenance
 * Supports multiple log levels and JSON-formatted output.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  constructor(context = 'App', level = 'info') {
    this.context = context;
    this.level = level;
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  _format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    let entry = {
      timestamp,
      level,
      context: this.context,
      message,
    };
    if (meta instanceof Error) {
      entry.error = meta.message;
      entry.stack = meta.stack;
    } else {
      entry = { ...entry, ...meta };
    }
    return JSON.stringify(entry);
  }

  debug(message, meta) {
    if (this._shouldLog('debug')) {
      console.debug(this._format('debug', message, meta));
    }
  }

  info(message, meta) {
    if (this._shouldLog('info')) {
      console.info(this._format('info', message, meta));
    }
  }

  warn(message, meta) {
    if (this._shouldLog('warn')) {
      console.warn(this._format('warn', message, meta));
    }
  }

  error(message, meta) {
    if (this._shouldLog('error')) {
      if (meta instanceof Error) {
        console.error(this._format('error', message, { error: meta.message, stack: meta.stack }));
      } else {
        console.error(this._format('error', message, meta));
      }
    }
  }

  child(context) {
    return new Logger(`${this.context}:${context}`, this.level);
  }
}

module.exports = Logger;
