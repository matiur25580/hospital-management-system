jest.mock('express', () => ({
  Router: () => ({
    post: jest.fn((path, handler) => {
      global.otpLoginHandlers = global.otpLoginHandlers || {};
      global.otpLoginHandlers[path] = handler;
    })
  })
}));
jest.mock('../models/User', () => ({ findOne: jest.fn() }));
jest.mock('../models/Otp', () => ({ findOne: jest.fn(), deleteMany: jest.fn(), create: jest.fn() }));
jest.mock('../utils/mailer', () => ({ sendOtpEmail: jest.fn() }));
jest.mock('../utils/patientProfile', () => ({ ensurePatientProfile: jest.fn() }));

const User = require('../models/User');
require('../routes/otpAuth');

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

describe('OTP login account enumeration protection', () => {
  beforeEach(() => User.findOne.mockReset());

  test('unknown account, wrong password and role mismatch return identical responses', async () => {
    const outcomes = [];
    User.findOne.mockResolvedValueOnce(null);
    let res = response();
    await global.otpLoginHandlers['/login']({ body: { email: 'missing@example.com', password: 'secret' } }, res, jest.fn());
    outcomes.push({ status: res.statusCode, message: res.body.message });

    User.findOne.mockResolvedValueOnce({ compare: jest.fn().mockResolvedValue(false) });
    res = response();
    await global.otpLoginHandlers['/login']({ body: { email: 'known@example.com', password: 'wrong' } }, res, jest.fn());
    outcomes.push({ status: res.statusCode, message: res.body.message });

    User.findOne.mockResolvedValueOnce({ role: 'Doctor', compare: jest.fn().mockResolvedValue(true) });
    res = response();
    await global.otpLoginHandlers['/login']({ body: { email: 'known@example.com', password: 'secret', role: 'Patient' } }, res, jest.fn());
    outcomes.push({ status: res.statusCode, message: res.body.message });

    expect(outcomes).toEqual([
      { status: 401, message: 'Invalid email or password' },
      { status: 401, message: 'Invalid email or password' },
      { status: 401, message: 'Invalid email or password' }
    ]);
  });
});
