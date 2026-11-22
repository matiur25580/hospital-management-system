const { spawnSync } = require('child_process');
const path = require('path');

test('doctor directory route passes syntax checks', () => {
  const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes/doctors.js')], { encoding: 'utf8' });
  expect(result.status).toBe(0);
});
