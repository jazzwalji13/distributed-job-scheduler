const { calculateRetryDelay } = require('../services/jobService');

describe('calculateRetryDelay', () => {
  test('uses fixed retry delay when configured', () => {
    const delay = calculateRetryDelay({ strategy: 'FIXED', initialDelaySeconds: 15, jitter: false }, 1);
    expect(delay).toBe(15);
  });

  test('uses exponential backoff when configured', () => {
    const delay = calculateRetryDelay(
      { strategy: 'EXPONENTIAL', initialDelaySeconds: 10, multiplier: 2, jitter: false },
      3
    );
    expect(delay).toBe(40);
  });
});
