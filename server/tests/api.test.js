const { spawn } = require('child_process');
const request = require('supertest');
const path = require('path');
const PORT = 5000;
const base = `http://127.0.0.1:${PORT}`;
let proc;
let startupOutput = '';
jest.setTimeout(60000);

beforeAll(async () => {
  proc = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), JWT_SECRET: process.env.JWT_SECRET || 'ci-test-jwt-secret-with-sufficient-entropy' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  proc.stdout.on('data', chunk => { startupOutput += chunk.toString(); });
  proc.stderr.on('data', chunk => { startupOutput += chunk.toString(); });

  for (let i = 0; i < 60; i++) {
    if (proc.exitCode !== null) {
      throw new Error(`API server exited before becoming ready (code ${proc.exitCode}).\n${startupOutput}`);
    }
    try {
      const response = await request(base).get('/api/health');
      if (response.status === 200) return;
    } catch (error) {
      // The server may still be connecting to MongoDB or binding its port.
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  proc.kill('SIGKILL');
  throw new Error(`API server did not become ready within 30 seconds.\n${startupOutput}`);
});

afterAll(() => {
  if (proc && proc.exitCode === null) proc.kill('SIGTERM');
});

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

  test('tokens for deleted accounts cannot access staff or administrator endpoints', async () => {
    const secret = process.env.JWT_SECRET || 'ci-test-jwt-secret-with-sufficient-entropy';
    const token = require('jsonwebtoken').sign(
      { id: '507f1f77bcf86cd799439011', role: 'Admin' },
      secret,
      { expiresIn: '5m' }
    );
    for (const [method, endpoint] of [
      ['get', '/api/admin/stats'],
      ['get', '/api/admin/users'],
      ['post', '/api/staff/seed-management'],
      ['post', '/api/staff/sync-users'],
      ['post', '/api/staff/profiles'],
      ['post', '/api/staff/salary/generate'],
    ]) {
      const response = await request(base)[method](endpoint)
        .set('Authorization', 'Bearer ' + token)
        .send({});
      expect(response.status).toBe(401);
    }
  });

  test('public registration cannot assign staff or administrator roles', async () => {
    const payload = {
      name: 'Demo Patient',
      mobile: '9000000000',
      email: 'role-escalation-test@example.invalid',
      dob: '19900101',
      password: 'DemoPassword123!',
      otp: '123456',
      role: 'Admin',
    };
    const verify = await request(base).post('/api/auth/verify-register').send(payload);
    expect(verify.status).toBe(403);

    const register = await request(base).post('/api/auth/register').send({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      otp: payload.otp,
      role: 'Admin',
    });
    expect(register.status).toBe(400);
  });
});
