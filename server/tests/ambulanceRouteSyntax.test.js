const { spawnSync } = require('child_process');
const path = require('path');

test('ambulance route module passes syntax checks', () => {
  const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes/ambulance.js')], { encoding: 'utf8' });
  expect(result.status).toBe(0);
});
