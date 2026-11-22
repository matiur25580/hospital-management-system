const { spawnSync } = require('child_process');
const path = require('path');

test('vitals and lab route modules pass syntax checks', () => {
  for (const file of ['vitals.js', 'lab.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes', file)], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  }
});
