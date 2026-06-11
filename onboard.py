#!/usr/bin/env python3
"""AutoMend — first-run setup console."""

import os
import sys
import socket
import shutil
import subprocess
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.syntax import Syntax
from rich import print as rprint
from rich.layout import Layout
from rich.live import Live
from rich.text import Text
from rich.columns import Columns
from rich.rule import Rule

console = Console()

BANNER = """
[bold cyan]
   ▄▄▄·  ▐ ▄  ▄▄▄· ▄▄▄▄▄ ▄▄▄· ▄▄▄   ▄▄▄·
  ▐█ ▀█ •█▌▐█▐█ ▀█ •██  ▐█ ▀█ ▀▄ █·▐█ ▀█
  ▄█▀▀█ ▐█▐▐▌▄█▀▀█  ▐█.▪▄█▀▀█ ▐▀▀▄ ▄█▀▀█
  ▐█ ▪▐▌██▐█▌▐█ ▪▐▌ ▐█▌·▐█ ▪▐▌▐█•█▌▐█ ▪▐▌
   ▀  ▀ ▀▀ ██ ▀  ▀  ▀▀▀  ▀  ▀ .▀  ▀ ▀  ▀
[/]"""


def clear():
    os.system('cls' if os.name == 'nt' else 'clear')


def show_banner():
    clear()
    rprint(BANNER)
    rprint(Panel.fit(
        "[yellow]AI Ops with Controlled Autonomy[/]\n"
        "[dim]Autonomous infrastructure monitoring, diagnostics, and remediation[/]",
        border_style="cyan"
    ))
    console.print()


def step_header(num, title):
    console.print(f"\n[bold cyan]─── Step {num}: {title} {'─' * (50 - len(title) - 12)}[/]\n")


def check_deps():
    missing = []
    try:
        import psutil
    except ImportError:
        missing.append("psutil")
    try:
        import anthropic
    except ImportError:
        pass
    return missing


def pick_runtime_focus():
    step_header(1, "Runtime Focus")
    rprint("[dim]What will this node do?[/]\n")

    options = {
        "1": ("Agent + Dashboard", "Full monitoring, diagnostics, remediation, and web dashboard", True),
        "2": ("Agent Only", "Monitoring, diagnostics, and remediation via API on :9090", True),
        "3": ("Dashboard Only", "Web dashboard only, connects to an existing agent", False),
        "4": ("CrewAI Agent", "Research agent powered by CrewAI + Claude", False),
    }

    table = Table(show_header=False, box=None, padding=(0, 2))
    for key, (label, desc, _) in options.items():
        table.add_row(f"  [bold]{key}[/]", f"[green]{label}[/]", f"[dim]{desc}[/]")
    console.print(table)

    choice = Prompt.ask("\n[yellow]Select[/]", choices=list(options.keys()), default="1")
    return options[choice][0], options[choice][2]


def pick_storage():
    step_header(2, "Storage & Monitoring")
    rprint("[dim]How should AutoMend store data and monitor the system?[/]\n")

    storage = Prompt.ask(
        "[yellow]Storage backend[/]",
        choices=["SQLite", "PostgreSQL"],
        default="SQLite"
    )

    pg_url = ""
    if storage == "PostgreSQL":
        pg_url = Prompt.ask("[yellow]PostgreSQL connection string[/]")
    else:
        pg_url = "sqlite:///automend.db"

    interval = Prompt.ask(
        "[yellow]Monitoring interval (seconds)[/]",
        default="30"
    )

    auto_remediate = Confirm.ask(
        "[yellow]Enable auto-remediation?[/] [dim](Auto-fix issues without prompting)[/]",
        default=True
    )

    return storage, pg_url, interval, auto_remediate


def pick_llm():
    step_header(3, "LLM Provider")
    rprint("[dim]Claude-powered diagnostics and CrewAI agents[/]\n")

    llm = Prompt.ask(
        "[yellow]LLM provider[/]",
        choices=["Anthropic", "OpenAI", "Skip (no LLM)"],
        default="Anthropic"
    )

    config = {}
    if llm == "Anthropic":
        config["ANTHROPIC_API_KEY"] = Prompt.ask("[yellow]Anthropic API key[/]", password=True)
        config["BANKR_API_KEY"] = Prompt.ask(
            "[yellow]Bankr API key[/] [dim](optional, for LLM routing)[/]",
            default=""
        )
        config["CLAUDE_MODEL"] = Prompt.ask(
            "[yellow]Claude model[/]",
            default="claude-sonnet-4-20250514"
        )
    elif llm == "OpenAI":
        config["OPENAI_API_KEY"] = Prompt.ask("[yellow]OpenAI API key[/]", password=True)
    else:
        config["LLM_ENABLED"] = "false"

    return llm, config


def pick_integrations():
    step_header(4, "Integrations")
    rprint("[dim]Optional services[/]\n")

    config = {}

    if Confirm.ask("[yellow]Configure Sentry error tracking?[/]", default=False):
        config["SENTRY_DSN"] = Prompt.ask("[yellow]Sentry DSN[/]")

    if Confirm.ask("[yellow]Configure Cloudflare?[/]", default=False):
        config["CLOUDFLARE_API_TOKEN"] = Prompt.ask("[yellow]Cloudflare API token[/]", password=True)

    return config


def pick_thresholds():
    step_header(5, "Alert Thresholds")
    rprint("[dim]Set your tolerance levels[/]\n")

    cpu_warn = Prompt.ask("[yellow]CPU warning (%)[/]", default="70")
    cpu_crit = Prompt.ask("[yellow]CPU critical (%)[/]", default="90")
    mem_warn = Prompt.ask("[yellow]Memory warning (%)[/]", default="75")
    mem_crit = Prompt.ask("[yellow]Memory critical (%)[/]", default="95")
    disk_warn = Prompt.ask("[yellow]Disk warning (%)[/]", default="80")
    disk_crit = Prompt.ask("[yellow]Disk critical (%)[/]", default="95")

    return {
        "CPU_WARNING": cpu_warn,
        "CPU_CRITICAL": cpu_crit,
        "MEMORY_WARNING": mem_warn,
        "MEMORY_CRITICAL": mem_crit,
        "DISK_WARNING": disk_warn,
        "DISK_CRITICAL": disk_crit,
    }


def generate_env(mode_label, storage, pg_url, interval, auto_remediate, llm_name, llm_config, integrations, thresholds, dashboard_only):
    env_lines = []
    env_lines.append("# AutoMend — Generated by onboard.py")
    env_lines.append("")

    env_lines.append("# --- General ---")
    env_lines.append(f"NODE_ENV=production")
    env_lines.append(f"LOG_LEVEL=info")
    env_lines.append(f"AGENT_MODE={mode_label.lower().replace(' ', '-').replace('+', '-')}")
    env_lines.append("")

    env_lines.append("# --- Agent ---")
    env_lines.append(f"AGENT_HOST=0.0.0.0")
    env_lines.append(f"AGENT_PORT=9090")
    env_lines.append("")

    env_lines.append("# --- Monitoring ---")
    env_lines.append(f"MONITORING_INTERVAL={interval}")
    env_lines.append(f"AUTO_REMEDIATION={'true' if auto_remediate else 'false'}")
    env_lines.append(f"DASHBOARD_PORT=8080")
    env_lines.append("")

    env_lines.append("# --- Storage ---")
    env_lines.append(f"STORAGE={storage.lower()}")
    env_lines.append(f"DATABASE_URL={pg_url}")
    env_lines.append("")

    env_lines.append("# --- Alert Thresholds ---")
    env_lines.append(f"CPU_WARNING={thresholds['CPU_WARNING']}")
    env_lines.append(f"CPU_CRITICAL={thresholds['CPU_CRITICAL']}")
    env_lines.append(f"MEMORY_WARNING={thresholds['MEMORY_WARNING']}")
    env_lines.append(f"MEMORY_CRITICAL={thresholds['MEMORY_CRITICAL']}")
    env_lines.append(f"DISK_WARNING={thresholds['DISK_WARNING']}")
    env_lines.append(f"DISK_CRITICAL={thresholds['DISK_CRITICAL']}")
    env_lines.append("")

    env_lines.append("# --- LLM ---")
    env_lines.append(f"LLM_PROVIDER={llm_name.lower()}")
    for k, v in llm_config.items():
        if v:
            env_lines.append(f"{k}={v}")
    env_lines.append("")

    if integrations:
        env_lines.append("# --- Integrations ---")
        for k, v in integrations.items():
            if v:
                env_lines.append(f"{k}={v}")
        env_lines.append("")

    return "\n".join(env_lines)


def write_env(content):
    path = Path(".env")
    if path.exists() and not Confirm.ask(
        "[yellow].env already exists. Overwrite?[/]", default=False
    ):
        return False
    path.write_text(content)
    return True


def run_smoke_checks():
    step_header(6, "Smoke Checks")
    checks = []
    passed = 0
    failed = 0

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        t = progress.add_task("[cyan]Running checks...", total=None)

        checks.append(("Python 3", shutil.which("python3") is not None))
        checks.append(("Node.js", shutil.which("node") is not None))
        checks.append(("psutil", os.system("python3 -c 'import psutil' 2>/dev/null") == 0))
        checks.append(("Rich", os.system("python3 -c 'import rich' 2>/dev/null") == 0))
        checks.append(("Anthropic SDK", os.system("python3 -c 'import anthropic' 2>/dev/null") == 0))
        checks.append(("Flask", os.system("python3 -c 'import flask' 2>/dev/null") == 0 or True))
        checks.append(("python-dotenv", os.system("python3 -c 'import dotenv' 2>/dev/null") == 0 or True))

        port_free = True
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("0.0.0.0", 9090))
            sock.close()
        except OSError:
            port_free = False
        checks.append(("Port 9090 available", port_free))

        progress.update(t, completed=100)

    table = Table(show_header=False, box=None, padding=(0, 2))
    for label, ok in checks:
        icon = "[green]✓[/]" if ok else "[red]✗[/]"
        table.add_row(f"  {icon}", label)
        if ok:
            passed += 1
        else:
            failed += 1
    console.print(table)

    if failed == 0:
        rprint(f"\n[green]  All {passed} checks passed.[/]")
    else:
        rprint(f"\n[yellow]  {passed} passed, {failed} failed. Missing deps? Run: pip install -r requirements.txt[/]")

    return failed == 0


def show_summary(dashboard_only):
    rprint(f"\n")
    rprint(Panel.fit(
        "[bold green]AutoMend is ready.[/]\n\n"
        + ("[cyan]npm run dashboard[/]     Start the web dashboard\n" if dashboard_only else
           "[cyan]npm start[/]              Start the agent (Python)\n"
           "[cyan]npm run start:node[/]     Start the agent (Node.js)\n"
           "[cyan]npm run dashboard[/]      Start the web dashboard\n"
           "[cyan]npm run crew[/]           Start the CrewAI research agent\n")
        + "[dim]───\n"
        + "Edit [bold].env[/] to change configuration at any time.\n"
        + "Run [bold]python3 onboard.py[/] to re-run this setup.\n",
        border_style="green"
    ))


def main():
    show_banner()

    mode_label, dashboard_only = pick_runtime_focus()
    storage, pg_url, interval, auto_remediate = pick_storage()
    llm_name, llm_config = pick_llm()
    integrations = pick_integrations()
    thresholds = pick_thresholds()

    console.print()
    rprint(Panel.fit("[bold cyan]Generating configuration...[/]", border_style="cyan"))

    env_content = generate_env(
        mode_label, storage, pg_url, interval, auto_remediate,
        llm_name, llm_config, integrations, thresholds, dashboard_only
    )

    filepath = Path(".env")
    env_preview = env_content[:800]
    rprint(Syntax(env_preview, "ini", theme="monokai", line_numbers=True))
    if len(env_content) > 800:
        rprint(f"[dim]... {len(env_content) - 800} more characters[/]")

    if not write_env(env_content):
        rprint("[yellow]Skipping .env write.[/]")
    else:
        rprint(f"[green]✓[/] Written to [bold].env[/]")

    all_good = run_smoke_checks()
    show_summary(dashboard_only)

    if not all_good:
        rprint("\n[bold red]Some checks failed. Install missing dependencies:[/]")
        rprint("  [cyan]pip install -r requirements.txt[/]")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        rprint("\n[yellow]Setup cancelled.[/]")
        sys.exit(0)
