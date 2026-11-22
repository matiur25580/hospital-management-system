const { spawnSync } = require('child_process');
const path = require('path');

test('HR and operating theatre route modules pass syntax checks', () => {
  for (const file of ['hr.js', 'ot.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes', file)], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  }
});
