const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'admin@erp-pme.ma';
const DEFAULT_ADMIN_PASSWORD = 'Admin@1234';

const ensureDefaultAdminUser = async () => {
  const existing = await User.findOne({ email: DEFAULT_ADMIN_EMAIL }).select('+password');

  if (!existing) {
    const created = await User.create({
      nom: 'DOYA',
      prenom: 'ERP',
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      role: 'ADMIN',
    });
    return created;
  }

  existing.nom = 'DOYA';
  existing.prenom = 'ERP';
  existing.role = 'ADMIN';
  existing.actif = true;
  existing.password = DEFAULT_ADMIN_PASSWORD;

  await existing.save();
  return existing;
};

module.exports = {
  ensureDefaultAdminUser,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
};
