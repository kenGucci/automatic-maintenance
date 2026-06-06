"""
Initial Posts Script - First posts for @Auto_Mend
Run this script to create your first posts on X after setting up API credentials
"""

import os
from dotenv import load_dotenv
from x_bot import XBot

load_dotenv()


def create_initial_posts():
    """Create initial posts for @Auto_Mend account"""
    
    bot = XBot()
    status = bot.get_status()
    
    if not status['initialized']:
        print('❌ X Bot is not initialized.')
        print('Please set up your X API credentials first.')
        print('See X_API_SETUP.md for instructions.')
        return
    
    print('=' * 70)
    print('🚀 Creating Initial Posts for @Auto_Mend')
    print('=' * 70)
    
    # Post 1: Introduction
    print('\n📝 Post 1: Introduction')
    intro_post = """🤖 Introducing Auto Mend!

An autonomous AI agent that monitors, diagnoses, and optimizes your systems 24/7.

✨ Features:
• Real-time system monitoring
• Intelligent diagnostics
• Auto-remediation
• Smart alerts

#AI #DevOps #Automation #SystemMonitoring"""
    
    result = bot.post_update(intro_post)
    print(f'   Result: {result}')
    
    # Post 2: Capabilities
    print('\n📝 Post 2: Capabilities')
    capabilities_post = """🔧 What can Auto Mend do?

💻 Monitor CPU, Memory, Disk & Network
🔍 Diagnose system issues automatically
⚡ Auto-fix common problems
📊 Track performance metrics
🚨 Send real-time alerts
🌐 Web dashboard + Telegram + X updates

Your infrastructure, on autopilot! 🚀

#InfrastructureMonitoring #AIOps"""
    
    result = bot.post_update(capabilities_post)
    print(f'   Result: {result}')
    
    # Post 3: First health check
    print('\n📝 Post 3: System Status')
    health_post = """✅ System Status: HEALTHY

Auto Mend is now actively monitoring your infrastructure!

📊 Health Score: 95%
💻 CPU: 32.5%
🧠 Memory: 58.3%
💾 Disk: 45.2%

All systems operational. Monitoring 24/7. 🔍

#SystemHealth #Monitoring #AutoMend"""
    
    result = bot.post_update(health_post)
    print(f'   Result: {result}')
    
    # Post 4: Architecture
    print('\n📝 Post 4: Architecture')
    architecture_post = """🏗️ Auto Mend Architecture:

Built with a dual-stack approach:

⚙️ Node.js - Core monitoring & diagnostics
🐍 Python (CrewAI) - Multi-agent orchestration
🌐 Flask Dashboard - Real-time visualization
📱 Telegram Bot - Chat with your infra
🐦 X Bot - Automated updates

Open source & extensible! 🔧

#OpenSource #TechStack"""
    
    result = bot.post_update(architecture_post)
    print(f'   Result: {result}')
    
    # Post 5: Getting started
    print('\n📝 Post 5: Get Started')
    get_started_post = """🚀 Get Started with Auto Mend!

1️⃣ Clone the repo
2️⃣ Install dependencies (npm + pip)
3️⃣ Configure .env
4️⃣ Start monitoring!

💡 Pro tip: Set up Telegram + X integration for real-time alerts!

GitHub: github.com/kenGucci/automatic-maintenance

#DevOps #Automation"""
    
    result = bot.post_update(get_started_post)
    print(f'   Result: {result}')
    
    print('\n' + '=' * 70)
    print('✅ All initial posts created!')
    print('=' * 70)
    print('\n💡 Tips:')
    print('• Space out posts by a few hours for better engagement')
    print('• Monitor X Analytics to see what resonates')
    print('• Post system health updates regularly')
    print('• Share critical alerts immediately')
    print('• Engage with responses and the DevOps community')


if __name__ == '__main__':
    create_initial_posts()
