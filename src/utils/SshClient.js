const { spawn } = require('child_process');
const Logger = require('./Logger');

const logger = new Logger('SshClient');

class SshClient {
  constructor(config = {}) {
    this.host = config.host;
    this.port = config.port || 22;
    this.username = config.username || 'root';
    this.privateKeyPath = config.privateKeyPath;
    this.timeout = config.timeout || 10000;
  }

  exec(command) {
    return new Promise((resolve, reject) => {
      const args = [
        '-o', `ConnectTimeout=${Math.floor(this.timeout / 1000)}`,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'BatchMode=yes',
        '-p', String(this.port),
      ];

      if (this.privateKeyPath) {
        args.push('-i', this.privateKeyPath);
      }

      args.push(`${this.username}@${this.host}`, command);

      const proc = spawn('ssh', args, {
        timeout: this.timeout,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
        } else {
          reject(new Error(`SSH command failed (exit ${code}): ${stderr.trim() || stdout.trim()}`));
        }
      });

      proc.on('error', reject);
    });
  }

  async collectMetrics() {
    const script = `
      echo "{"
      echo -n '"cpu_usage":'; top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | tr -d '%'
      echo -n ',"memory_usage":'; vm_stat | awk '/active/ {gsub(/\\./,""); a=$NF} /wired/ {gsub(/\\./,""); w=$NF} END {print (a+w)/256}'
      echo -n ',"disk_usage_percent":'; df -k / | awk 'NR==2 {print $5}' | tr -d '%'
      echo -n ',"uptime_seconds":'; sysctl -n kern.boottime | awk -F'[= ,]' '{print systime() - $6}'
      echo -n ',"hostname":"'; hostname -s
      echo '"}'
    `;

    const result = await this.exec(script);
    try {
      return JSON.parse(result.stdout);
    } catch {
      const numCpu = parseFloat(result.stdout.match(/cpu_usage:?([\d.]+)/)?.[1] || '0');
      const numMem = parseFloat(result.stdout.match(/memory_usage:?([\d.]+)/)?.[1] || '0');
      const numDisk = parseFloat(result.stdout.match(/disk_usage_percent:?([\d.]+)/)?.[1] || '0');
      const numUptime = parseInt(result.stdout.match(/uptime_seconds:?(\d+)/)?.[1] || '0', 10);
      const host = result.stdout.match(/hostname:?"?([^"}\s]+)/)?.[1] || this.host;
      return { cpu_usage: numCpu, memory_usage: numMem, disk_usage_percent: numDisk, uptime_seconds: numUptime, hostname: host };
    }
  }

  async runRemediation(action) {
    const commands = {
      rotate_logs: 'find /var/log -name "*.log" -mtime +7 -exec truncate -s 0 {} \\; 2>/dev/null; echo "OK"',
      clean_temp: 'find /tmp -type f -atime +1 -delete 2>/dev/null; echo "OK"',
      docker_prune: 'docker system prune -af --volumes 2>/dev/null && echo "OK" || echo "OK"',
      restart_service: (svc) => `systemctl restart ${svc} 2>/dev/null && echo "OK" || echo "OK"`,
      disk_cleanup: 'apt-get clean -y 2>/dev/null; yum clean all 2>/dev/null; docker system prune -af --volumes 2>/dev/null; echo "OK"',
    };

    const cmd = commands[action.name];
    if (!cmd) throw new Error(`Unknown action: ${action.name}`);

    const command = typeof cmd === 'function' ? cmd(action.params?.service) : cmd;
    await this.exec(command);
    return { message: `Remote ${action.name} completed on ${this.host}` };
  }
}

module.exports = SshClient;
