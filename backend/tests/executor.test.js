const { executeJob } = require('../workers/executor');

describe('job executor', () => {
  test('computes sums for sum jobs', async () => {
    const result = await executeJob({
      payload: {
        handler: 'sum',
        numbers: [1, 2, 3, 4]
      }
    });

    expect(result.total).toBe(10);
  });

  test('returns a deterministic summary', async () => {
    const result = await executeJob({
      payload: {
        handler: 'summary',
        title: 'Daily import'
      }
    });

    expect(result.summary).toContain('Daily import');
  });
});
