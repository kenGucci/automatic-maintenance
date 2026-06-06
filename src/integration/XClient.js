/**
 * XClient - Integration with X (Twitter) API
 * Posts maintenance updates, alerts, and system health reports to @Auto_Mend
 */

const Logger = require('../utils/Logger');
const https = require('https');
const crypto = require('crypto');

const logger = new Logger('XClient');

class XClient {
  constructor(config) {
    this.config = config.x || {};
    this.enabled = this.config.enabled !== false && 
                   process.env.X_POST_UPDATES !== 'false';
    this.apiKey = process.env.X_API_KEY;
    this.apiKeySecret = process.env.X_API_KEY_SECRET;
    this.accessToken = process.env.X_ACCESS_TOKEN;
    this.accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
    this.postInterval = parseInt(process.env.X_POST_INTERVAL) || 3600000; // 1 hour default
    this.handle = process.env.X_HANDLE || '@Auto_Mend';
    this.initialized = false;
  }

  /**
   * Initialize X client and verify credentials
   */
  async initialize() {
    if (!this.enabled) {
      logger.info('X integration is disabled');
      return false;
    }

    try {
      if (!this.apiKey || !this.apiKeySecret || !this.accessToken || !this.accessTokenSecret) {
        logger.warn('X API credentials not configured. Set X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET in .env');
        return false;
      }

      logger.info('Initializing X client...');
      
      // Verify credentials by making a test request
      const isValid = await this._verifyCredentials();
      
      if (isValid) {
        this.initialized = true;
        logger.info('X client initialized successfully', {
          handle: this.handle,
          postInterval: this.postInterval,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to initialize X client', error);
      return false;
    }
  }

  /**
   * Post a maintenance update
   */
  async postUpdate(message) {
    if (!this.initialized) {
      logger.warn('Cannot post: X client not initialized');
      return { success: false, error: 'Not initialized' };
    }

    try {
      // Truncate message to 280 characters if needed
      const truncatedMessage = message.length > 280 ? message.substring(0, 277) + '...' : message;

      logger.info('Posting update to X...', { message: truncatedMessage });

      const result = await this._postTweet(truncatedMessage);
      
      if (result.success) {
        logger.info('Update posted successfully', { tweetId: result.tweetId });
      }

      return result;
    } catch (error) {
      logger.error('Failed to post update', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post system health status
   */
  async postHealthStatus(healthScore, metrics) {
    if (!this.initialized) {
      return { success: false, error: 'Not initialized' };
    }

    try {
      const cpu = metrics?.cpu?.usage || 0;
      const memory = metrics?.memory?.usage || 0;
      const disk = metrics?.disk?.usage || 0;

      const status = healthScore >= 90 ? '✅ Healthy' : 
                     healthScore >= 70 ? '⚠️ Warning' : 
                     '🚨 Critical';

      const message = `${status} System Health Report

📊 Health Score: ${healthScore}%
💻 CPU: ${cpu.toFixed(1)}%
🧠 Memory: ${memory.toFixed(1)}%
💾 Disk: ${disk.toFixed(1)}%

#AutoMend #SystemMonitoring #DevOps`;

      return await this.postUpdate(message);
    } catch (error) {
      logger.error('Failed to post health status', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post critical alert
   */
  async postCriticalAlert(alert) {
    if (!this.initialized) {
      return { success: false, error: 'Not initialized' };
    }

    try {
      const message = `🚨 CRITICAL ALERT

${alert.message || alert.type || 'System Alert'}

Metric: ${alert.metric || 'Unknown'}
Value: ${alert.value || 'N/A'}

⚡ Auto-remediation ${alert.autoRemediated ? 'triggered' : 'required'}

#SystemAlert #AutoMend #Monitoring`;

      return await this.postUpdate(message);
    } catch (error) {
      logger.error('Failed to post critical alert', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post maintenance task completion
   */
  async postMaintenanceComplete(task) {
    if (!this.initialized) {
      return { success: false, error: 'Not initialized' };
    }

    try {
      const message = `✅ Maintenance Task Complete

Task: ${task.name || task.type || 'System Maintenance'}
Status: ${task.status || 'Completed'}
Duration: ${task.duration ? `${task.duration}ms` : 'N/A'}

🔧 Keeping your systems running smoothly!

#Maintenance #Automation #AutoMend`;

      return await this.postUpdate(message);
    } catch (error) {
      logger.error('Failed to post maintenance complete', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get X client status
   */
  async getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      handle: this.handle,
      postInterval: this.postInterval,
      configured: !!(this.apiKey && this.apiKeySecret && this.accessToken && this.accessTokenSecret),
    };
  }

  // --- Private methods ---

  /**
   * Verify X API credentials
   */
  async _verifyCredentials() {
    try {
      // Use OAuth 1.0a to verify credentials
      const url = 'https://api.twitter.com/2/users/me';
      const response = await this._makeOAuthRequest('GET', url);
      
      if (response && response.data) {
        logger.info('X credentials verified', { userId: response.data.id });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Credential verification failed', error);
      return false;
    }
  }

  /**
   * Post a tweet using OAuth 1.0a
   */
  async _postTweet(message) {
    try {
      const url = 'https://api.twitter.com/2/tweets';
      const body = JSON.stringify({ text: message });
      
      const response = await this._makeOAuthRequest('POST', url, body);
      
      if (response && response.data && response.data.id) {
        return { success: true, tweetId: response.data.id };
      }
      
      return { success: false, error: 'Invalid response from X API' };
    } catch (error) {
      logger.error('Failed to post tweet', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Make OAuth 1.0a authenticated request
   */
  async _makeOAuthRequest(method, url, body = null) {
    return new Promise((resolve, reject) => {
      try {
        const oauthParams = this._generateOAuthParams(method, url, body);
        const header = this._buildOAuthHeader(oauthParams);

        const options = {
          method: method,
          headers: {
            'Authorization': header,
            'Content-Type': 'application/json',
          },
        };

        const req = https.request(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(response);
              } else {
                reject(new Error(`X API error: ${res.statusCode} - ${data}`));
              }
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on('error', reject);
        
        if (body) {
          req.write(body);
        }
        
        req.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate OAuth 1.0a parameters
   */
  _generateOAuthParams(method, url, body) {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('base64');
    
    return {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: this.accessToken,
      oauth_version: '1.0',
    };
  }

  /**
   * Build OAuth header
   */
  _buildOAuthHeader(params) {
    const encodedParams = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ');
    
    return `OAuth ${encodedParams}`;
  }
}

module.exports = XClient;
