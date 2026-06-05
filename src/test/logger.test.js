const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Logger = require('../utils/Logger');

describe('Logger', () => {
  it('should create a logger with a context', () => {
    const logger = new Logger('TestContext');
    assert.equal(logger.context, 'TestContext');
  });

  it('should create a child logger with extended context', () => {
    const logger = new Logger('App');
    const child = logger.child('Module');
    assert.equal(child.context, 'App:Module');
  });

  it('should default to info level', () => {
    const logger = new Logger('Test');
    assert.equal(logger.level, 'info');
  });

  it('should format log entries as JSON', () => {
    const logger = new Logger('Test');
    const formatted = logger._format('info', 'test message', { key: 'value' });
    const parsed = JSON.parse(formatted);
    assert.equal(parsed.context, 'Test');
    assert.equal(parsed.message, 'test message');
    assert.equal(parsed.level, 'info');
    assert.equal(parsed.key, 'value');
  });

  it('should handle error objects in meta', () => {
    const logger = new Logger('Test');
    const err = new Error('test error');
    const formatted = logger._format('error', 'something failed', err);
    const parsed = JSON.parse(formatted);
    assert.equal(parsed.error, 'test error');
    assert.ok(parsed.stack);
  });
});