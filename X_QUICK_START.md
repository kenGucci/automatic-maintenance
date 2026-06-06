# Quick Start: X Integration for @Auto_Mend

## 🚀 Get Started in 5 Minutes

### Step 1: Get X API Credentials (5-10 minutes)

1. Visit https://developer.twitter.com/
2. Sign in with your @Auto_Mend account
3. Apply for a **Hobby** developer account (FREE)
4. Create a Project named "Auto Mend"
5. Create an App named "auto-mend-bot"
6. **Copy all 4 credentials** (you'll only see secrets once!):
   - API Key
   - API Key Secret
   - Access Token
   - Access Token Secret

### Step 2: Configure Your Project

1. Open `.env` file in your project
2. Add your credentials:

```env
# --- X (Twitter) Integration ---
X_API_KEY=paste-your-api-key-here
X_API_KEY_SECRET=paste-your-api-key-secret-here
X_ACCESS_TOKEN=paste-your-access-token-here
X_ACCESS_TOKEN_SECRET=paste-your-access-token-secret-here
X_POST_UPDATES=true
X_POST_INTERVAL=3600000
X_HANDLE=@Auto_Mend
```

3. Save the file

### Step 3: Install Dependencies

```bash
# For Python bot (recommended for initial setup)
pip3 install python-dotenv

# Optional: For actual X API posting
pip3 install requests requests-oauthlib
```

### Step 4: Test the Bot

```bash
# Test with simulated posts (no API needed)
python3 x_bot.py

# You should see simulated posts in the output
```

### Step 5: Make Your First Real Posts

Once you have API credentials configured:

```bash
# Run the initial posts script
python3 initial_posts.py

# This will create 5 introductory posts:
# 1. Introduction to Auto Mend
# 2. Capabilities overview
# 3. First system health check
# 4. Architecture explanation
# 5. Getting started guide
```

## 📝 Post Templates

### System Health Update
```
✅ Healthy System Health Report

📊 Health Score: 95%
💻 CPU: 32.5%
🧠 Memory: 58.3%
💾 Disk: 45.2%

All systems operational!

#AutoMend #SystemMonitoring #DevOps
```

### Critical Alert
```
🚨 CRITICAL ALERT

CPU usage exceeded 90%

Metric: CPU Usage
Value: 95%

⚡ Auto-remediation triggered

#SystemAlert #AutoMend #Monitoring
```

### Maintenance Complete
```
✅ Maintenance Task Complete

Task: Disk Cleanup
Status: Completed
Duration: 5420ms

🔧 Keeping your systems running smoothly!

#Maintenance #Automation #AutoMend
```

## 🎯 Recommended Posting Strategy

### Daily Posts (Automated)
- **Morning**: System health status
- **Afternoon**: Tips or insights
- **Evening**: Daily summary

### Event-Driven Posts (Automatic)
- Critical alerts (immediate)
- Major maintenance tasks (on completion)
- System milestones (weekly)

### Manual Posts (You)
- Feature announcements
- Community engagement
- Behind-the-scenes content

## 📊 Rate Limits (Hobby Tier - FREE)

- **1,500 posts per month** (~50 per day)
- **10,000 reads per month**
- Recommended: 1-3 posts per day

## 🔧 Advanced Configuration

### Post Frequency
```env
# Post every hour (3600000 ms)
X_POST_INTERVAL=3600000

# Post every 30 minutes
X_POST_INTERVAL=1800000

# Post every 2 hours
X_POST_INTERVAL=7200000
```

### Disable X Posting
```env
X_POST_UPDATES=false
```

## 🐛 Troubleshooting

### "X Bot is not initialized"
- Check that all 4 credentials are in `.env`
- Make sure `X_POST_UPDATES=true`
- Verify credentials on https://developer.twitter.com/

### Posts not appearing on X
- Check X API rate limits
- Verify app permissions are set to "Read and Write"
- Check the console for error messages

### Authentication errors
- Regenerate your API keys
- Make sure app permissions include "Read and Write"
- Wait 5 minutes after changing permissions

## 📚 Next Steps

1. ✅ Read [X_API_SETUP.md](X_API_SETUP.md) for detailed setup
2. ✅ Test with `python3 x_bot.py`
3. ✅ Create initial posts with `python3 initial_posts.py`
4. ✅ Monitor your posts on https://x.com/Auto_Mend
5. ✅ Integrate with your maintenance workflow

## 💡 Pro Tips

- Use emojis for better engagement
- Include relevant hashtags (#DevOps, #Automation, #AI)
- Post consistently but don't spam
- Engage with replies and mentions
- Share interesting maintenance insights
- Post screenshots of your dashboard
- Celebrate system uptime milestones!

## 🆘 Need Help?

- X API Documentation: https://developer.twitter.com/en/docs
- Project Issues: https://github.com/kenGucci/automatic-maintenance/issues
- Follow: https://x.com/Auto_Mend
