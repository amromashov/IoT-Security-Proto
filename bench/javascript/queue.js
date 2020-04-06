const Bull = require('bull');

const redis = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
  connectTimeout: 180000
  };

const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: false,
};

const limiter = {
  max: 10000,
  duration: 1000,
  bounceBack: false,
};

const settings = {
  lockDuration: 600000,
  stalledInterval: 5000,
  maxStalledCount: 2,
  guardInterval: 5000,
  retryProcessDelay: 30000,
  drainDelay: 5,
};

const bull = new Bull('transactionQueue', { redis, defaultJobOptions, settings, limiter });

module.exports = { bull };
