#!/usr/bin/env python3
"""
Auto Mend - Manual Post Generator
Generates ready-to-post content for @Auto_Mend
No API needed - just copy and paste to X!
"""

import random
from datetime import datetime

def generate_health_post():
    """Generate system health status post"""
    health_scores = [
        (95, "✅ Healthy", "All systems running smoothly!"),
        (92, "✅ Excellent", "Infrastructure in perfect shape!"),
        (88, "✅ Good", "Systems operating normally"),
        (85, "⚠️ Warning", "Minor issues detected"),
    ]
    
    score, status, message = random.choice(health_scores)
    cpu = round(random.uniform(25, 65), 1)
    memory = round(random.uniform(45, 75), 1)
    disk = round(random.uniform(40, 65), 1)
    
    post = f"""{status} System Health Report

📊 Health Score: {score}%
💻 CPU: {cpu}%
🧠 Memory: {memory}%
💾 Disk: {disk}%

{message}

#AutoMend #SystemMonitoring #DevOps #Infrastructure"""
    
    return post


def generate_tip_post():
    """Generate DevOps tip post"""
    tips = [
        "💡 DevOps Tip: Regular log rotation prevents disk space issues and keeps your systems running smoothly. Schedule it weekly! #DevOps #SysAdmin #AutoMend",
        
        "💡 Pro Tip: Monitor your disk I/O, not just usage. High I/O wait can indicate failing hardware before it crashes! #Monitoring #DevOps #AutoMend",
        
        "💡 Best Practice: Set up automated backups BEFORE you need them. Test restoration monthly. #BackupStrategy #DevOps #AutoMend",
        
        "💡 Performance Tip: Use connection pooling for databases. It reduces overhead and improves response times by up to 10x! #Database #DevOps #AutoMend",
        
        "💡 Security Tip: Rotate your API keys every 90 days. Automate it with tools like Auto Mend! #Security #DevOps #Automation",
        
        "💡 Maintenance Tip: Schedule heavy maintenance tasks during off-peak hours (2-5 AM) to minimize user impact. #SysAdmin #AutoMend",
    ]
    
    return random.choice(tips)


def generate_alert_post():
    """Generate example critical alert post"""
    alerts = [
        """🚨 CRITICAL ALERT

CPU usage exceeded 90%

Metric: CPU Usage
Value: 95%

⚡ Auto-remediation triggered
🔧 Scaling up instances...

#SystemAlert #AutoMend #Monitoring""",
        
        """🚨 CRITICAL ALERT

Disk space below critical threshold

Metric: Disk Usage
Value: 97%

⚡ Auto-cleanup initiated
🗑️ Removing old logs and temp files

#SystemAlert #AutoMend #DevOps""",
        
        """🚨 CRITICAL ALERT

Memory usage at dangerous level

Metric: RAM Usage
Value: 92%

⚡ Restarting non-critical services
📉 Memory being freed...

#Monitoring #AutoMend #Infrastructure""",
    ]
    
    return random.choice(alerts)


def generate_maintenance_post():
    """Generate maintenance task completion post"""
    tasks = [
        ("Disk Cleanup", "Freed up 15GB of space"),
        ("Log Rotation", "Compressed 2GB of old logs"),
        ("Security Scan", "No vulnerabilities found"),
        ("Database Optimization", "Improved query speed by 40%"),
        ("Backup Verification", "All backups validated successfully"),
        ("SSL Certificate Check", "All certs valid for 60+ days"),
    ]
    
    task_name, result = random.choice(tasks)
    duration = random.randint(2000, 15000)
    
    post = f"""✅ Maintenance Task Complete

Task: {task_name}
Status: Completed
Result: {result}
Duration: {duration}ms

🔧 Keeping your systems running smoothly!

#Maintenance #Automation #AutoMend #DevOps"""
    
    return post


def generate_intro_post():
    """Generate introductory/about post"""
    intros = [
        """🤖 What is Auto Mend?

An autonomous AI agent that:
• Monitors your infrastructure 24/7
• Diagnoses issues automatically
• Performs self-healing & maintenance
• Sends real-time alerts

Your systems, on autopilot! 🚀

#AI #DevOps #Automation #AutoMend""",
        
        """🔧 Auto Mend Features:

💻 Real-time system monitoring
🔍 Intelligent diagnostics
⚡ Auto-remediation
📊 Performance tracking
🚨 Smart alerts
🌐 Web dashboard
📱 Telegram bot
🐦 X updates

Infrastructure management, simplified!

#DevOps #Monitoring #AutoMend""",
        
        """🏗️ Built with modern tech:

⚙️ Node.js - Core monitoring
🐍 Python (CrewAI) - AI agents
🌐 Flask Dashboard - Real-time UI
📱 Telegram - Chat interface
🐦 X - Automated updates

Open source & extensible! 🔧

#OpenSource #TechStack #AutoMend""",
    ]
    
    return random.choice(intros)


def main():
    """Main function"""
    print("=" * 70)
    print("🤖 Auto Mend - Post Generator")
    print("=" * 70)
    print()
    
    while True:
        print("\n📝 What type of post do you want to generate?")
        print("1. ✅ System Health Report")
        print("2. 💡 DevOps Tip")
        print("3. 🚨 Critical Alert (Example)")
        print("4. ✅ Maintenance Complete")
        print("5. 🤖 About/Introduction")
        print("6. 🎲 Random Post")
        print("7. 🚪 Exit")
        print()
        
        choice = input("Enter your choice (1-7): ").strip()
        
        post = None
        
        if choice == '1':
            post = generate_health_post()
        elif choice == '2':
            post = generate_tip_post()
        elif choice == '3':
            post = generate_alert_post()
        elif choice == '4':
            post = generate_maintenance_post()
        elif choice == '5':
            post = generate_intro_post()
        elif choice == '6':
            generators = [
                generate_health_post,
                generate_tip_post,
                generate_alert_post,
                generate_maintenance_post,
                generate_intro_post,
            ]
            post = random.choice(generators)()
        elif choice == '7':
            print("\n👋 Goodbye! Happy posting! 🚀")
            break
        else:
            print("❌ Invalid choice. Try again.")
            continue
        
        if post:
            print("\n" + "=" * 70)
            print("📋 Your post is ready! (Copy everything below)")
            print("=" * 70)
            print()
            print(post)
            print()
            print("=" * 70)
            print(f"📏 Character count: {len(post)} / 280")
            print("📌 Next: Open https://x.com/Auto_Mend and paste!")
            print("=" * 70)
            
            if len(post) > 280:
                print("\n⚠️  WARNING: Post is over 280 characters!")
                print("💡 Try generating again for a shorter version")
            else:
                print("\n✅ Perfect length! Ready to post!")
            
            print()
            again = input("Generate another post? (y/n): ").strip().lower()
            if again == 'n':
                print("\n👋 Goodbye! Happy posting! 🚀")
                break


if __name__ == '__main__':
    main()
