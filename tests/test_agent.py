import sys, os, json, io, time, tempfile, unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# psutil mock
psutil_mock = MagicMock()
psutil_mock.cpu_percent.return_value = 45.0
psutil_mock.virtual_memory.return_value = MagicMock(percent=62.0, total=17179869184, used=10654296473)
psutil_mock.disk_usage.return_value = MagicMock(total=500107862016, used=250053931008, free=250053931008, percent=50.0)
psutil_mock.net_io_counters.return_value = MagicMock(bytes_recv=1024000, bytes_sent=512000)
psutil_mock.getloadavg.return_value = (1.5, 1.2, 0.9)
psutil_mock.boot_time.return_value = time.time() - 86400
psutil_mock.pids.return_value = list(range(1, 201))

import agent

class TestLogger(unittest.TestCase):
    def setUp(self):
        self.logger = agent.Logger('TestCtx')

    def test_log_valid_json(self):
        buf = io.StringIO()
        with patch('sys.stderr', buf):
            self.logger.log('info', 'hello')
            output = buf.getvalue().strip()
            parsed = json.loads(output)
            self.assertEqual(parsed['level'], 'info')
            self.assertEqual(parsed['message'], 'hello')
            self.assertEqual(parsed['context'], 'TestCtx')

    def test_log_with_extra(self):
        buf = io.StringIO()
        with patch('sys.stderr', buf):
            self.logger.log('warn', 'test', key='val', num=42)
            output = buf.getvalue().strip()
            parsed = json.loads(output)
            self.assertEqual(parsed['key'], 'val')
            self.assertEqual(parsed['num'], 42)

    def test_info_shorthand(self):
        buf = io.StringIO()
        with patch('sys.stderr', buf):
            self.logger.info('info msg')
            parsed = json.loads(buf.getvalue().strip())
            self.assertEqual(parsed['level'], 'info')

    def test_error_shorthand(self):
        buf = io.StringIO()
        with patch('sys.stderr', buf):
            self.logger.error('err msg', error='boom')
            parsed = json.loads(buf.getvalue().strip())
            self.assertEqual(parsed['level'], 'error')
            self.assertEqual(parsed['error'], 'boom')

class TestMetricsCollector(unittest.TestCase):
    def setUp(self):
        self.collector = agent.MetricsCollector()

    @patch('agent.psutil', psutil_mock)
    def test_collect_returns_metrics(self):
        m = self.collector.collect()
        self.assertIsNotNone(m)
        self.assertIn('cpu_usage', m)
        self.assertIn('memory_usage', m)
        self.assertIn('disk_usage', m)
        self.assertEqual(m['cpu_usage'], 45.0)
        self.assertEqual(m['active_processes'], 200)

    @patch('agent.psutil', None)
    def test_collect_returns_none_when_psutil_missing(self):
        m = self.collector.collect()
        self.assertIsNone(m)

    @patch('agent.psutil', psutil_mock)
    def test_get_current(self):
        self.collector.collect()
        self.assertIsNotNone(self.collector.get_current())

    @patch('agent.psutil', psutil_mock)
    def test_get_history(self):
        self.collector.collect()
        self.collector.collect()
        history = self.collector.get_history(limit=10)
        self.assertEqual(len(history), 2)

    @patch('agent.psutil', psutil_mock)
    def test_check_thresholds_normal(self):
        self.collector.collect()
        alerts = self.collector.check_thresholds()
        self.assertEqual(len(alerts), 0)

    @patch('agent.psutil', psutil_mock)
    def test_check_thresholds_high_cpu(self):
        with patch.object(agent.psutil, 'cpu_percent', return_value=92.0):
            self.collector.collect()
            alerts = self.collector.check_thresholds()
            types = [a['type'] for a in alerts]
            self.assertIn('critical', types)

class TestRemediation(unittest.TestCase):
    def setUp(self):
        self.rem = agent.Remediation()

    def test_rotate_logs_no_dir(self):
        result = self.rem.rotate_logs('/nonexistent/logs')
        self.assertIn('Rotated 0', result)

    def test_clean_temp_no_dir(self):
        with patch('os.path.isdir', return_value=False):
            result = self.rem.clean_temp()
            self.assertIn('Cleaned 0', result)

    def test_get_history(self):
        self.rem.rotate_logs('/nonexistent')
        history = self.rem.get_history()
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]['name'], 'Log Rotation')

class TestDiagnosticEngine(unittest.TestCase):
    def setUp(self):
        self.engine = agent.DiagnosticEngine()
        self.collector = agent.MetricsCollector()

    @patch('agent.psutil', psutil_mock)
    def test_run_returns_results(self):
        self.collector.collect()
        results = self.engine.run(self.collector)
        self.assertIn('overall_status', results)
        self.assertIn('services', results)
        self.assertIn('recommendations', results)

    @patch('agent.psutil', psutil_mock)
    def test_recommendations_on_high_metrics(self):
        with patch.object(agent.psutil, 'cpu_percent', return_value=92.0), \
             patch.object(agent.psutil, 'virtual_memory', return_value=MagicMock(percent=96.0, total=17179869184, used=16500000000)), \
             patch.object(agent.psutil, 'disk_usage', return_value=MagicMock(total=500107862016, used=490000000000, free=10000000000, percent=98.0)):
            self.collector.collect()
            results = self.engine.run(self.collector)
            self.assertNotEqual(results['overall_status'], 'operational')

class TestAgentServer(unittest.TestCase):
    def test_agent_handler_format_uptime_no_metrics(self):
        server = agent.AgentServer()
        self.assertEqual(server.collector.metrics, None)

if __name__ == '__main__':
    unittest.main()
