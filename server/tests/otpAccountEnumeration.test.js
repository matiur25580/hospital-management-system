jest.mock('express', () => ({
  Router: () => ({
    post: jest.fn((path, handler) => {
      global.otpHandlers = global.otpHandlers || {};
      global.otpHandlers[path] = handler;
    })
  })
}));
jest.mock('../models/User', () => ({ findOne: jest.fn() }));
jest.mock('../models/Otp', () => ({ findOne: jest.fn(), deleteMany: jest.fn(), create: jest.fn() }));
jest.mock('../utils/mailer', () => ({ sendOtpEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../utils/patientProfile', () => ({ ensurePatientProfile: jest.fn() }));

const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/mailer');
require('../routes/otpAuth');

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

describe('OTP request account enumeration protection', () => {
  beforeEach(() => {
    User.findOne.mockReset();
    Otp.deleteMany.mockReset().mockResolvedValue({});
    Otp.create.mockReset().mockResolvedValue({});
    sendOtpEmail.mockReset().mockResolvedValue(undefined);
  });

  test('returns the same generic response for a missing password-reset account', async () => {
    User.findOne.mockResolvedValue(null);
    const res = response();
    await global.otpHandlers['/send-otp']({ body: { email: 'missing@example.com', purpose: 'reset' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('If this email is eligible, an OTP will be sent.');
    expect(Otp.create).not.toHaveBeenCalled();
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });

  test('sends a password-reset OTP but returns the same generic response for an existing account', async () => {
    User.findOne.mockResolvedValue({ _id: 'user-1' });
    const res = response();
    await global.otpHandlers['/send-otp']({ body: { email: 'user@example.com', purpose: 'reset' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('If this email is eligible, an OTP will be sent.');
    expect(Otp.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com', purpose: 'reset' }));
    expect(sendOtpEmail).toHaveBeenCalledTimes(1);
  });
});
