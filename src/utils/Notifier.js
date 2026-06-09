const https = require('https');
const { createConnection } = require('net');
const Logger = require('./Logger');

const logger = new Logger('Notifier');

class Notifier {
  constructor(config = {}) {
    this.slackWebhookUrl = config.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    this.emailConfig = {
      host: config.smtpHost || process.env.SMTP_HOST,
      port: parseInt(config.smtpPort || process.env.SMTP_PORT || '587', 10),
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS,
      from: config.emailFrom || process.env.EMAIL_FROM || 'automend@localhost',
      to: config.emailTo || process.env.EMAIL_TO,
    };
    this.enabled = {
      slack: !!this.slackWebhookUrl,
      email: !!(this.emailConfig.host && this.emailConfig.to),
    };
  }

  async sendSlack(message, level = 'info') {
    if (!this.enabled.slack) return;

    const colors = { info: '#36a64f', warning: '#ffcc00', error: '#ff0000', critical: '#ff0000' };
    const payload = {
      attachments: [{
        color: colors[level] || colors.info,
        title: `AutoMend ${level}`,
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }],
    };

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.slackWebhookUrl);
        const postData = JSON.stringify(payload);
        const req = https.request({
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        }, (res) => {
          let body = '';
          res.on('data', (d) => { body += d; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              logger.debug('Slack notification sent');
              resolve();
            } else {
              reject(new Error(`Slack returned ${res.statusCode}: ${body}`));
            }
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async sendEmail(subject, body) {
    if (!this.enabled.email) return;

    const { host, port, user, pass, from, to } = this.emailConfig;
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: text/plain; charset="utf-8"`,
      '',
      body,
    ].join('\r\n');

    return new Promise((resolve, reject) => {
      const sock = createConnection(port, host, () => {
        const send = (cmd) => new Promise((r) => sock.write(cmd + '\r\n', r));
        let step = 0;
        const lines = [];

        sock.setTimeout(10000);
        sock.on('data', (data) => {
          lines.push(data.toString());

          if (step === 0) { step = 1; send(`EHLO automend`); }
          else if (step === 1) { step = 2; send('AUTH LOGIN'); }
          else if (step === 2) { step = 3; send(Buffer.from(user).toString('base64')); }
          else if (step === 3) { step = 4; send(Buffer.from(pass).toString('base64')); }
          else if (step === 4) { step = 5; send(`MAIL FROM:<${from}>`); }
          else if (step === 5) { step = 6; send(`RCPT TO:<${to}>`); }
          else if (step === 6) { step = 7; send('DATA'); }
          else if (step === 7) { step = 8; send(message + '\r\n.'); }
          else if (step === 8) { step = 9; send('QUIT'); }
          else if (step === 9) {
            sock.end();
            logger.debug('Email notification sent');
            resolve();
          }
        });

        sock.on('error', reject);
        sock.on('timeout', () => { sock.destroy(); reject(new Error('SMTP timeout')); });
      });
    });
  }

  async send(subject, body, level = 'info') {
    const promises = [];
    if (this.enabled.slack) promises.push(this.sendSlack(`${subject}: ${body}`, level));
    if (this.enabled.email) promises.push(this.sendEmail(subject, body));
    await Promise.allSettled(promises);
  }
}

module.exports = Notifier;
