# Discord Bot Setup Guide

This guide will help you set up the Discord bot integration for Automatic Maintenance.

## Prerequisites

- Node.js 16+
- A Discord server (guild)
- Discord Developer Portal access

## Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Automatic Maintenance Bot")
4. Go to the "Bot" section
5. Click "Add Bot"
6. Under TOKEN, click "Copy" to copy your bot token

## Step 2: Configure Bot Permissions

In the Developer Portal:

1. Go to "OAuth2" → "URL Generator"
2. Select these scopes:
   - `bot`
3. Select these permissions:
   - Send Messages
   - Read Messages/View Channels
   - Embed Links
   - Read Message History
   - Mention @everyone, @here, and All Roles

4. Copy the generated URL and open it in your browser to invite the bot to your server

## Step 3: Get Your IDs

### Guild ID (Server ID):
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server name and select "Copy Server ID"

### Alert Channel ID:
1. Right-click the channel where you want alerts
2. Select "Copy Channel ID"

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your values:
   ```env
   DISCORD_TOKEN=your_bot_token
   DISCORD_GUILD_ID=your_server_id
   DISCORD_ALERT_CHANNEL=your_channel_id
   ```

## Step 5: Install Discord.js

```bash
npm install discord.js
```

## Step 6: Enable the Bot

In your main configuration or `index.js`, ensure the Discord bot is initialized:

```javascript
const DiscordBot = require('./src/bot/DiscordBot');
const bot = new DiscordBot(config, agent);
await bot.initialize();
```

## Available Commands

Once the bot is running, use these commands in Discord:

| Command | Usage | Description |
|---------|-------|-------------|
| `!status` | `!status` | Check current system status |
| `!maintenance` | `!maintenance <start\|stop\|schedule>` | Control maintenance tasks |
| `!diagnostics` | `!diagnostics` | Run system diagnostics |
| `!logs` | `!logs [count]` | View recent logs |
| `!help` | `!help` | Display help message |
| `!ping` | `!ping` | Check bot responsiveness |
| `!info` | `!info` | Get bot information |

## Troubleshooting

### Bot doesn't respond to commands
- Ensure the bot has message permissions in the channel
- Check that the bot token is correct
- Verify the bot is online (check Discord)

### "discord.js not installed" error
```bash
npm install discord.js
```

### No permission to execute command
- Check bot permissions in Server Settings → Roles
- Ensure the bot role is high enough in the role hierarchy

### Bot goes offline
- Check your bot token is correct
- Verify internet connection
- Check logs for errors

## Security Notes

- **Never** commit your `.env` file with real tokens
- Use environment variables for sensitive data
- Rotate your bot token regularly if compromised
- Restrict bot access to specific channels if needed

## Advanced Configuration

Edit `config/discord.config.js` to customize:
- Alert thresholds (CPU, Memory, Disk usage)
- Scheduled tasks
- Bot activity status
- Features enabled/disabled

## Support

For issues:
1. Check the logs: `npm run dev`
2. Verify your configuration matches the setup guide
3. Ensure all environment variables are set
4. Check Discord Bot permissions
