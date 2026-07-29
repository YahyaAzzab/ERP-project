const path = require('path');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp-pme';

const User = require('../models/User');
const { ensureDefaultAdminUser, DEFAULT_ADMIN_PASSWORD } = require('../utils/ensureDefaultAdmin');

describe('Default admin bootstrap', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('restores the admin account with the expected password and role', async () => {
    const staleUser = await User.create({
      nom: 'Old',
      prenom: 'Admin',
      email: 'admin@erp-pme.ma',
      password: 'oldpass123',
      role: 'MAGASINIER',
    });

    const fixedUser = await ensureDefaultAdminUser();

    expect(fixedUser.email).toBe('admin@erp-pme.ma');
    expect(fixedUser.role).toBe('ADMIN');

    const reloaded = await User.findById(staleUser._id).select('+password');
    expect(await reloaded.verifierPassword(DEFAULT_ADMIN_PASSWORD)).toBe(true);
    expect(await reloaded.verifierPassword('oldpass123')).toBe(false);
  });
});
