const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Logger = require('../utils/Logger');

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

  async initialize() {
    if (!this.enabled) {
      logger.info('Gitlawb integration is disabled');
      return false;
    }

    try {
      logger.info('Initializing gitlawb client...');
      await this._checkCliInstalled();

      process.env.GITLAWB_NODE = this.nodeUrl;

      if (this.did) {
        process.env.GITLAWB_DID = this.did;
      }

      if (this.keyPath) {
        process.env.GITLAWB_KEY = this.keyPath;
      }

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

  async _runGlCommand(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('gl', args, {
        env: { ...process.env, GITLAWB_NODE: this.nodeUrl },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr.trim() || `gl exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  async createMaintenanceIssue(alert, diagnosticResults) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot create issue: gitlawb not initialized');
      return null;
    }

    try {
      const title = `[Maintenance] ${alert.message || `System Alert: ${alert.metric}`}`;
      const body = this._formatIssueBody(alert, diagnosticResults);

      logger.info('Creating maintenance issue on gitlawb...', { title });

      const output = await this._runGlCommand([
        'issue', 'create', this.repoDid,
        '--title', title,
        '--body', body,
        '--label', 'maintenance,automated',
      ]);

      logger.info('Maintenance issue created successfully', { output });
      return { success: true, output };
    } catch (error) {
      logger.error('Failed to create maintenance issue', error);
      return { success: false, error: error.message };
    }
  }

  async createMaintenancePR(branchName, title, description, files) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot create PR: gitlawb not initialized');
      return null;
    }

    try {
      logger.info('Creating maintenance PR on gitlawb...', { title, branch: branchName });

      await this._pushBranch(branchName, files);

      const output = await this._runGlCommand([
        'pr', 'create', this.repoDid,
        '--head', branchName,
        '--base', 'main',
        '--title', title,
      ]);

      logger.info('Maintenance PR created successfully', { output });
      return { success: true, output };
    } catch (error) {
      logger.error('Failed to create maintenance PR', error);
      return { success: false, error: error.message };
    }
  }

  async syncMaintenanceReport(report) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot sync report: gitlawb not initialized');
      return null;
    }

    try {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maint-report-'));
      const reportPath = path.join(tmpDir, `maintenance-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      const commitMessage = `Maintenance report: ${report.overall_status} at ${new Date().toISOString()}`;

      logger.info('Syncing maintenance report to gitlawb...');

      await this._execGitCommand(tmpDir, ['init']);
      await this._execGitCommand(tmpDir, ['config', 'user.email', 'maintenance@automatic-agent']);
      await this._execGitCommand(tmpDir, ['config', 'user.name', 'Automatic Maintenance']);
      await this._execGitCommand(tmpDir, ['add', reportPath]);
      await this._execGitCommand(tmpDir, ['commit', '-m', commitMessage]);

      const output = await this._runGlCommand([
        'repo', 'push', this.repoDid,
        '--source', tmpDir,
        '--branch', 'main',
      ]);

      logger.info('Maintenance report synced successfully');
      return { success: true, output };
    } catch (error) {
      logger.error('Failed to sync maintenance report', error);
      return { success: false, error: error.message };
    }
  }

  async listMaintenanceIssues(limit = 10) {
    if (!this.initialized || !this.repoDid) {
      logger.warn('Cannot list issues: gitlawb not initialized');
      return [];
    }

    try {
      const output = await this._runGlCommand([
        'issue', 'list', this.repoDid,
        '--label', 'maintenance',
        '--limit', String(limit),
      ]);

      return { success: true, issues: output };
    } catch (error) {
      logger.error('Failed to list maintenance issues', error);
      return { success: false, error: error.message };
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      node: this.nodeUrl,
      did: this.did,
      repo: this.repoDid,
    };
  }

  async _execGitCommand(cwd, args) {
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr.trim()));
        }
      });

      child.on('error', reject);
    });
  }

  async _checkCliInstalled() {
    try {
      await this._runGlCommand(['--version']);
      logger.debug('gitlawb CLI is installed');
    } catch (error) {
      throw new Error(
        'gitlawb CLI (gl) is not installed. Run: curl -fsSL https://gitlawb.com/install.sh | sh'
      );
    }
  }

  async _verifyConnection() {
    try {
      const output = await this._runGlCommand(['node', 'status']);
      logger.debug('Gitlawb node connection verified', { output });
    } catch (error) {
      throw new Error(`Failed to connect to gitlawb node: ${error.message}`);
    }
  }

  async _pushBranch(branchName, files) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maint-branch-'));
    const filePath = path.join(tmpDir, 'maintenance-change.md');

    const content = `# Automated Maintenance Change\n\nBranch: ${branchName}\nDate: ${new Date().toISOString()}\n\nChanges applied:\n${files.map(f => `- ${f}`).join('\n') || '- No specific files'}`;

    fs.writeFileSync(filePath, content);

    await this._execGitCommand(tmpDir, ['init']);
    await this._execGitCommand(tmpDir, ['config', 'user.email', 'maintenance@automatic-agent']);
    await this._execGitCommand(tmpDir, ['config', 'user.name', 'Automatic Maintenance']);
    await this._execGitCommand(tmpDir, ['add', filePath]);
    await this._execGitCommand(tmpDir, ['commit', '-m', `Maintenance: ${branchName}`]);
    await this._execGitCommand(tmpDir, ['branch', '-M', branchName]);

    await this._runGlCommand([
      'repo', 'push', this.repoDid,
      '--source', tmpDir,
      '--branch', branchName,
    ]);

    logger.info('Maintenance branch pushed', { branch: branchName });
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
    return body;
  }
}

module.exports = GitlawbClient;
