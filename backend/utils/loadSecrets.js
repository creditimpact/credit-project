const AWS = require('aws-sdk');
const logger = require('./logger');

async function loadSecrets() {
  const name = process.env.AWS_SECRET_NAME || process.env.AWS_SECRETS_NAME;
  if (!name) return;
  const region = process.env.AWS_REGION || 'us-east-1';
  const client = new AWS.SecretsManager({ region });
  try {
    const data = await client.getSecretValue({ SecretId: name }).promise();
    const secretString = data.SecretString || Buffer.from(data.SecretBinary, 'base64').toString('utf8');
    const secrets = JSON.parse(secretString);
    Object.entries(secrets).forEach(([k, v]) => {
      if (!process.env[k]) process.env[k] = v;
    });
    logger.info('Loaded secrets from AWS Secrets Manager', { secretName: name });
  } catch (err) {
    logger.warn('Failed to load secrets from AWS', { error: err.message });
  }
}

module.exports = loadSecrets;
