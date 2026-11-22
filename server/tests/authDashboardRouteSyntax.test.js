const { spawnSync } = require('child_process');
const path = require('path');

test('auth, OTP auth and dashboard route modules pass syntax checks', () => {
  for (const file of ['auth.js', 'otpAuth.js', 'dashboard.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(__dirname, '../routes', file)], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  }
});
