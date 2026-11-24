jest.mock('express', () => ({
  Router: () => ({
    post: jest.fn((path, handler) => {
      global.otpHandlers = global.otpHandlers || {};
      global.otpHandlers[path] = handler;
    })
  })
}));
jest.mock('../models/User', () => ({ findOne: jest.fn(), create: jest.fn(), deleteOne: jest.fn() }));
jest.mock('../models/Otp', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn(), deleteOne: jest.fn(), deleteMany: jest.fn(), create: jest.fn() }));
jest.mock('../utils/mailer', () => ({ sendOtpEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../utils/patientProfile', () => ({ ensurePatientProfile: jest.fn() }));
const { ensurePatientProfile } = require('../utils/patientProfile');

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
    User.create.mockReset();
    User.deleteOne.mockReset();
    Otp.findOne.mockReset();
    Otp.findOneAndUpdate.mockReset();
    Otp.updateOne.mockReset();
    Otp.deleteOne.mockReset();
    ensurePatientProfile.mockReset();
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
  test('OTP login returns the same generic failure for unknown accounts, wrong passwords and role mismatch', async () => {
    const outcomes = [];
    User.findOne.mockResolvedValueOnce(null);
    let res = response();
    await global.otpHandlers['/login']({ body: { email: 'missing@example.com', password: 'secret' } }, res, jest.fn());
    outcomes.push({ status: res.statusCode, message: res.body.message });

    User.findOne.mockResolvedValueOnce({ compare: jest.fn().mockResolvedValue(false) });
    res = response();
    await global.otpHandlers['/login']({ body: { email: 'known@example.com', password: 'wrong' } }, res, jest.fn());
    outcomes.push({ status: res.statusCode, message: res.body.message });

    User.findOne.mockResolvedValueOnce({ role: 'Doctor', compare: jest.fn().mockResolvedValue(true) });
    res = response();
    await global.otpHandlers['/login']({ body: { email: 'known@example.com', password: 'secret', role: 'Patient' } }, res, jest.fn());
    outcomes.push({ status: res.statusCode, message: res.body.message });

    expect(outcomes).toEqual([
      { status: 401, message: 'Invalid email or password' },
      { status: 401, message: 'Invalid email or password' },
      { status: 401, message: 'Invalid email or password' }
    ]);
  });

});


describe('OTP claim recovery during account writes', () => {
  const validRequest = {
    name: 'Test Patient',
    mobile: '9876543210',
    email: 'patient@example.com',
    dob: '01011990',
    password: 'long-enough-password',
    otp: '123456'
  };

  beforeEach(() => {
    const record = { _id: 'otp-1', otp: '123456', createdAt: new Date() };
    Otp.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(record) });
    Otp.findOneAndUpdate.mockResolvedValue({ _id: 'otp-1' });
    Otp.updateOne.mockResolvedValue({});
    Otp.deleteOne.mockResolvedValue({});
    Otp.deleteMany.mockResolvedValue({});
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'user-1', fullName: 'Test Patient', email: 'patient@example.com', role: 'Patient'
    });
    User.deleteOne.mockResolvedValue({});
    ensurePatientProfile.mockResolvedValue({});
  });

  test('releases the OTP claim when patient profile creation fails', async () => {
    ensurePatientProfile.mockRejectedValue(new Error('profile store unavailable'));
    const res = response();
    const next = jest.fn();

    await global.otpHandlers['/verify-register']({ body: validRequest }, res, next);

    expect(Otp.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'otp-1', otp: '123456', claimToken: { $exists: false } }),
      expect.objectContaining({ $set: expect.objectContaining({ claimToken: expect.any(String) }) }),
      { new: true }
    );
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: 'user-1' });
    expect(Otp.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'otp-1', claimToken: expect.any(String) }),
      { $unset: { claimToken: 1 } }
    );
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('consumes the claimed OTP only after account and patient profile creation succeed', async () => {
    const res = response();
    await global.otpHandlers['/verify-register']({ body: validRequest }, res, jest.fn());

    expect(ensurePatientProfile).toHaveBeenCalled();
    expect(Otp.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'otp-1', claimToken: expect.any(String) })
    );
    expect(res.statusCode).toBe(201);
  });
});
