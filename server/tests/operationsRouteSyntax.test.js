const { spawnSync } = require('child_process');
const path = require('path');

test('schedule, roster, gatepass and inventory routes pass syntax checks', () => {
  for (const file of ['schedules.js', 'roster.js', 'gatepass.js', 'inventory.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes', file)], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  }
});
