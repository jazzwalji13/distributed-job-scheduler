const { AppError } = require('../utils/errors');

async function runWebhookJob(payload) {
  if (!payload.url) {
    throw new AppError('Webhook jobs require a url field', 400, 'INVALID_JOB_PAYLOAD');
  }

  const response = await fetch(payload.url, {
    method: payload.method || 'POST',
    headers: {
      'content-type': 'application/json',
      ...(payload.headers || {})
    },
    body: JSON.stringify(payload.body ?? payload.data ?? payload)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new AppError(`Webhook request failed with status ${response.status}`, 502, 'WEBHOOK_FAILED', {
      status: response.status,
      body: text
    });
  }

  return {
    status: response.status,
    body: text
  };
}

function sumNumbers(payload) {
  const numbers = payload.numbers || payload.values || [];
  if (!Array.isArray(numbers)) {
    throw new AppError('sum jobs require an array of numbers', 400, 'INVALID_JOB_PAYLOAD');
  }

  return numbers.reduce((total, value) => total + Number(value || 0), 0);
}

function buildSummary(payload) {
  return {
    summary: `Handled ${payload.title || 'job'} with ${Object.keys(payload).length} top-level fields.`,
    insights: [
      'Payload processed successfully',
      'No external AI service was used',
      'This dummy summary is deterministic and safe'
    ]
  };
}

async function runBatch(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  return {
    count: items.length,
    items: items.map((item, index) => ({
      index,
      input: item,
      output: item
    }))
  };
}

async function delayJob(payload) {
  const durationMs = Number(payload.durationMs || 0);
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  return {
    waitedMs: durationMs
  };
}

const handlers = {
  noop: async (payload) => payload,
  sum: async (payload) => ({ total: sumNumbers(payload) }),
  webhook: runWebhookJob,
  batch: runBatch,
  summary: async (payload) => buildSummary(payload),
  delay: delayJob
};

async function executeJob(job) {
  const payload = job.payload || {};
  const handlerName = String(payload.handler || payload.action || 'noop').toLowerCase();
  const handler = handlers[handlerName] || handlers.noop;

  return handler(payload, job);
}

module.exports = {
  executeJob,
  handlers
};
