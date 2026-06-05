"""
Telegram Bot for Automatic Maintenance
Interacts with the maintenance agent, provides system status,
alerts, diagnostics, and answers questions about your infrastructure.
"""

import os
import logging
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify
import threading
import asyncio

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# --- Logging ---
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# --- Config ---
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
AUTHORIZED_USERS = os.getenv("TELEGRAM_AUTHORIZED_USERS", "").split(",")
AUTHORIZED_USERS = [u.strip() for u in AUTHORIZED_USERS if u.strip()]
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://127.0.0.1:8080")


def is_authorized(user_id: int) -> bool:
    """Check if user is authorized to use the bot."""
    if not AUTHORIZED_USERS or AUTHORIZED_USERS == [""]:
        return True  # No auth configured = open access
    return str(user_id) in AUTHORIZED_USERS


# --- Mock Data Generators ---
# In production, these would pull from the real Flask API /agent

def get_system_metrics():
    return {
        "cpu_usage": round(random.uniform(5, 85), 1),
        "memory_usage": round(random.uniform(20, 90), 1),
        "disk_usage": round(random.uniform(10, 70), 1),
        "network_in_mbps": round(random.uniform(0.5, 50), 2),
        "network_out_mbps": round(random.uniform(0.3, 30), 2),
        "active_processes": random.randint(50, 300),
        "uptime_seconds": int(datetime.now().timestamp()) - 1700000000,
    }


def get_agent_status():
    return {
        "status": "running",
        "health_score": round(random.uniform(70, 99), 1),
        "uptime": "72h 15m",
        "total_alerts": random.randint(5, 20),
        "critical_alerts": random.randint(0, 3),
        "tasks_completed": random.randint(5, 15),
        "tasks_pending": random.randint(1, 5),
    }


def get_service_health():
    return [
        {"name": "API Gateway", "status": random.choice(["healthy", "healthy", "degraded"]), "latency_ms": random.randint(10, 200)},
        {"name": "Database", "status": random.choice(["healthy", "healthy", "warning"]), "latency_ms": random.randint(5, 150)},
        {"name": "Cache Layer", "status": "healthy", "latency_ms": random.randint(1, 10)},
        {"name": "Message Queue", "status": random.choice(["healthy", "healthy", "degraded"]), "latency_ms": random.randint(5, 50)},
        {"name": "Storage Service", "status": "healthy", "latency_ms": random.randint(20, 100)},
        {"name": "Auth Service", "status": "healthy", "latency_ms": random.randint(10, 50)},
    ]


def get_crew_agents():
    return [
        {"name": "Senior Researcher", "tasks": 47, "success_rate": "94%", "status": "active"},
        {"name": "Senior Coder", "tasks": 63, "success_rate": "91%", "status": "active"},
        {"name": "Code Reviewer", "tasks": 55, "success_rate": "97%", "status": "active"},
    ]


def get_recent_alerts():
    alerts = [
        ("warning", "CPU usage exceeded 80% threshold"),
        ("critical", "Memory usage approaching critical level"),
        ("info", "Disk cleanup completed successfully"),
        ("warning", "Network latency spike detected"),
        ("info", "Service health check passed"),
        ("info", "Auto-scaling triggered for worker pool"),
        ("info", "Log rotation completed"),
        ("warning", "SSL certificate expires in 30 days"),
        ("critical", "Database connection pool reaching limit"),
        ("info", "Scheduled backup completed"),
    ]
    selected = random.sample(alerts, k=min(5, len(alerts)))
    return [
        {"type": t, "message": m, "time": f"{random.randint(1, 120)}m ago"}
        for t, m in selected
    ]


# --- Bot Command Handlers ---

async def start_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Unauthorized. Contact the admin.")
        return

    keyboard = [
        [
            InlineKeyboardButton("📊 Status", callback_data="status"),
            InlineKeyboardButton("🖥 Metrics", callback_data="metrics"),
        ],
        [
            InlineKeyboardButton("🔔 Alerts", callback_data="alerts"),
            InlineKeyboardButton("🩺 Diagnostics", callback_data="diagnostics"),
        ],
        [
            InlineKeyboardButton("🤖 Agents", callback_data="agents"),
            InlineKeyboardButton("⚙️ Settings", callback_data="settings"),
        ],
        [
            InlineKeyboardButton("🌐 Dashboard", callback_data="dashboard"),
            InlineKeyboardButton("❓ Help", callback_data="help"),
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "🤖 *AutoMaint Bot* — Your AI Maintenance Assistant\n\n"
        "I monitor, diagnose, and optimize your systems in real-time.\n"
        "Tap a button below or type a command to get started.\n\n"
        "💬 You can also ask me questions like:\n"
        "• _How's the system doing?_\n"
        "• _Any critical alerts?_\n"
        "• _What agents are running?_\n"
        "• _Check CPU usage_",
        parse_mode="Markdown",
        reply_markup=reply_markup,
    )


async def status_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status command."""
    if not is_authorized(update.effective_user.id):
        return

    agent = get_agent_status()
    status_emoji = "🟢" if agent["status"] == "running" else "🔴"

    keyboard = [
        [InlineKeyboardButton("📊 Full Metrics", callback_data="metrics"),
         InlineKeyboardButton("🔔 Alerts", callback_data="alerts")],
        [InlineKeyboardButton("🏠 Menu", callback_data="menu")],
    ]

    await update.message.reply_text(
        f"{status_emoji} *Agent Status*\n\n"
        f"• Status: *{agent['status'].title()}*\n"
        f"• Health Score: *{agent['health_score']}%*\n"
        f"• Uptime: *{agent['uptime']}*\n"
        f"• Critical Alerts: *{agent['critical_alerts']}*\n"
        f"• Tasks Today: *{agent['tasks_completed']}* ({agent['tasks_pending']} pending)",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def metrics_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /metrics command."""
    if not is_authorized(update.effective_user.id):
        return

    m = get_system_metrics()

    cpu_emoji = "🟢" if m["cpu_usage"] < 70 else "🟡" if m["cpu_usage"] < 90 else "🔴"
    mem_emoji = "🟢" if m["memory_usage"] < 75 else "🟡" if m["memory_usage"] < 95 else "🔴"
    disk_emoji = "🟢" if m["disk_usage"] < 80 else "🟡" if m["disk_usage"] < 95 else "🔴"

    # Build visual bars
    def bar(value, length=15):
        filled = int(value / 100 * length)
        return "█" * filled + "░" * (length - filled)

    keyboard = [
        [InlineKeyboardButton("🩺 Diagnostics", callback_data="diagnostics"),
         InlineKeyboardButton("🔔 Alerts", callback_data="alerts")],
        [InlineKeyboardButton("🏠 Menu", callback_data="menu")],
    ]

    await update.message.reply_text(
        f"🖥 *System Metrics*\n\n"
        f"{cpu_emoji} *CPU*: {m['cpu_usage']}%\n"
        f"   `{bar(m['cpu_usage'])}`\n\n"
        f"{mem_emoji} *Memory*: {m['memory_usage']}%\n"
        f"   `{bar(m['memory_usage'])}`\n\n"
        f"{disk_emoji} *Disk*: {m['disk_usage']}%\n"
        f"   `{bar(m['disk_usage'])}`\n\n"
        f"📡 *Network*\n"
        f"   In: {m['network_in_mbps']} Mbps\n"
        f"   Out: {m['network_out_mbps']} Mbps\n\n"
        f"⚙️ *Processes*: {m['active_processes']}",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def alerts_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /alerts command."""
    if not is_authorized(update.effective_user.id):
        return

    alerts = get_recent_alerts()
    emoji_map = {"critical": "🔴", "warning": "🟡", "info": "🔵"}

    text = "🔔 *Recent Alerts*\n\n"
    for a in alerts:
        emoji = emoji_map.get(a["type"], "⚪")
        text += f"{emoji} *{a['type'].title()}*: {a['message']}\n"
        text += f"   _{a['time']}_\n\n"

    keyboard = [
        [InlineKeyboardButton("📊 Status", callback_data="status"),
         InlineKeyboardButton("🖥 Metrics", callback_data="metrics")],
        [InlineKeyboardButton("🏠 Menu", callback_data="menu")],
    ]

    await update.message.reply_text(
        text, parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def diagnostics_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /diagnostics command."""
    if not is_authorized(update.effective_user.id):
        return

    services = get_service_health()
    status_map = {"healthy": "🟢", "degraded": "🟡", "warning": "🟡"}

    text = "🩺 *Service Diagnostics*\n\n"
    for s in services:
        emoji = status_map.get(s["status"], "⚪")
        text += f"{emoji} *{s['name']}*\n"
        text += f"   Status: {s['status'].title()} • Latency: `{s['latency_ms']}ms`\n\n"

    text += "\n💡 *Recommendations*\n"
    text += "• Consider increasing cache TTL for frequently accessed endpoints\n"
    text += "• Monitor database connection pool usage during peak hours"

    keyboard = [
        [InlineKeyboardButton("🖥 Metrics", callback_data="metrics"),
         InlineKeyboardButton("🔔 Alerts", callback_data="alerts")],
        [InlineKeyboardButton("🏠 Menu", callback_data="menu")],
    ]

    await update.message.reply_text(
        text, parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def agents_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /agents command."""
    if not is_authorized(update.effective_user.id):
        return

    agents = get_crew_agents()

    text = "🤖 *CrewAI Agents*\n\n"
    for a in agents:
        emoji = "🟢" if a["status"] == "active" else "🔴"
        text += f"{emoji} *{a['name']}*\n"
        text += f"   Tasks: {a['tasks']} • Success: {a['success_rate']}\n\n"

    text += f"\n📊 *Crew Total*: {sum(a['tasks'] for a in agents)} tasks completed"

    keyboard = [
        [InlineKeyboardButton("📊 Status", callback_data="status"),
         InlineKeyboardButton("🏠 Menu", callback_data="menu")],
    ]

    await update.message.reply_text(
        text, parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def dashboard_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /dashboard command."""
    if not is_authorized(update.effective_user.id):
        return

    keyboard = [
        [InlineKeyboardButton("🌐 Open Dashboard", url=DASHBOARD_URL)],
        [InlineKeyboardButton("🏠 Menu", callback_data="menu")],
    ]

    await update.message.reply_text(
        "🌐 *Dashboard*\n\n"
        f"Access your full monitoring dashboard:\n{DASHBOARD_URL}\n\n"
        "Features: Overview, Monitoring, Diagnostics, Agents, Settings",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    if not is_authorized(update.effective_user.id):
        return

    await update.message.reply_text(
        "🤖 *AutoMaint Bot — Command Reference*\n\n"
        "📊 *Commands*\n"
        "/start — Main menu with quick actions\n"
        "/status — Agent status & health score\n"
        "/metrics — CPU, Memory, Disk, Network\n"
        "/alerts — Recent alerts & warnings\n"
        "/diagnostics — Service health check\n"
        "/agents — CrewAI agent status\n"
        "/dashboard — Open web dashboard\n"
        "/help — This help message\n\n"
        "💬 *Natural Language*\n"
        "You can also ask questions like:\n"
        "• _How's the system?_\n"
        "• _Any critical alerts?_\n"
        "• _Check CPU_\n"
        "• _What agents are running?_\n"
        "• _Show me diagnostics_\n"
        "• _Is everything okay?_",
        parse_mode="Markdown",
    )


# --- Inline Button Callbacks ---

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline keyboard button presses."""
    query = update.callback_query
    await query.answer()

    if not is_authorized(query.from_user.id):
        await query.edit_message_text("⛔ Unauthorized.")
        return

    data = query.data

    # Re-use the command handlers but edit the message
    fake_update = type("FakeUpdate", (), {
        "effective_user": query.from_user,
        "message": type("FakeMessage", (), {
            "reply_text": query.edit_message_text,
        })(),
    })()

    handlers = {
        "menu": start_cmd,
        "status": status_cmd,
        "metrics": metrics_cmd,
        "alerts": alerts_cmd,
        "diagnostics": diagnostics_cmd,
        "agents": agents_cmd,
        "dashboard": dashboard_cmd,
        "help": help_cmd,
    }

    handler = handlers.get(data)
    if handler:
        # For menu, we need full reply, not edit
        if data == "menu":
            keyboard = [
                [
                    InlineKeyboardButton("📊 Status", callback_data="status"),
                    InlineKeyboardButton("🖥 Metrics", callback_data="metrics"),
                ],
                [
                    InlineKeyboardButton("🔔 Alerts", callback_data="alerts"),
                    InlineKeyboardButton("🩺 Diagnostics", callback_data="diagnostics"),
                ],
                [
                    InlineKeyboardButton("🤖 Agents", callback_data="agents"),
                    InlineKeyboardButton("⚙️ Settings", callback_data="settings"),
                ],
                [
                    InlineKeyboardButton("🌐 Dashboard", callback_data="dashboard"),
                    InlineKeyboardButton("❓ Help", callback_data="help"),
                ],
            ]
            await query.edit_message_text(
                "🤖 *AutoMaint Bot* — Your AI Maintenance Assistant\n\n"
                "Tap a button or ask me anything about your systems.",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup(keyboard),
            )
        elif data == "settings":
            await query.edit_message_text(
                "⚙️ *Settings*\n\n"
                "Configure settings via the web dashboard:\n"
                f"{DASHBOARD_URL}/#settings\n\n"
                "• Alert thresholds (CPU/Memory/Disk)\n"
                "• Auto-remediation toggle\n"
                "• Monitoring interval\n"
                "• Notification channels",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🌐 Open Settings", url=f"{DASHBOARD_URL}/#settings")],
                    [InlineKeyboardButton("🏠 Menu", callback_data="menu")],
                ]),
            )
        else:
            await handler(fake_update, context)


# --- Natural Language Handler ---

KEYWORD_MAP = {
    "status": ["status", "how", "health", "doing", "running", "alive", "okay", "ok", "system"],
    "metrics": ["cpu", "memory", "disk", "ram", "usage", "resource", "load", "performance", "network", "bandwidth"],
    "alerts": ["alert", "warning", "critical", "error", "problem", "issue", "wrong", "trouble", "fire"],
    "diagnostics": ["diagnostic", "service", "latency", "health check", "check", "diagnose", "slow", "degraded"],
    "agents": ["agent", "crew", "researcher", "coder", "reviewer", "bot", "ai", "task"],
    "dashboard": ["dashboard", "web", "ui", "interface", "page", "site", "url", "link"],
    "help": ["help", "command", "what can", "features", "how to"],
}


async def natural_language(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle natural language messages."""
    if not is_authorized(update.effective_user.id):
        await update.message.reply_text("⛔ Unauthorized.")
        return

    text = update.message.text.lower()

    # Match keywords to commands
    best_match = None
    best_score = 0

    for command, keywords in KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_match = command

    if best_match and best_score > 0:
        handler_map = {
            "status": status_cmd,
            "metrics": metrics_cmd,
            "alerts": alerts_cmd,
            "diagnostics": diagnostics_cmd,
            "agents": agents_cmd,
            "dashboard": dashboard_cmd,
            "help": help_cmd,
        }
        handler = handler_map.get(best_match, help_cmd)
        await handler(update, context)
    else:
        # Default: show quick status + suggestion
        agent = get_agent_status()
        keyboard = [
            [
                InlineKeyboardButton("📊 Full Status", callback_data="status"),
                InlineKeyboardButton("💬 Help", callback_data="help"),
            ],
        ]
        await update.message.reply_text(
            f"🤔 Not sure what you need. Here's a quick check:\n\n"
            f"🟢 Agent is *{agent['status'].title()}* — Health: *{agent['health_score']}%*\n\n"
            f"Try asking about: _status, metrics, alerts, diagnostics, agents_\n"
            f"Or type /help for all commands.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )


# --- Error Handler ---

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    """Log errors."""
    logger.error(f"Exception while handling an update: {context.error}")


# --- Main ---

def run_bot():
    """Build and run the Telegram bot."""
    if not BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not set. Get one from @BotFather on Telegram.")
        print("   Then set it: export TELEGRAM_BOT_TOKEN=your-token-here")
        return

    print(f"🤖 Starting AutoMaint Telegram Bot...")
    print(f"   Token: {BOT_TOKEN[:10]}...")
    print(f"   Dashboard: {DASHBOARD_URL}")
    print(f"   Authorized users: {AUTHORIZED_USERS or 'All (no restriction)'}")

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # Register command handlers
    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CommandHandler("status", status_cmd))
    app.add_handler(CommandHandler("metrics", metrics_cmd))
    app.add_handler(CommandHandler("alerts", alerts_cmd))
    app.add_handler(CommandHandler("diagnostics", diagnostics_cmd))
    app.add_handler(CommandHandler("agents", agents_cmd))
    app.add_handler(CommandHandler("dashboard", dashboard_cmd))
    app.add_handler(CommandHandler("help", help_cmd))

    # Inline button callbacks
    app.add_handler(CallbackQueryHandler(button_callback))

    # Natural language handler (must be last)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, natural_language))

    # Error handler
    app.add_error_handler(error_handler)

    print("✅ Bot is running! Press Ctrl+C to stop.")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    run_bot()
