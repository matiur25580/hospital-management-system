const { spawn } = require('child_process');
const request = require('supertest');
const path = require('path');
const PORT = 5000;
const base = `http://localhost:${PORT}`;
let proc;
jest.setTimeout(60000);
beforeAll(async () => {
  proc = spawn('node', ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { const r = await request(base).get('/api/ppe'); if ([401, 403, 200].includes(r.status)) break; } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
});
afterAll(() => { if (proc) proc.kill('SIGKILL'); });
describe('Enterprise API checks', () => {
  test('helmet security headers present', async () => {
    const r = await request(base).get('/api/ppe');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
  });
  test('protected routes reject anonymous requests', async () => {
    for (const ep of ['/api/ppe', '/api/cleaning/schedule', '/api/departments', '/api/notices']) {
      const r = await request(base).get(ep);
      expect([401, 403]).toContain(r.status);
    }
  });
  test('rate limit active on auth', async () => {
    const r = await request(base).post('/api/auth/login').send({ email: 'no@user.com', password: 'wrong' });
    expect(r.headers['ratelimit-limit'] || r.headers['x-ratelimit-limit']).toBeDefined();
  });
  test('swagger docs serve', async () => {
    const r = await request(base).get('/api-docs/');
    expect(r.status).toBe(200);
  });
  test('unknown route 404s without crashing', async () => {
    const r = await request(base).get('/api/does-not-exist-xyz');
    expect(r.status).toBe(404);
  });
});
