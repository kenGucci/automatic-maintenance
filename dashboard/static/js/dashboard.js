/* ============================================
   AUTOMATIC MAINTENANCE — Premium Dashboard JS
   ============================================ */

// --- Chart.js Global Config ---
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// --- Theme Management ---
const ThemeManager = {
  init() {
    const saved = localStorage.getItem("dashboard-theme") || "dark";
    this.apply(saved);
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      this.apply(next);
      localStorage.setItem("dashboard-theme", next);
      // Rebuild charts with new colors
      ChartManager.rebuildAll();
    });
  },

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  },

  getColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      primary: style.getPropertyValue("--color-primary").trim(),
      accent: style.getPropertyValue("--color-accent").trim(),
      success: style.getPropertyValue("--color-success").trim(),
      warning: style.getPropertyValue("--color-warning").trim(),
      error: style.getPropertyValue("--color-error").trim(),
      info: style.getPropertyValue("--color-info").trim(),
      textPrimary: style.getPropertyValue("--text-primary").trim(),
      textSecondary: style.getPropertyValue("--text-secondary").trim(),
      textTertiary: style.getPropertyValue("--text-tertiary").trim(),
      border: style.getPropertyValue("--border-color").trim(),
      bgSurface: style.getPropertyValue("--bg-surface").trim(),
      bgCard: style.getPropertyValue("--bg-card").trim(),
    };
  },
};

// --- Chart Manager ---
const ChartManager = {
  charts: {},

  rebuildAll() {
    Object.values(this.charts).forEach((c) => c.destroy());
    this.charts = {};
    DataLoader.loadPage(Navigator.getCurrentPage());
  },

  createOverviewChart(history) {
    const ctx = document.getElementById("overview-chart");
    if (!ctx) return;
    if (this.charts.overview) this.charts.overview.destroy();

    const c = ThemeManager.getColors();
    const labels = history.map((h) => {
      const d = new Date(h.timestamp);
      return d.getHours().toString().padStart(2, "0") + ":00";
    });

    this.charts.overview = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "CPU",
            data: history.map((h) => h.cpu_usage),
            borderColor: c.primary,
            backgroundColor: c.primary + "20",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: "Memory",
            data: history.map((h) => h.memory_usage),
            borderColor: c.accent,
            backgroundColor: c.accent + "15",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: "Disk",
            data: history.map((h) => h.disk_usage),
            borderColor: c.warning,
            backgroundColor: c.warning + "10",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              boxHeight: 3,
              useBorderRadius: true,
              borderRadius: 2,
              padding: 16,
              color: c.textSecondary,
              font: { size: 11, weight: "500" },
            },
          },
          tooltip: {
            backgroundColor: c.bgCard,
            titleColor: c.textPrimary,
            bodyColor: c.textSecondary,
            borderColor: c.border,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: c.border, drawBorder: false },
            ticks: { color: c.textTertiary, font: { size: 10 } },
          },
          y: {
            grid: { color: c.border, drawBorder: false },
            ticks: {
              color: c.textTertiary,
              font: { size: 10 },
              callback: (v) => v + "%",
            },
            min: 0,
            max: 100,
          },
        },
      },
    });
  },

  createAlertsDoughnut(alerts) {
    const ctx = document.getElementById("alerts-doughnut");
    if (!ctx) return;
    if (this.charts.alertsDoughnut) this.charts.alertsDoughnut.destroy();

    const c = ThemeManager.getColors();
    const counts = { critical: 0, warning: 0, info: 0 };
    alerts.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });

    this.charts.alertsDoughnut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Critical", "Warning", "Info"],
        datasets: [{
          data: [counts.critical, counts.warning, counts.info],
          backgroundColor: [c.error, c.warning, c.info],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              padding: 16,
              boxWidth: 12,
              boxHeight: 12,
              useBorderRadius: true,
              borderRadius: 6,
              color: c.textSecondary,
              font: { size: 11, weight: "500" },
            },
          },
          tooltip: {
            backgroundColor: c.bgCard,
            titleColor: c.textPrimary,
            bodyColor: c.textSecondary,
            borderColor: c.border,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
          },
        },
      },
    });
  },

  createMonitoringChart(history) {
    const ctx = document.getElementById("monitoring-chart");
    if (!ctx) return;
    if (this.charts.monitoring) this.charts.monitoring.destroy();

    const c = ThemeManager.getColors();
    const labels = history.map((h) => {
      const d = new Date(h.timestamp);
      return d.getHours().toString().padStart(2, "0") + ":00";
    });

    this.charts.monitoring = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "CPU",
            data: history.map((h) => h.cpu_usage),
            borderColor: c.primary,
            backgroundColor: c.primary + "15",
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
          {
            label: "Memory",
            data: history.map((h) => h.memory_usage),
            borderColor: c.accent,
            backgroundColor: c.accent + "10",
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              boxHeight: 3,
              useBorderRadius: true,
              borderRadius: 2,
              padding: 16,
              color: c.textSecondary,
              font: { size: 11, weight: "500" },
            },
          },
          tooltip: {
            backgroundColor: c.bgCard,
            titleColor: c.textPrimary,
            bodyColor: c.textSecondary,
            borderColor: c.border,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: c.border, drawBorder: false },
            ticks: { color: c.textTertiary, font: { size: 10 } },
          },
          y: {
            grid: { color: c.border, drawBorder: false },
            ticks: {
              color: c.textTertiary,
              font: { size: 10 },
              callback: (v) => v + "%",
            },
            min: 0,
            max: 100,
          },
        },
      },
    });
  },

  createLatencyChart(services) {
    const ctx = document.getElementById("latency-chart");
    if (!ctx) return;
    if (this.charts.latency) this.charts.latency.destroy();

    const c = ThemeManager.getColors();

    this.charts.latency = new Chart(ctx, {
      type: "bar",
      data: {
        labels: services.map((s) => s.name),
        datasets: [{
          label: "Latency (ms)",
          data: services.map((s) => s.latency_ms),
          backgroundColor: services.map((s) =>
            s.status === "healthy" ? c.success + "80" :
            s.status === "degraded" ? c.warning + "80" :
            c.error + "80"
          ),
          borderColor: services.map((s) =>
            s.status === "healthy" ? c.success :
            s.status === "degraded" ? c.warning :
            c.error
          ),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: c.bgCard,
            titleColor: c.textPrimary,
            bodyColor: c.textSecondary,
            borderColor: c.border,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y}ms`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: c.textTertiary, font: { size: 10 } },
          },
          y: {
            grid: { color: c.border, drawBorder: false },
            ticks: {
              color: c.textTertiary,
              font: { size: 10 },
              callback: (v) => v + "ms",
            },
          },
        },
      },
    });
  },
};

// --- Navigation ---
const Navigator = {
  init() {
    const links = document.querySelectorAll(".sidebar-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.getAttribute("data-page");
        this.goTo(page);
        // Close mobile sidebar
        document.getElementById("sidebar").classList.remove("mobile-open");
      });
    });

    const hash = window.location.hash.replace("#", "") || "overview";
    this.goTo(hash);
  },

  goTo(page) {
    // Update sidebar
    document.querySelectorAll(".sidebar-link").forEach((l) => l.classList.remove("active"));
    const activeLink = document.querySelector(`.sidebar-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add("active");

    // Update page sections
    document.querySelectorAll(".page-section").forEach((s) => s.classList.remove("active"));
    const section = document.getElementById(`page-${page}`);
    if (section) section.classList.add("active");

    // Update title
    const titles = {
      overview: ["Overview", "System health at a glance"],
      monitoring: ["Monitoring", "Real-time resource metrics"],
      diagnostics: ["Diagnostics", "Service health & analysis"],
      agents: ["Agents", "CrewAI multi-agent orchestration"],
      settings: ["Settings", "Configure monitoring behavior"],
    };
    const [title, subtitle] = titles[page] || [page, ""];
    document.getElementById("page-title").textContent = title;
    document.getElementById("page-subtitle").textContent = subtitle;

    window.location.hash = page;
    DataLoader.loadPage(page);
  },

  getCurrentPage() {
    const active = document.querySelector(".page-section.active");
    return active ? active.id.replace("page-", "") : "overview";
  },
};

// --- API Client ---
const API = {
  async get(endpoint) {
    try {
      const res = await fetch(`/api/${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API error (${endpoint}):`, err);
      return null;
    }
  },

  async post(endpoint, data) {
    try {
      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API error (${endpoint}):`, err);
      return null;
    }
  },
};

// --- Utility ---
function timeAgo(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getBarClass(value, thresholds) {
  const { warning, critical } = thresholds;
  if (value >= critical) return "high";
  if (value >= warning) return "medium";
  return "low";
}

// --- Data Loader ---
const DataLoader = {
  async loadPage(page) {
    switch (page) {
      case "overview":
        await this.loadOverview();
        break;
      case "monitoring":
        await this.loadMonitoring();
        break;
      case "diagnostics":
        await this.loadDiagnostics();
        break;
      case "agents":
        await this.loadAgents();
        break;
      case "settings":
        await this.loadSettings();
        break;
    }
  },

  async loadOverview() {
    const [overview, alerts, tasks, history] = await Promise.all([
      API.get("overview"),
      API.get("alerts"),
      API.get("tasks"),
      API.get("metrics/history"),
    ]);

    if (overview) {
      document.getElementById("stat-health-score").textContent = overview.system_health_score + "%";
      document.getElementById("stat-uptime").textContent = overview.uptime;
      document.getElementById("stat-critical-alerts").textContent = overview.critical_alerts;
      document.getElementById("stat-tasks-completed").textContent = overview.tasks_completed_today;
      document.getElementById("stat-tasks-pending").textContent = overview.tasks_pending;
    }

    if (alerts) {
      const listEl = document.getElementById("overview-alerts");
      listEl.innerHTML = alerts
        .map(
          (a) => `
        <li class="alert-item">
          <span class="alert-badge ${a.type}">${a.type}</span>
          <span class="alert-message">${a.message}</span>
          ${a.resolved ? '<span class="alert-resolved">Resolved</span>' : ""}
          <span class="alert-time">${timeAgo(a.timestamp)}</span>
        </li>
      `
        )
        .join("");
      ChartManager.createAlertsDoughnut(alerts);
    }

    if (tasks) {
      const tbody = document.querySelector("#overview-tasks tbody");
      tbody.innerHTML = tasks
        .map(
          (t) => `
        <tr>
          <td>${t.name}</td>
          <td><span class="task-status-badge ${t.status}">${t.status}</span></td>
          <td>${formatDuration(t.duration_seconds)}</td>
          <td>${timeAgo(t.timestamp)}</td>
        </tr>
      `
        )
        .join("");
    }

    if (history) {
      ChartManager.createOverviewChart(history);
    }
  },

  async loadMonitoring() {
    const [metrics, history] = await Promise.all([
      API.get("metrics"),
      API.get("metrics/history"),
    ]);

    if (metrics) {
      document.getElementById("metric-cpu").textContent = metrics.cpu_usage + "%";
      document.getElementById("metric-memory").textContent = metrics.memory_usage + "%";
      document.getElementById("metric-disk").textContent = metrics.disk_usage + "%";
      document.getElementById("metric-net-in").textContent = metrics.network_in_mbps + " Mbps";
      document.getElementById("metric-net-out").textContent = metrics.network_out_mbps + " Mbps";
      document.getElementById("metric-processes").textContent = metrics.active_processes;

      // Metric bars
      const barsEl = document.getElementById("monitoring-bars");
      const barData = [
        { name: "CPU", value: metrics.cpu_usage, thresholds: { warning: 70, critical: 90 } },
        { name: "Memory", value: metrics.memory_usage, thresholds: { warning: 75, critical: 95 } },
        { name: "Disk", value: metrics.disk_usage, thresholds: { warning: 80, critical: 95 } },
      ];
      barsEl.innerHTML = barData
        .map(
          (b) => `
        <div class="metric-bar-container">
          <div class="metric-bar-label">
            <span class="metric-bar-label-name">${b.name}</span>
            <span class="metric-bar-label-value">${b.value}%</span>
          </div>
          <div class="metric-bar-track">
            <div class="metric-bar-fill ${getBarClass(b.value, b.thresholds)}" style="width:${b.value}%"></div>
          </div>
        </div>
      `
        )
        .join("");
    }

    if (history) {
      ChartManager.createMonitoringChart(history);
    }
  },

  async loadDiagnostics() {
    const diagnostics = await API.get("diagnostics");
    if (!diagnostics) return;

    document.getElementById("diagnostic-last-run").textContent =
      "Last run: " + timeAgo(diagnostics.last_diagnostic_run);

    // Service cards
    const gridEl = document.getElementById("diagnostic-services");
    gridEl.innerHTML = diagnostics.services
      .map(
        (s) => `
      <div class="service-card ${s.status}">
        <div class="service-card-header">
          <span class="service-name">${s.name}</span>
          <div class="service-status-indicator">
            <span class="service-status-dot ${s.status}"></span>
            <span class="service-status-text">${s.status}</span>
          </div>
        </div>
        <div class="service-latency">
          Latency: <span class="service-latency-value">${s.latency_ms}ms</span>
        </div>
      </div>
    `
      )
      .join("");

    // Recommendations
    const recEl = document.getElementById("diagnostic-recommendations");
    recEl.innerHTML = diagnostics.recommendations
      .map(
        (r) => `
      <li class="recommendation-item">
        <span class="recommendation-icon">&#10148;</span>
        <span class="recommendation-text">${r}</span>
      </li>
    `
      )
      .join("");

    // Latency chart
    ChartManager.createLatencyChart(diagnostics.services);
  },

  async loadAgents() {
    const agents = [
      {
        name: "Senior Researcher",
        role: "Research & Analysis",
        avatar: "R",
        avatarClass: "researcher",
        status: "active",
        tasksCompleted: 47,
        successRate: "94%",
      },
      {
        name: "Senior Coder",
        role: "Code Generation & Fixes",
        avatar: "C",
        avatarClass: "coder",
        status: "active",
        tasksCompleted: 63,
        successRate: "91%",
      },
      {
        name: "Code Reviewer",
        role: "Quality Assurance",
        avatar: "Q",
        avatarClass: "reviewer",
        status: "active",
        tasksCompleted: 55,
        successRate: "97%",
      },
    ];

    const gridEl = document.getElementById("agents-grid");
    gridEl.innerHTML = agents
      .map(
        (a) => `
      <div class="agent-card">
        <span class="agent-status-badge">${a.status}</span>
        <div class="agent-header">
          <div class="agent-avatar ${a.avatarClass}">${a.avatar}</div>
          <div>
            <div class="agent-name">${a.name}</div>
            <div class="agent-role">${a.role}</div>
          </div>
        </div>
        <div class="agent-stats">
          <div class="agent-stat">
            <span class="agent-stat-value">${a.tasksCompleted}</span>
            <span class="agent-stat-label">Tasks Done</span>
          </div>
          <div class="agent-stat">
            <span class="agent-stat-value">${a.successRate}</span>
            <span class="agent-stat-label">Success Rate</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Agent activity log
    const logBody = document.getElementById("agent-log-body");
    const actions = [
      { agent: "Senior Researcher", action: "Researched deployment best practices", status: "completed", time: "5m ago" },
      { agent: "Senior Coder", action: "Fixed memory leak in monitor module", status: "completed", time: "12m ago" },
      { agent: "Code Reviewer", action: "Reviewed PR #42 — diagnostic engine", status: "completed", time: "18m ago" },
      { agent: "Senior Coder", action: "Auto-remediated disk threshold warning", status: "completed", time: "25m ago" },
      { agent: "Senior Researcher", action: "Analyzed SSL certificate renewal process", status: "completed", time: "1h ago" },
      { agent: "Code Reviewer", action: "Flagged security vulnerability in config", status: "running", time: "2m ago" },
    ];
    logBody.innerHTML = actions
      .map(
        (a) => `
      <tr>
        <td>${a.agent}</td>
        <td>${a.action}</td>
        <td><span class="task-status-badge ${a.status}">${a.status}</span></td>
        <td>${a.time}</td>
      </tr>
    `
      )
      .join("");
  },

  async loadSettings() {
    const settings = await API.get("settings");
    if (!settings) return;

    document.getElementById("setting-auto-remediation").checked = settings.auto_remediation_enabled;
    document.getElementById("setting-monitoring-interval").value = settings.monitoring_interval_ms;
    document.getElementById("setting-cpu-warning").value = settings.alert_thresholds.cpu_warning;
    document.getElementById("setting-cpu-critical").value = settings.alert_thresholds.cpu_critical;
    document.getElementById("setting-mem-warning").value = settings.alert_thresholds.memory_warning;
    document.getElementById("setting-mem-critical").value = settings.alert_thresholds.memory_critical;
    document.getElementById("setting-disk-warning").value = settings.alert_thresholds.disk_warning;
    document.getElementById("setting-disk-critical").value = settings.alert_thresholds.disk_critical;
    document.getElementById("setting-notif-email").checked = settings.notification_channels.includes("email");
    document.getElementById("setting-notif-slack").checked = settings.notification_channels.includes("slack");
  },
};

// --- Settings Form ---
document.getElementById("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    monitoring_interval_ms: parseInt(document.getElementById("setting-monitoring-interval").value),
    auto_remediation_enabled: document.getElementById("setting-auto-remediation").checked,
    alert_thresholds: {
      cpu_warning: parseInt(document.getElementById("setting-cpu-warning").value),
      cpu_critical: parseInt(document.getElementById("setting-cpu-critical").value),
      memory_warning: parseInt(document.getElementById("setting-mem-warning").value),
      memory_critical: parseInt(document.getElementById("setting-mem-critical").value),
      disk_warning: parseInt(document.getElementById("setting-disk-warning").value),
      disk_critical: parseInt(document.getElementById("setting-disk-critical").value),
    },
    notification_channels: [
      document.getElementById("setting-notif-email").checked ? "email" : null,
      document.getElementById("setting-notif-slack").checked ? "slack" : null,
      document.getElementById("setting-notif-webhook") && document.getElementById("setting-notif-webhook").checked ? "webhook" : null,
    ].filter(Boolean),
  };

  const result = await API.post("settings", data);
  if (result) {
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = "Saved!";
    btn.style.background = "var(--color-success)";
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = "";
    }, 2000);
  }
});

document.getElementById("settings-reset").addEventListener("click", async () => {
  await DataLoader.loadSettings();
});

// --- Mobile Sidebar Toggle ---
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("mobile-open");
});

// --- Chart Range Buttons ---
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("chart-range")) {
    const parent = e.target.closest(".card-actions");
    parent.querySelectorAll(".chart-range").forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
  }
});

// --- Auto-refresh metrics every 10 seconds ---
let refreshInterval;
function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    const page = Navigator.getCurrentPage();
    if (page === "overview" || page === "monitoring") {
      DataLoader.loadPage(page);
    }
  }, 10000);
}

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  ThemeManager.init();
  Navigator.init();
  startAutoRefresh();
});
