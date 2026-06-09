const AUTOMEND_KB = [
  {
    keywords: ['what', 'is', 'automend', 'this', 'project', 'about'],
    answer: 'AutoMend is an autonomous AI agent that monitors, diagnoses, and remediates system issues — disk cleanup, log rotation, threshold alerts — with controlled autonomy. It sits on top of your existing monitoring stack (PagerDuty, Grafana, Datadog) and closes the gap between alert and resolution.'
  },
  {
    keywords: ['how', 'work', 'does', 'it'],
    answer: 'AutoMend collects system metrics (CPU, memory, disk, network) every 30 seconds. When thresholds are crossed, the Diagnostic Engine analyzes root causes and recommends fixes. The Remediation Engine executes them with configurable safety — auto-approve, require approval, or dry-run mode. It then sends you a full report.'
  },
  {
    keywords: ['safe', 'safety', 'break', 'danger', 'destroy', 'damage'],
    answer: 'Yes, safety is built-in at every level. Destructive actions require approval by default. There\'s a read-only mode (AUTO_REMEDIATION=false), dry-run sandboxing, an audit trail with timestamps, and rollback capability with state snapshots. You control the safety boundaries — actions like service restarts and package updates are opt-in.'
  },
  {
    keywords: ['install', 'setup', 'quickstart', 'start', 'getting started', 'run', 'deploy'],
    answer: 'Quick start: git clone the repo, run "npm install && npm start" for the agent, then "pip install flask gunicorn && python3 dashboard/app.py" for the dashboard. You can also use Docker Compose. Full docs are at https://github.com/kenGucci/automatic-maintenance.'
  },
  {
    keywords: ['tech', 'stack', 'built', 'technology', 'language', 'framework'],
    answer: 'Built with Node.js 20 for the agent runtime, Python 3.11 + Flask for the dashboard, Chart.js for real-time charts, CrewAI for multi-agent orchestration (optional), Docker for containerization, and deployed on Vercel. CI/CD runs via GitHub Actions daily at 3 AM UTC.'
  },
  {
    keywords: ['price', 'pricing', 'cost', 'free', 'license', 'pay', 'money', 'isc'],
    answer: 'AutoMend is completely free and open source under the ISC license. You can use, modify, and distribute it freely. There are no paid tiers or hidden costs.'
  },
  {
    keywords: ['feature', 'capability', 'can it', 'do'],
    answer: 'Key features: automated monitoring (CPU, memory, disk, network every 30s), intelligent diagnostics with root cause analysis, auto-remediation (log rotation, disk cleanup, cache flushing), configurable safety boundaries, real-time dashboard with Chart.js, REST API, audit trail, rollback support, and optional multi-agent AI orchestration via CrewAI.'
  },
  {
    keywords: ['dashboard', 'ui', 'interface', 'web'],
    answer: 'The dashboard runs on Flask and provides real-time system metrics, health scores, alert history, diagnostic reports, and action logs. It features interactive Chart.js graphs and is available at http://localhost:8080 when running locally, or at https://automatic-maintenance.vercel.app/dashboard.'
  },
  {
    keywords: ['agent', 'ai', 'claude', 'intelligence', 'crewai', 'multi-agent'],
    answer: 'AutoMend has two AI modes: a single-agent mode (Node.js) that monitors and remediates, and an optional multi-agent mode using CrewAI with three agents — Senior Researcher (finds best practices), Senior Coder (writes maintenance code), and Code Reviewer (catches bugs). Claude AI integration provides natural language chat and advanced diagnostics.'
  },
  {
    keywords: ['threshold', 'alert', 'warning', 'critical', 'monitor'],
    answer: 'Default thresholds: CPU — warning 70% / critical 90% | Memory — warning 75% / critical 95% | Disk — warning 80% / critical 95%. All thresholds are configurable via environment variables or the dashboard.'
  },
  {
    keywords: ['github', 'repo', 'repository', 'source', 'code', 'contribute', 'contributing'],
    answer: 'The project is open source at https://github.com/kenGucci/automatic-maintenance. Contributions are welcome — bug reports, feature requests, docs, and PRs. Star the repo to show support!'
  },
  {
    keywords: ['who', 'built', 'author', 'creator', 'team', 'ken', 'gucci'],
    answer: 'AutoMend is built by kenGucci (@suggestionii on X). It\'s an open-source project built in public for the DevOps and infrastructure community.'
  },
  {
    keywords: ['docker', 'container', 'compose'],
    answer: 'Yes! AutoMend has full Docker support. Use "docker compose up -d" to start both the agent and dashboard. The Docker setup uses tini as an init process for proper signal handling.'
  },
  {
    keywords: ['log', 'rotation', 'cleanup', 'disk', 'cache'],
    answer: 'AutoMend automatically rotates logs, truncates old access logs, prunes Docker build cache, and cleans temp files. When disk hits threshold, it identifies the largest offenders (e.g., unbounded nginx access logs at 14GB), resolves the issue, and reports: "Disk usage spike resolved. Freed 8.2GB."'
  },
  {
    keywords: ['notification', 'email', 'alert', 'pagerduty', 'opsgenie'],
    answer: 'AutoMend supports email notifications and integrates with existing alerting tools like PagerDuty and OpsGenie. It sends a report after every remediation action with details on what was found, what was done, and the result.'
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greeting', 'sup'],
    answer: 'Hi! I\'m the AutoMend assistant. I can answer questions about how AutoMend works, how to install it, safety features, and more. What would you like to know?'
  },
  {
    keywords: ['thanks', 'thank', 'ty', 'thx', 'appreciate'],
    answer: 'You\'re welcome! If you have any more questions about AutoMend, feel free to ask. Or check out the live demo and dashboard above!'
  },
  {
    keywords: ['demo', 'video', 'see', 'watch'],
    answer: 'Scroll up to the Demo Video section above! There\'s a full walkthrough showing the dashboard, monitoring, diagnostics, and the AI-powered chat interface in under 2 minutes. You can also download the video.'
  },
  {
    keywords: ['help', 'support', 'docs', 'documentation'],
    answer: 'Check out the README on GitHub for full documentation: https://github.com/kenGucci/automatic-maintenance. You can also explore the dashboard and API docs at https://automatic-maintenance.vercel.app/docs.'
  },
  {
    keywords: ['compare', 'vs', 'different', 'better', 'alternative'],
    answer: 'Unlike cron scripts that run blindly, AutoMend checks context before acting. Unlike PagerDuty that only alerts, AutoMend investigates and fixes. Unlike Grafana that shows metrics, AutoMend acts on them. It doesn\'t replace your stack — it sits on top, watching, diagnosing, and fixing the things that don\'t need a human.'
  }
];

function findBestAnswer(query) {
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of AUTOMEND_KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwWords = kw.split(/\s+/);
      const matchCount = kwWords.filter(k => words.some(w => w === k || w.includes(k) || k.includes(w))).length;
      if (matchCount > 0) {
        score += matchCount / kwWords.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0.3 ? best : null;
}

function autoMendChat(query) {
  const q = query.trim();
  if (!q) return { answer: 'Please type a question about AutoMend!', matched: false };

  const match = findBestAnswer(q);
  if (match) {
    return { answer: match.answer, matched: true };
  }

  const fallbacks = [
    "I'm not sure I understand. Try asking about what AutoMend is, how it works, safety, installation, features, or the tech stack.",
    "Hmm, I don't have an answer for that yet. I can tell you about AutoMend's features, safety, installation, or how it compares to other tools.",
    "I couldn't find a match for that. Try: 'What is AutoMend?', 'How does it work?', 'Is it safe?', or 'How do I install it?'"
  ];
  return { answer: fallbacks[Math.floor(Math.random() * fallbacks.length)], matched: false };
}
