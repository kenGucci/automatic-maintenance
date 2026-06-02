/**
 * Tests for the Automatic Maintenance Agent
 */

const AutomaticMaintenance = require('../src/agent');

describe('AutomaticMaintenance Agent', () => {
  let agent;

  beforeEach(() => {
    agent = new AutomaticMaintenance({ monitoringInterval: 1000 });
  });

  afterEach(async () => {
    if (agent && agent.isRunning) await agent.stop();
  });

  describe('initialization', () => {
    it('should create agent with default configuration', () => {
      expect(agent).toBeDefined();
      expect(agent.isRunning).toBe(false);
    });

    it('should apply custom configuration options', () => {
      const customAgent = new AutomaticMaintenance({ cpuThreshold: 0.9 });
      expect(customAgent.config.cpuThreshold).toBe(0.9);
    });
  });

  describe('start and stop', () => {
    it('should start the agent', async () => {
      await agent.start();
      expect(agent.isRunning).toBe(true);
    });

    it('should stop the agent', async () => {
      await agent.start();
      await agent.stop();
      expect(agent.isRunning).toBe(false);
    });
  });

  describe('status', () => {
    it('should return agent status', () => {
      const status = agent.getStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('issues');
    });
  });
});
