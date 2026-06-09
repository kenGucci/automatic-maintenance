import os, sys, json, time, socket, tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from urllib.parse import urlparse

try:
    import psutil
except ImportError:
    psutil = None

HOST = os.environ.get('AGENT_HOST', '0.0.0.0')
PORT = int(os.environ.get('AGENT_PORT', '9090'))
INTERVAL = int(os.environ.get('MONITORING_INTERVAL', '30'))

class Logger:
    def __init__(self, ctx='Agent'):
        self.ctx = ctx
    def log(self, level, msg, **kw):
        ts = datetime.utcnow().isoformat()
        entry = {'timestamp': ts, 'level': level, 'context': self.ctx, 'message': msg, **kw}
        print(json.dumps(entry), file=sys.stderr)
    def info(self, msg, **kw): self.log('info', msg, **kw)
    def warn(self, msg, **kw): self.log('warn', msg, **kw)
    def error(self, msg, **kw): self.log('error', msg, **kw)

logger = Logger()

class MetricsCollector:
    def __init__(self):
        self._history = []
        self.max_history = 1440
        self.metrics = None

    def start(self):
        self.collect()
        logger.info(f'Metrics collector started (interval={INTERVAL}s)')

    def collect(self):
        if psutil is None:
            logger.error('psutil not installed, cannot collect metrics')
            return None
        try:
            cpu_percent = psutil.cpu_percent(interval=0.5)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net = psutil.net_io_counters()
            load = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else (0, 0, 0)
            boot = datetime.fromtimestamp(psutil.boot_time())
            procs = len(psutil.pids())

            m = {
                'timestamp': datetime.utcnow().isoformat(),
                'cpu_usage': round(cpu_percent, 1),
                'memory_usage': round(mem.percent, 1),
                'memory_total_mb': round(mem.total / 1024 / 1024),
                'memory_used_mb': round(mem.used / 1024 / 1024),
                'disk_usage': {
                    'total_gb': round(disk.total / 1024**3, 1),
                    'used_gb': round(disk.used / 1024**3, 1),
                    'free_gb': round(disk.free / 1024**3, 1),
                    'percent': round(disk.percent, 1),
                },
                'load_average': {'1min': round(load[0], 2), '5min': round(load[1], 2), '15min': round(load[2], 2)},
                'network_in_mbps': round(net.bytes_recv / 1024 / 1024, 2),
                'network_out_mbps': round(net.bytes_sent / 1024 / 1024, 2),
                'active_processes': procs,
                'uptime_seconds': int(time.time() - boot.timestamp()),
                'hostname': socket.gethostname(),
            }
            self.metrics = m
            self._history.append({'timestamp': m['timestamp'], 'cpu_usage': m['cpu_usage'], 'memory_usage': m['memory_usage'], 'disk_usage': m['disk_usage']['percent']})
            if len(self._history) > self.max_history:
                self._history = self._history[-self.max_history:]
            return m
        except Exception as e:
            logger.error('Collect failed', error=str(e))
            return None

    def get_current(self):
        return self.metrics

    def get_history(self, limit=100):
        return self._history[-limit:]

    def check_thresholds(self):
        if not self.metrics:
            return []
        alerts = []
        cpu = self.metrics['cpu_usage']
        mem = self.metrics['memory_usage']
        disk = self.metrics['disk_usage']['percent']

        if cpu >= 90:
            alerts.append({'type': 'critical', 'metric': 'cpu', 'value': cpu, 'message': f'CPU usage at {cpu}% (critical)'})
        elif cpu >= 70:
            alerts.append({'type': 'warning', 'metric': 'cpu', 'value': cpu, 'message': f'CPU usage at {cpu}% (warning)'})

        if mem >= 95:
            alerts.append({'type': 'critical', 'metric': 'memory', 'value': mem, 'message': f'Memory usage at {mem}% (critical)'})
        elif mem >= 75:
            alerts.append({'type': 'warning', 'metric': 'memory', 'value': mem, 'message': f'Memory usage at {mem}% (warning)'})

        if disk >= 95:
            alerts.append({'type': 'critical', 'metric': 'disk', 'value': disk, 'message': f'Disk usage at {disk}% (critical)'})
        elif disk >= 80:
            alerts.append({'type': 'warning', 'metric': 'disk', 'value': disk, 'message': f'Disk usage at {disk}% (warning)'})

        return alerts

class Remediation:
    def __init__(self):
        self.actions = []

    def rotate_logs(self, logs_dir=None):
        logs_dir = logs_dir or os.path.join(os.getcwd(), 'logs')
        rotated = 0
        if os.path.isdir(logs_dir):
            for f in os.listdir(logs_dir):
                fp = os.path.join(logs_dir, f)
                if os.path.isfile(fp) and time.time() - os.path.getmtime(fp) > 86400 * 7:
                    try:
                        with open(fp, 'w') as fh:
                            fh.truncate(0)
                        rotated += 1
                    except:
                        pass
        msg = f'Rotated {rotated} log files'
        self.actions.append({'name': 'Log Rotation', 'result': msg, 'timestamp': datetime.utcnow().isoformat(), 'status': 'completed'})
        return msg

    def clean_temp(self):
        cleaned = 0
        tmp = tempfile.gettempdir()
        if os.path.isdir(tmp):
            for f in os.listdir(tmp):
                fp = os.path.join(tmp, f)
                try:
                    if os.path.isfile(fp) and time.time() - os.path.getmtime(fp) > 86400:
                        os.unlink(fp)
                        cleaned += 1
                except:
                    pass
        msg = f'Cleaned {cleaned} temp files'
        self.actions.append({'name': 'Disk Cleanup', 'result': msg, 'timestamp': datetime.utcnow().isoformat(), 'status': 'completed'})
        return msg

    def get_history(self):
        return self.actions[-100:]

class DiagnosticEngine:
    def __init__(self):
        self.last_run = None
        self.results = None

    def run(self, collector):
        metrics = collector.get_current()
        alerts = collector.check_thresholds()
        services = self._check_services()
        recs = self._recommendations(metrics, alerts)

        results = {
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'operational',
            'services': services,
            'recommendations': recs,
        }
        self.last_run = results['timestamp']
        self.results = results
        return results

    def _check_services(self):
        checks = [(8080, 'API Gateway'), (5432, 'Database'), (6379, 'Cache Layer')]
        results = []
        for port, name in checks:
            start = time.time()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            try:
                sock.connect(('127.0.0.1', port))
                latency = int((time.time() - start) * 1000)
                status = 'healthy' if latency < 100 else 'degraded'
            except:
                latency = -1
                status = 'unreachable'
            finally:
                sock.close()
            results.append({'name': name, 'status': status, 'latency_ms': latency})
        return results

    def _recommendations(self, metrics, alerts):
        recs = []
        if metrics:
            if metrics['cpu_usage'] > 70:
                recs.append(f'High CPU ({metrics["cpu_usage"]}%). Consider scaling or optimizing.')
            if metrics['memory_usage'] > 75:
                recs.append(f'Memory usage at {metrics["memory_usage"]}%. Check for leaks.')
            if metrics['disk_usage']['percent'] > 80:
                recs.append(f'Disk at {metrics["disk_usage"]["percent"]}%. Schedule cleanup.')
        if not recs:
            recs.append('All systems normal. No action required.')
        return recs

class AgentHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _send(self, data, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path == '/api/health':
                self._send({'status': 'running', 'source': 'live', 'mode': 'live'})
            elif path == '/api/overview':
                m = server.collector.get_current()
                a = server.collector.check_thresholds()
                s = {'running': True, 'uptime': self._format_uptime(), 'pending_tasks': len(server.remediation.actions), 'completed_tasks': len(server.remediation.actions), 'total_alerts': len(a)}
                health = 85
                if m:
                    health = round(100 - (m['cpu_usage'] * 0.4 + m['memory_usage'] * 0.3 + m['disk_usage']['percent'] * 0.3))
                self._send({
                    'agent_status': 'running', 'last_check': datetime.utcnow().isoformat(),
                    'uptime': s['uptime'], 'total_alerts': s['total_alerts'],
                    'critical_alerts': len([x for x in a if x['type'] == 'critical']),
                    'tasks_completed_today': s['completed_tasks'], 'tasks_pending': s['pending_tasks'],
                    'system_health_score': max(0, min(100, health)),
                })
            elif path == '/api/metrics':
                m = server.collector.get_current() or {}
                self._send({
                    'timestamp': datetime.utcnow().isoformat(),
                    'cpu_usage': m.get('cpu_usage', 0),
                    'memory_usage': m.get('memory_usage', 0),
                    'disk_usage': m.get('disk_usage', {}).get('percent', 0),
                    'network_in_mbps': m.get('network_in_mbps', 0),
                    'network_out_mbps': m.get('network_out_mbps', 0),
                    'active_processes': m.get('active_processes', 0),
                    'uptime_seconds': m.get('uptime_seconds', 0),
                    'hostname': m.get('hostname', socket.gethostname()),
                })
            elif path == '/api/alerts':
                self._send([{**a, 'id': i+1, 'timestamp': datetime.utcnow().isoformat(), 'resolved': False} for i, a in enumerate(server.collector.check_thresholds())])
            elif path == '/api/diagnostics':
                diag = server.diagnostic.results or {'overall_status': 'operational', 'services': [], 'recommendations': []}
                self._send({'services': diag.get('services', []), 'last_diagnostic_run': diag.get('timestamp', datetime.utcnow().isoformat()), 'overall_status': diag.get('overall_status', 'operational'), 'recommendations': diag.get('recommendations', [])})
            elif path == '/api/actions':
                self._send(server.remediation.get_history())
            else:
                self._send({'error': 'not_found'}, 404)
        except Exception as e:
            self._send({'error': str(e)}, 500)

    def _format_uptime(self):
        if not server.collector.get_current():
            return '0h 0m'
        secs = server.collector.get_current().get('uptime_seconds', 0)
        h, m = divmod(secs // 60, 60)
        return f'{int(h)}h {int(m)}m'

class AgentServer:
    def __init__(self):
        self.collector = MetricsCollector()
        self.diagnostic = DiagnosticEngine()
        self.remediation = Remediation()
        self.httpd = None

    def start(self):
        self.collector.start()
        logger.info('Agent starting...')
        self.httpd = HTTPServer((HOST, PORT), AgentHandler)
        logger.info(f'Agent API listening on {HOST}:{PORT}')
        self.httpd.serve_forever()

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()

server = AgentServer()

if __name__ == '__main__':
    try:
        server.start()
    except KeyboardInterrupt:
        logger.info('Shutting down...')
        server.stop()
