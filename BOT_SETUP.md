# Bot Setup Guide

This guide will help you set up the Telegram bot for Automatic Maintenance.

## Prerequisites

- Python 3.10+
- A Telegram account
- The `python-telegram-bot` package

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `AutoMaint Bot`
4. Choose a username: `your_automaint_bot` (must end in `bot`)
5. BotFather will give you a **token** — save it!

## Step 2: Get Your Chat ID

1. Search for **@userinfobot** on Telegram
2. Send any message — it will reply with your Chat ID
3. Save this ID for authorization

## Step 3: Install Dependencies

```bash
pip install python-telegram-bot
```

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your bot token and chat ID:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_AUTHORIZED_USERS=your-chat-id-here
   DASHBOARD_URL=http://127.0.0.1:8080
   ```

## Step 5: Run the Bot

```bash
# Set environment variables
export TELEGRAM_BOT_TOKEN=your-token
export TELEGRAM_AUTHORIZED_USERS=your-chat-id

# Start the bot
python3 telegram_bot.py
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Main menu with quick action buttons |
| `/status` | Agent status & health score |
| `/metrics` | CPU, Memory, Disk, Network stats with visual bars |
| `/alerts` | Recent alerts and warnings |
| `/diagnostics` | Service health check & latency |
| `/agents` | CrewAI agent status |
| `/dashboard` | Link to web dashboard |
| `/help` | Full command reference |

## Natural Language

You can also ask questions in plain English:

- "How's the system doing?"
- "Any critical alerts?"
- "Check CPU usage"
- "What agents are running?"
- "Show me diagnostics"
- "Is everything okay?"

## Features

- **Inline Keyboards** — Tap buttons to navigate between views
- **Visual Bars** — CPU/Memory/Disk shown as progress bars
- **Color Coding** — 🟢 Normal, 🟡 Warning, 🔴 Critical
- **Authorization** — Restrict access to specific Telegram users
- **Natural Language** — Ask questions without memorizing commands
- **Dashboard Link** — One-tap access to the full web dashboard

## Troubleshooting

### Bot doesn't respond
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check that the bot is running: `python3 telegram_bot.py`
- Ensure no other instance is using the same token

### "Unauthorized" message
- Add your Telegram chat ID to `TELEGRAM_AUTHORIZED_USERS`
- Get your chat ID from @userinfobot

### Bot initialization fails
- Install dependencies: `pip install python-telegram-bot`
- Check your `.env` file syntax
- Verify internet connection

## Security Notes

- **Never** commit your `.env` file with the bot token
- Restrict bot access using `TELEGRAM_AUTHORIZED_USERS`
- Rotate your bot token if compromised (via @BotFather `/revoke`)
- Keep `TELEGRAM_BOT_TOKEN` out of version control
