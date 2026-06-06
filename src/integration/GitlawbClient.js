/**
 * GitlawbClient - Integration with gitlawb decentralized Git network
 * Enables the maintenance agent to create issues, PRs, and sync maintenance records
 * to the gitlawb network for collaborative AI agent workflows.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

const execAsync = promisify(exec);
const logger = new Logger('GitlawbClient');

class GitlawbClient {
  constructor(config) {
    this.config = config.gitlawb || {};
    this.enabled = this.config.enabled || false;
    this.nodeUrl = this.config.nodeUrl || 'https://node.gitlawb.com';
    this.did = this.config.did || null;
    this.keyPath = this.config.keyPath || null;
    this.repoDid = this.config.repoDid || null;
    this.initialized = false;
  }

  /**
   * Initialize gitlawb client and verify connection
   */
  async initialize() {
    if (!this.enabled) {
      logger.info('Gitlawb integration is disabled');
      return false;
    }

    try {
      logger.info('Initializing gitlawb client...');

      // Check if gl CLI is installed
      await this._checkCliInstalled();

      // Set environment variables
      process.env.GITLAWB_NODE = this.nodeUrl;
      
      if (this.did) {
        process.env.GITLAWB_DID = this.did;
      }
      
      if (this.keyPath) {
        process.env.GITLAWB_KEY = this.keyPath;
      }

      // Verify connection to node
      await this._verifyConnection();

      this.initialized = true;
      logger.info('Gitlawb client initialized successfully', {
        node: this.nodeUrl,
        did: this.did,
        repo: this.repoDid,
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize gitlawb client', error);
      return false;
    }
  }

  /**
   * Create a maintenance issue on gitlawb
   */
  async createMaintenanceIssue(alert, diagnosticResults) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot create issue: gitlawb not initialized');
      return null;
    }

    try {
      const title = `[Maintenance] ${alert.message || `System Alert: ${alert.metric}`}`;
      const body = this._formatIssueBody(alert, diagnosticResults);

      logger.info('Creating maintenance issue on gitlawb...', { title });

      const command = `gl issue create "${this.repoDid}" --title "${title}" --body "${body}" --label "maintenance,automated"`;
      const { stdout } = await execAsync(command, {
        env: { ...process.env, GITLAWB_NODE: this.nodeUrl },
      });

      logger.info('Maintenance issue created successfully', { output: stdout });
      return { success: true, output: stdout };
    } catch (error) {
      logger.error('Failed to create maintenance issue', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a PR for automated maintenance fixes
   */
  async createMaintenancePR(branchName, title, description, files) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot create PR: gitlawb not initialized');
      return null;
    }

    try {
      logger.info('Creating maintenance PR on gitlawb...', { title, branch: branchName });

      // Push branch first
      await this._pushBranch(branchName, files);

      // Create PR
      const command = `gl pr create "${this.repoDid}" --head "${branchName}" --base "main" --title "${title}"`;
      const { stdout } = await execAsync(command, {
        env: { ...process.env, GITLAWB_NODE: this.nodeUrl },
      });

      logger.info('Maintenance PR created successfully', { output: stdout });
      return { success: true, output: stdout };
    } catch (error) {
      logger.error('Failed to create maintenance PR', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync maintenance report to gitlawb
   */
  async syncMaintenanceReport(report) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot sync report: gitlawb not initialized');
      return null;
    }

    try {
      const reportPath = path.join('/tmp', `maintenance-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      const commitMessage = `Maintenance report: ${report.overall_status} at ${new Date().toISOString()}`;

      logger.info('Syncing maintenance report to gitlawb...');

      const command = `cd /tmp && git add "${reportPath}" && git commit -m "${commitMessage}" && git push origin main`;
      const { stdout } = await execAsync(command, {
        env: { ...process.env, GITLAWB_NODE: this.nodeUrl },
      });

      logger.info('Maintenance report synced successfully');
      return { success: true, output: stdout };
    } catch (error) {
      logger.error('Failed to sync maintenance report', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List existing maintenance issues
   */
  async listMaintenanceIssues(limit = 10) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot list issues: gitlawb not initialized');
      return [];
    }

    try {
      const command = `gl issue list "${this.repoDid}" --label "maintenance" --limit ${limit}`;
      const { stdout } = await execAsync(command, {
        env: { ...process.env, GITLAWB_NODE: this.nodeUrl },
      });

      return { success: true, issues: stdout };
    } catch (error) {
      logger.error('Failed to list maintenance issues', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get gitlawb status
   */
  async getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      node: this.nodeUrl,
      did: this.did,
      repo: this.repoDid,
    };
  }

  // --- Private methods ---

  async _checkCliInstalled() {
    try {
      await execAsync('gl --version');
      logger.debug('gitlawb CLI is installed');
    } catch (error) {
      throw new Error(
        'gitlawb CLI (gl) is not installed. Run: curl -fsSL https://gitlawb.com/install.sh | sh'
      );
    }
  }

  async _verifyConnection() {
    try {
      const { stdout } = await execAsync('gl node status', {
        env: { ...process.env, GITLAWB_NODE: this.nodeUrl },
      });
      logger.debug('Gitlawb node connection verified', { output: stdout });
    } catch (error) {
      throw new Error(`Failed to connect to gitlawb node: ${error.message}`);
    }
  }

  async _pushBranch(branchName, files) {
    // This would integrate with git operations
    // For now, we'll log the intent
    logger.info('Pushing maintenance branch', { branch: branchName, files });
  }

  _formatIssueBody(alert, diagnosticResults) {
    const body = `
## Automated Maintenance Alert

**Type:** ${alert.type || 'warning'}
**Metric:** ${alert.metric || 'unknown'}
**Value:** ${alert.value || 'N/A'}
**Timestamp:** ${new Date().toISOString()}

### Alert Details
${alert.message || 'No additional details'}

### Diagnostic Summary
\`\`\`json
${JSON.stringify(diagnosticResults?.metrics_summary || {}, null, 2)}
\`\`\`

### Recommendations
${diagnosticResults?.recommendations?.map(r => `- [${r.priority}] ${r.message}`).join('\n') || 'No specific recommendations'}

---
*Generated by Automatic Maintenance Agent*
`;
    return body.replace(/"/g, '\\"');
  }
}

module.exports = GitlawbClient;
