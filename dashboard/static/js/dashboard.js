/* ============================================
   AUTOMATIC MAINTENANCE - Dashboard JS
   ============================================ */

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
    });
  },

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("theme-icon");
    const label = document.getElementById("theme-label");
    if (theme === "dark") {
      icon.innerHTML = "&#9789;"; // moon
      label.textContent = "Light";
    } else {
      icon.innerHTML = "&#9788;"; // sun
      label.textContent = "Dark";
    }
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
      });
    });

    // Handle hash on load
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
      overview: "Overview",
      monitoring: "Monitoring",
      diagnostics: "Diagnostics",
      settings: "Settings",
    };
    document.getElementById("page-title").textContent = titles[page] || page;

    // Update hash
    window.location.hash = page;

    // Load data for the page
    DataLoader.loadPage(page);
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
      case "settings":
        await this.loadSettings();
        break;
    }
  },

  async loadOverview() {
    const overview = await API.get("overview");
    if (!overview) return;

    document.getElementById("stat-health-score").textContent = overview.system_health_score + "%";
    document.getElementById("stat-uptime").textContent = overview.uptime;
    document.getElementById("stat-critical-alerts").textContent = overview.critical_alerts;
    document.getElementById("stat-tasks-completed").textContent = overview.tasks_completed_today;
    document.getElementById("stat-tasks-pending").textContent = overview.tasks_pending;

    // Alerts
    const alerts = await API.get("alerts");
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
    }

    // Tasks
    const tasks = await API.get("tasks");
    if (tasks) {
      const tbody = document.querySelector("#overview-tasks tbody");
      tbody.innerHTML = tasks
        .map(
          (t) => `
        <tr>
          <td style="color:var(--text-primary);font-weight:var(--font-weight-medium)">${t.name}</td>
          <td><span class="task-status-badge ${t.status}">${t.status}</span></td>
          <td>${formatDuration(t.duration_seconds)}</td>
          <td>${timeAgo(t.timestamp)}</td>
        </tr>
      `
        )
        .join("");
    }
  },

  async loadMonitoring() {
    const metrics = await API.get("metrics");
    if (!metrics) return;

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

    // History chart
    const history = await API.get("metrics/history");
    if (history) {
      const container = document.getElementById("chart-bars-container");
      const maxCpu = Math.max(...history.map((h) => h.cpu_usage), 1);
      container.innerHTML = history
        .map(
          (h) => `
        <div class="chart-bar cpu" style="height:${(h.cpu_usage / maxCpu) * 80}%"></div>
      `
        )
        .join("");
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
      <div class="service-card">
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
    ].filter(Boolean),
  };

  const result = await API.post("settings", data);
  if (result) {
    alert(result.message);
  }
});

document.getElementById("settings-reset").addEventListener("click", async () => {
  await DataLoader.loadSettings();
});

// --- Auto-refresh metrics every 10 seconds ---
let refreshInterval;
function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    const activePage = document.querySelector(".page-section.active");
    if (activePage) {
      const page = activePage.id.replace("page-", "");
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