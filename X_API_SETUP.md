# X (Twitter) API Setup Guide for @Auto_Mend

## Step 1: Apply for X Developer Account

1. Go to https://developer.twitter.com/
2. Click "Sign Up" or "Sign In" with your @Auto_Mend account
3. Choose "Hobby" or "Basic" tier (Hobby is free, Basic is $100/month)
4. Fill out the application:
   - **Use case**: Describe your automatic maintenance project
   - **Example description**: "Building an autonomous AI maintenance system that monitors, diagnoses, and optimizes infrastructure. Using X API to post system health updates, alerts, and maintenance reports."

## Step 2: Create a Project & App

1. After approval, go to https://developer.twitter.com/en/portal/dashboard
2. Click "Create Project"
   - Project name: `Auto Mend`
   - Use case: `Making a bot`
   - Description: `Automated infrastructure maintenance alerts and updates`
3. Create an App within the project:
   - App name: `auto-mend-bot`
4. **Save your credentials immediately** (you'll only see the secret once!)

## Step 3: Get Your API Keys

You'll need these 4 credentials:
- **API Key** (Consumer Key)
- **API Key Secret** (Consumer Secret)
- **Access Token**
- **Access Token Secret**

## Step 4: Configure App Permissions

1. Go to your App settings
2. Under "App permissions", set to **Read and Write**
3. Under "User authentication settings", enable:
   - **OAuth 1.0a** with **Read and Write**
   - Callback URL: `http://localhost:8080/auth/twitter/callback`
   - Website URL: `https://x.com/Auto_Mend`

## Step 5: Add Credentials to Your Project

After getting your keys, add them to your `.env` file:

```env
# --- X (Twitter) Integration ---
X_API_KEY=your-api-key-here
X_API_KEY_SECRET=your-api-key-secret-here
X_ACCESS_TOKEN=your-access-token-here
X_ACCESS_TOKEN_SECRET=your-access-token-secret-here
X_POST_UPDATES=true
X_POST_INTERVAL=3600000
```

## Step 6: Test Your Setup

Once credentials are configured, you can test with:
```bash
node src/integration/XClient.js
# or
python3 x_bot.py
```

## Rate Limits (Hobby Tier - Free)

- **Posts**: 1,500 per month
- **Reads**: 10,000 per month
- **Post frequency**: Recommended 1-3 posts per day

## Recommended Post Types for @Auto_Mend

1. **System Health Updates** - Daily status reports
2. **Critical Alerts** - Immediate notifications of issues
3. **Maintenance Reports** - Weekly summaries
4. **Tips & Insights** - Maintenance best practices
5. **Project Updates** - New features and improvements

## Need Help?

- X API Docs: https://developer.twitter.com/en/docs
- Twitter API v2: https://developer.twitter.com/en/docs/twitter-api
