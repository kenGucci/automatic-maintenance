"""
X Bot - Posts maintenance updates to @Auto_Mend on X (Twitter)
Integrates with the automatic maintenance system to share system health,
alerts, and maintenance reports automatically.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('XBot')


class XBot:
    """Bot for posting maintenance updates to X (Twitter)"""
    
    def __init__(self):
        self.api_key = os.getenv('X_API_KEY')
        self.api_key_secret = os.getenv('X_API_KEY_SECRET')
        self.access_token = os.getenv('X_ACCESS_TOKEN')
        self.access_token_secret = os.getenv('X_ACCESS_TOKEN_SECRET')
        self.enabled = os.getenv('X_POST_UPDATES', 'true').lower() != 'false'
        self.handle = os.getenv('X_HANDLE', '@Auto_Mend')
        self.post_interval = int(os.getenv('X_POST_INTERVAL', '3600000')) // 1000  # Convert to seconds
        
        self.initialized = False
        
        if not self.enabled:
            logger.info('X Bot is disabled')
            return
        
        if not all([self.api_key, self.api_key_secret, self.access_token, self.access_token_secret]):
            logger.warning('X API credentials not configured. Bot will not post updates.')
            return
        
        self.initialized = True
        logger.info(f'X Bot initialized for {self.handle}')
    
    def post_update(self, message):
        """
        Post an update to X
        
        Args:
            message (str): The message to post (max 280 characters)
            
        Returns:
            dict: Result with success status and tweet ID
        """
        if not self.initialized:
            logger.warning('Cannot post: X Bot not initialized')
            return {'success': False, 'error': 'Not initialized'}
        
        try:
            # Truncate message if needed
            if len(message) > 280:
                message = message[:277] + '...'
            
            logger.info(f'Posting update to X: {message[:50]}...')
            
            # TODO: Implement actual X API call
            # For now, simulate posting
            # You'll need to install: pip install requests requests-oauthlib
            
            result = self._post_to_x(message)
            
            if result.get('success'):
                logger.info(f'Update posted successfully (ID: {result.get("tweet_id")})')
            
            return result
            
        except Exception as e:
            logger.error(f'Failed to post update: {e}')
            return {'success': False, 'error': str(e)}
    
    def post_health_status(self, health_score, metrics):
        """
        Post system health status
        
        Args:
            health_score (float): System health score (0-100)
            metrics (dict): System metrics (cpu, memory, disk)
            
        Returns:
            dict: Result with success status
        """
        if not self.initialized:
            return {'success': False, 'error': 'Not initialized'}
        
        try:
            cpu = metrics.get('cpu', {}).get('usage', 0)
            memory = metrics.get('memory', {}).get('usage', 0)
            disk = metrics.get('disk', {}).get('usage', 0)
            
            if health_score >= 90:
                status = '✅ Healthy'
            elif health_score >= 70:
                status = '⚠️ Warning'
            else:
                status = '🚨 Critical'
            
            message = f"""{status} System Health Report

📊 Health Score: {health_score}%
💻 CPU: {cpu:.1f}%
🧠 Memory: {memory:.1f}%
💾 Disk: {disk:.1f}%

#AutoMend #SystemMonitoring #DevOps"""
            
            return self.post_update(message)
            
        except Exception as e:
            logger.error(f'Failed to post health status: {e}')
            return {'success': False, 'error': str(e)}
    
    def post_critical_alert(self, alert):
        """
        Post critical alert
        
        Args:
            alert (dict): Alert information
            
        Returns:
            dict: Result with success status
        """
        if not self.initialized:
            return {'success': False, 'error': 'Not initialized'}
        
        try:
            message = f"""🚨 CRITICAL ALERT

{alert.get('message', alert.get('type', 'System Alert'))}

Metric: {alert.get('metric', 'Unknown')}
Value: {alert.get('value', 'N/A')}

⚡ Auto-remediation {'triggered' if alert.get('auto_remediated') else 'required'}

#SystemAlert #AutoMend #Monitoring"""
            
            return self.post_update(message)
            
        except Exception as e:
            logger.error(f'Failed to post critical alert: {e}')
            return {'success': False, 'error': str(e)}
    
    def post_maintenance_complete(self, task):
        """
        Post maintenance task completion
        
        Args:
            task (dict): Task information
            
        Returns:
            dict: Result with success status
        """
        if not self.initialized:
            return {'success': False, 'error': 'Not initialized'}
        
        try:
            duration = task.get('duration', 'N/A')
            if duration != 'N/A':
                duration = f"{duration}ms"
            
            message = f"""✅ Maintenance Task Complete

Task: {task.get('name', task.get('type', 'System Maintenance'))}
Status: {task.get('status', 'Completed')}
Duration: {duration}

🔧 Keeping your systems running smoothly!

#Maintenance #Automation #AutoMend"""
            
            return self.post_update(message)
            
        except Exception as e:
            logger.error(f'Failed to post maintenance complete: {e}')
            return {'success': False, 'error': str(e)}
    
    def _post_to_x(self, message):
        """
        Post message to X API
        
        Args:
            message (str): Message to post
            
        Returns:
            dict: Result with success status and tweet ID
        """
        try:
            from requests_oauthlib import OAuth1
            import requests
            
            # Create OAuth1 authentication
            auth = OAuth1(
                self.api_key,
                self.api_key_secret,
                self.access_token,
                self.access_token_secret
            )
            
            # X API v2 endpoint for posting tweets
            url = 'https://api.twitter.com/2/tweets'
            payload = {'text': message}
            
            # Make POST request
            response = requests.post(url, json=payload, auth=auth)
            
            # Check response
            if response.status_code == 201:
                data = response.json()
                tweet_id = data['data']['id']
                logger.info(f'Tweet posted successfully! ID: {tweet_id}')
                return {'success': True, 'tweet_id': tweet_id}
            else:
                error_msg = f'X API error {response.status_code}: {response.text}'
                logger.error(error_msg)
                return {'success': False, 'error': error_msg}
                
        except ImportError:
            logger.error('Missing dependency: pip3 install requests requests-oauthlib')
            return {'success': False, 'error': 'Missing dependencies'}
        except Exception as e:
            logger.error(f'Failed to post to X: {e}')
            return {'success': False, 'error': str(e)}
    
    def get_status(self):
        """Get bot status"""
        return {
            'enabled': self.enabled,
            'initialized': self.initialized,
            'handle': self.handle,
            'post_interval': self.post_interval,
            'configured': all([
                self.api_key,
                self.api_key_secret,
                self.access_token,
                self.access_token_secret
            ])
        }


def main():
    """Main function for testing"""
    print('=' * 60)
    print('🤖 Auto Mend - X Bot')
    print('=' * 60)
    
    bot = XBot()
    status = bot.get_status()
    
    print(f'\nStatus:')
    print(f'  Enabled: {status["enabled"]}')
    print(f'  Initialized: {status["initialized"]}')
    print(f'  Handle: {status["handle"]}')
    print(f'  Configured: {status["configured"]}')
    print(f'  Post Interval: {status["post_interval"]}s')
    
    if status['initialized']:
        print('\n📝 Testing posts...')
        
        # Test health status
        print('\n1. Posting health status...')
        result = bot.post_health_status(85.5, {
            'cpu': {'usage': 45.2},
            'memory': {'usage': 62.8},
            'disk': {'usage': 55.0}
        })
        print(f'   Result: {result}')
        
        # Test critical alert
        print('\n2. Posting critical alert...')
        result = bot.post_critical_alert({
            'type': 'HIGH_CPU',
            'metric': 'CPU Usage',
            'value': '95%',
            'message': 'CPU usage exceeded critical threshold',
            'auto_remediated': True
        })
        print(f'   Result: {result}')
        
        # Test maintenance complete
        print('\n3. Posting maintenance complete...')
        result = bot.post_maintenance_complete({
            'name': 'Disk Cleanup',
            'status': 'Completed',
            'duration': 5420
        })
        print(f'   Result: {result}')
    
    print('\n' + '=' * 60)
    print('✅ X Bot test complete!')
    print('=' * 60)


if __name__ == '__main__':
    main()
