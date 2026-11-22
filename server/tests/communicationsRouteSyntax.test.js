const { spawnSync } = require('child_process');
const path = require('path');

test('cleaning, PPE, notices, feedback and analytics route modules pass syntax checks', () => {
  for (const file of ['cleaning.js', 'ppe.js', 'notices.js', 'feedback.js', 'analytics.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes', file)], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  }
});
