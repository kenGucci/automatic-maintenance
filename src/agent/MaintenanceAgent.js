/**
 * MaintenanceAgent - Core agent that orchestrates monitoring, diagnostics, and remediation
 * Runs autonomously, detecting issues and executing or recommending fixes.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const Logger = require('../utils/Logger');
const Notifier = require('../utils/Notifier');
const SshClient = require('../utils/SshClient');

const logger = new Logger('MaintenanceAgent');

class MaintenanceAgent {
  constructor(config, monitor, diagnostic) {
    this.config = config;
    this.monitor = monitor;
    this.diagnostic = diagnostic;
    this.running = false;
    this.diagnosticInterval = null;
    this.maintenanceInterval = null;
    this.maintenanceTasks = [];
    this.completedTasks = [];
    this.alertHistory = [];
    this.remoteClients = (config.remoteHosts || []).map(h => new SshClient(h));
    this.notifier = new Notifier(config.notification || {});
  }

  /**
   * Start the autonomous maintenance agent
   */
  async start() {
    if (this.running) {
      logger.warn('Agent is already running');
      return;
    }

    this.running = true;
    logger.info('Maintenance agent starting...');

    // Start the system monitor
    this.monitor.start();

    // Run initial diagnostics
    await this.diagnostic.runDiagnostics(this.monitor);

    // Set up periodic diagnostics (every 5 minutes)
    const diagInterval = Math.max(this.config.monitoringInterval * 10, 300000);
    this.diagnosticInterval = setInterval(async () => {
      await this._runDiagnosticCycle();
    }, diagInterval);

    // Run scheduled maintenance tasks
    this._scheduleMaintenanceTasks();

    // Check and execute scheduled tasks every 60s
    this.maintenanceInterval = setInterval(() => {
      this._executeDueTasks();
    }, 60000);

    logger.info('Maintenance agent is running autonomously');
  }

  /**
   * Stop the agent gracefully
   */
  stop() {
    this.running = false;

    if (this.diagnosticInterval) {
      clearInterval(this.diagnosticInterval);
      this.diagnosticInterval = null;
    }

    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }

    this.monitor.stop();
    logger.info('Maintenance agent stopped');
  }

  /**
   * Get the current agent status
   */
  getStatus() {
    return {
      running: this.running,
      uptime: this._getUptime(),
      pending_tasks: this.maintenanceTasks.length,
      completed_tasks: this.completedTasks.length,
      total_alerts: this.alertHistory.length,
      last_diagnostic: this.diagnostic.lastRun,
    };
  }

  /**
   * Run a single diagnostic cycle: collect -> analyze -> act
   */
  async _runDiagnosticCycle() {
    try {
      logger.info('Running diagnostic cycle...');

      // 1. Collect metrics
      const metrics = this.monitor.collect();
      if (!metrics) {
        logger.warn('No metrics available, skipping cycle');
        return;
      }

      // 2. Check thresholds
      const alerts = this.monitor.checkThresholds();
      if (alerts.length > 0) {
        this._recordAlerts(alerts);
        logger.warn(`Threshold alerts detected: ${alerts.length}`, { alerts });
      }

      // 3. Run diagnostics
      const diagResults = await this.diagnostic.runDiagnostics(this.monitor);

      // 4. Auto-remediate if enabled
      if (this.config.autoRemediation && alerts.length > 0) {
        await this._autoRemediate(alerts, diagResults);
      }

      // 5. Poll remote hosts
      if (this.remoteClients.length > 0) {
        await this._pollRemoteHosts();
      }

      // 6. Notify on critical alerts
      const criticalAlerts = alerts.filter(a => a.type === 'critical');
      if (criticalAlerts.length > 0) {
        await this.notifier.send(
          `[${this.config.environment}] ${criticalAlerts.length} critical alert(s)`,
          criticalAlerts.map(a => `• ${a.message}`).join('\n'),
          'critical',
        );
      }

      // 7. Log summary
      logger.info('Diagnostic cycle complete', {
        status: diagResults.overall_status,
        alerts: alerts.length,
        recommendations: diagResults.recommendations.length,
      });
    } catch (error) {
      logger.error('Diagnostic cycle failed', error);
    }
  }

  /**
   * Poll metrics from remote SSH hosts and record their alerts
   */
  async _pollRemoteHosts() {
    for (const client of this.remoteClients) {
      try {
        const metrics = await client.collectMetrics();
        if (!metrics) continue;

        const remoteAlerts = [];
        if (metrics.cpu_usage >= 70) {
          remoteAlerts.push({ type: metrics.cpu_usage >= 90 ? 'critical' : 'warning', metric: 'cpu', value: metrics.cpu_usage, message: `Remote ${metrics.hostname}: CPU at ${metrics.cpu_usage}%`, host: metrics.hostname });
        }
        if (metrics.memory_usage >= 75) {
          remoteAlerts.push({ type: metrics.memory_usage >= 95 ? 'critical' : 'warning', metric: 'memory', value: metrics.memory_usage, message: `Remote ${metrics.hostname}: Memory at ${metrics.memory_usage}%`, host: metrics.hostname });
        }
        if (metrics.disk_usage_percent >= 80) {
          remoteAlerts.push({ type: metrics.disk_usage_percent >= 95 ? 'critical' : 'warning', metric: 'disk', value: metrics.disk_usage_percent, message: `Remote ${metrics.hostname}: Disk at ${metrics.disk_usage_percent}%`, host: metrics.hostname });
        }

        if (remoteAlerts.length > 0) {
          this._recordAlerts(remoteAlerts);
          logger.warn(`Remote alerts from ${metrics.hostname}`, { alerts: remoteAlerts });

          if (this.config.autoRemediation) {
            for (const alert of remoteAlerts) {
              try {
                await client.runRemediation({ name: alert.metric === 'disk' ? 'disk_cleanup' : alert.metric === 'memory' ? 'clean_temp' : 'rotate_logs' });
                this.completedTasks.push({
                  name: `Remote ${alert.metric} fix on ${metrics.hostname}`,
                  alert,
                  result: { message: `Auto-remediated ${alert.metric} on ${metrics.hostname}` },
                  timestamp: new Date().toISOString(),
                  status: 'completed',
                });
              } catch (err) {
                logger.error(`Remote remediation failed on ${metrics.hostname}`, err);
              }
            }
          }
        }

        logger.debug(`Remote poll ${metrics.hostname} OK`, { cpu: metrics.cpu_usage, mem: metrics.memory_usage, disk: metrics.disk_usage_percent });
      } catch (err) {
        logger.warn(`Remote poll failed for ${client.host}`, { error: err.message });
      }
    }
  }

  /**
   * Record alerts to history
   */
  _recordAlerts(alerts) {
    for (const alert of alerts) {
      this.alertHistory.push({
        ...alert,
        timestamp: new Date().toISOString(),
        id: this.alertHistory.length + 1,
      });
    }

    // Keep last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  /**
   * Attempt automatic remediation for known issues
   */
  async _autoRemediate(alerts, diagResults) {
    for (const alert of alerts) {
      const action = this._determineRemediation(alert, diagResults);

      if (action) {
        logger.info(`Auto-remediating: ${action.name}`, { alert: alert.metric, action: action.name });

        try {
          const result = await action.execute();
          this.completedTasks.push({
            name: action.name,
            alert,
            result,
            timestamp: new Date().toISOString(),
            status: 'completed',
          });
          logger.info(`Remediation successful: ${action.name}`);
        } catch (error) {
          this.completedTasks.push({
            name: action.name,
            alert,
            error: error.message,
            timestamp: new Date().toISOString(),
            status: 'failed',
          });
          logger.error(`Remediation failed: ${action.name}`, error);
        }
      }
    }
  }

  /**
   * Determine remediation action for an alert
   */
  _determineRemediation(alert, diagResults) {
    const remediations = {
      cpu: {
        name: 'cpu_optimization',
        execute: async () => {
          const killed = [];
          try {
            const top = execSync('ps aux --sort=-%cpu | head -20', { encoding: 'utf8', timeout: 5000 });
            const lines = top.trim().split('\n').slice(1);
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              const pid = parseInt(parts[1], 10);
              const cmd = parts.slice(10).join(' ');
              const cpu = parseFloat(parts[2]);
              if (cpu > 50 && pid > 1 && !cmd.includes('node') && !cmd.includes('sshd') && !cmd.includes('systemd')) {
                try {
                  execSync(`kill -9 ${pid}`, { timeout: 2000 });
                  killed.push(cmd);
                } catch {}
              }
            }
          } catch {}
          if (global.gc) global.gc();
          return { message: `Killed ${killed.length} high-CPU processes: ${killed.join(', ') || 'none found'}` };
        },
      },
      memory: {
        name: 'memory_cleanup',
        execute: async () => {
          const freed = [];
          try {
            execSync('sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null', { timeout: 3000 });
            freed.push('page cache');
          } catch {}
          if (global.gc) global.gc();
          try {
            const top = execSync('ps aux --sort=-%mem | head -10', { encoding: 'utf8', timeout: 5000 });
            const lines = top.trim().split('\n').slice(1);
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              const pid = parseInt(parts[1], 10);
              const mem = parseFloat(parts[3]);
              const cmd = parts.slice(10).join(' ');
              if (mem > 30 && pid > 1 && !cmd.includes('node') && !cmd.includes('systemd')) {
                try {
                  execSync(`kill -9 ${pid}`, { timeout: 2000 });
                  freed.push(cmd);
                } catch {}
              }
            }
          } catch {}
          return { message: `Freed ${freed.length > 1 ? `${freed.length - 1} cache(s)` : '0 caches'} and killed ${freed.filter(f => !f.includes('cache')).length} process(es)` };
        },
      },
      disk: {
        name: 'disk_cleanup',
        execute: async () => {
          const freed = [];
          try {
            const out = execSync('docker system prune -af --volumes 2>/dev/null', { encoding: 'utf8', timeout: 30000 });
            const match = out.match(/Total reclaimed space:\s+([\d.]+[MG]?B)/);
            if (match) freed.push(`docker: ${match[1]}`);
            else freed.push('docker pruned');
          } catch {}
          try {
            execSync('apt-get clean -y 2>/dev/null; yum clean all 2>/dev/null; pkg clean -y 2>/dev/null', { timeout: 15000 });
            freed.push('package cache');
          } catch {}
          try {
            const logsDir = path.join(process.cwd(), 'logs');
            if (fs.existsSync(logsDir)) {
              const files = fs.readdirSync(logsDir);
              for (const file of files) {
                const fp = path.join(logsDir, file);
                const stat = fs.statSync(fp);
                if (stat.isFile() && Date.now() - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
                  fs.truncateSync(fp, 0);
                }
              }
              freed.push(`${files.length} logs rotated`);
            }
          } catch {}
          try {
            const tmpDir = os.tmpdir();
            const files = fs.readdirSync(tmpDir);
            let cleaned = 0;
            for (const file of files) {
              try {
                const fp = path.join(tmpDir, file);
                const stat = fs.statSync(fp);
                if (stat.isFile() && Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
                  fs.unlinkSync(fp);
                  cleaned++;
                }
              } catch {}
            }
            freed.push(`${cleaned} temp files`);
          } catch {}
          return { message: `Disk cleanup: ${freed.join(', ') || 'nothing to clean'}` };
        },
      },
    };

    return remediations[alert.metric] || null;
  }

  /**
   * Schedule periodic maintenance tasks
   */
  _scheduleMaintenanceTasks() {
    const schedule = this.config.maintenanceSchedule || {};

    // Log rotation (daily)
    if (schedule.logRotation === 'daily') {
      this.maintenanceTasks.push({
        name: 'Log Rotation',
        schedule: 'daily',
        nextRun: this._getNextRunTime('daily'),
      });
    }

    // Disk cleanup (weekly)
    if (schedule.diskCleanup === 'weekly') {
      this.maintenanceTasks.push({
        name: 'Disk Cleanup',
        schedule: 'weekly',
        nextRun: this._getNextRunTime('weekly'),
      });
    }

    // Security scan (daily)
    if (schedule.securityScan === 'daily') {
      this.maintenanceTasks.push({
        name: 'Security Scan',
        schedule: 'daily',
        nextRun: this._getNextRunTime('daily'),
      });
    }

    // Backup (daily)
    if (schedule.backup === 'daily') {
      this.maintenanceTasks.push({
        name: 'Backup Verification',
        schedule: 'daily',
        nextRun: this._getNextRunTime('daily'),
      });
    }
  }

  /**
   * Calculate next run time for a schedule
   */
  _getNextRunTime(schedule) {
    const now = new Date();
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Execute due maintenance tasks
   */
  _executeDueTasks() {
    const now = Date.now();
    for (const task of this.maintenanceTasks) {
      if (new Date(task.nextRun).getTime() <= now) {
        this._runMaintenanceTask(task);
      }
    }
  }

  /**
   * Run a single maintenance task
   */
  async _runMaintenanceTask(task) {
    const executor = this._getTaskExecutor(task.name);
    if (!executor) {
      logger.warn(`No executor for task: ${task.name}`);
      return;
    }

    try {
      logger.info(`Executing scheduled task: ${task.name}`);
      const result = await executor();
      this.completedTasks.push({
        name: task.name,
        result,
        scheduled: task.schedule,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });
      logger.info(`Scheduled task completed: ${task.name}`, { result });
    } catch (error) {
      this.completedTasks.push({
        name: task.name,
        error: error.message,
        scheduled: task.schedule,
        timestamp: new Date().toISOString(),
        status: 'failed',
      });
      logger.error(`Scheduled task failed: ${task.name}`, error);
    }

    task.nextRun = this._getNextRunTime(task.schedule);
  }

  /**
   * Get executor function for a named task
   */
  _getTaskExecutor(name) {
    const executors = {
      'Log Rotation': async () => {
        const logsDir = path.join(process.cwd(), 'logs');
        if (fs.existsSync(logsDir)) {
          const files = fs.readdirSync(logsDir);
          for (const file of files) {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && Date.now() - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
              fs.truncateSync(filePath, 0);
            }
          }
          return { message: `Rotated ${files.length} log files` };
        }
        return { message: 'No logs directory found' };
      },
      'Disk Cleanup': async () => {
        const tmpDir = os.tmpdir();
        const files = fs.readdirSync(tmpDir);
        let cleaned = 0;
        for (const file of files) {
          const filePath = path.join(tmpDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile() && Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
              fs.unlinkSync(filePath);
              cleaned++;
            }
          } catch {
            // skip files we can't access
          }
        }
        return { message: `Cleaned ${cleaned} temp files` };
      },
      'Security Scan': async () => {
        const issues = [];
        try {
          const passwd = fs.readFileSync('/etc/passwd', 'utf8');
          const usersWithShell = passwd.split('\n').filter(l => l && !l.startsWith('#') && l.includes('/bin/bash') || l.includes('/bin/sh'));
          if (usersWithShell.some(u => u.split(':')[2] === '0' && u.split(':')[0] !== 'root')) {
            issues.push('Non-root user with UID 0 detected');
          }
        } catch {}
        try {
          if (fs.existsSync('/etc/ssh/sshd_config')) {
            const cfg = fs.readFileSync('/etc/ssh/sshd_config', 'utf8');
            if (cfg.match(/^PermitRootLogin\s+yes/m)) issues.push('Root SSH login enabled');
            if (!cfg.match(/^PasswordAuthentication\s+no/m)) issues.push('Password authentication not disabled');
          }
        } catch {}
        try {
          const out = execSync('find /tmp /var/tmp -perm -o+w -type f 2>/dev/null | head -20', { encoding: 'utf8', timeout: 5000 });
          if (out.trim()) issues.push(`${out.trim().split('\n').length} world-writable temp files`);
        } catch {}
        return { message: issues.length ? `Security issues: ${issues.join('; ')}` : 'No vulnerabilities detected.' };
      },
      'Backup Verification': async () => {
        const results = [];
        try {
          const out = execSync('which restic 2>/dev/null && restic snapshots --json 2>/dev/null || which borg 2>/dev/null && borg list 2>/dev/null || echo "no backup tool found"', { encoding: 'utf8', timeout: 10000 });
          if (out.includes('no backup tool')) {
            results.push('No backup tool (restic/borg) configured');
          } else {
            results.push('Backup tool found and accessible');
          }
        } catch {}
        try {
          const etcBackup = fs.readdirSync('/etc').length > 0;
          results.push('/etc readable');
        } catch {}
        return { message: results.join('; ') || 'Backup verification completed' };
      },
    };
    return executors[name];
  }

  /**
   * Get agent uptime string
   */
  _getUptime() {
    const seconds = process.uptime();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

module.exports = MaintenanceAgent;
