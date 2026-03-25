require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Client = require('../models/Client');
const User = require('../models/User');

async function runMigration() {
  let clientsCrees = 0;
  let facturesMisesAJour = 0;

  await connectDB();

  try {
    const admin = await User.findOne({ role: 'ADMIN' }).select('_id').lean();

    const facturesLegacy = await mongoose.connection
      .collection('factures')
      .find({
        $or: [{ client: { $exists: false } }, { client: null }],
        clientNom: { $exists: true, $type: 'string', $ne: '' },
      })
      .toArray();

    for (const facture of facturesLegacy) {
      const nom = String(facture.clientNom || '').trim();
      if (!nom) continue;

      let client = await Client.findOne({ nom }).select('_id').lean();

      if (!client) {
        const emailSource = String(facture.clientEmail || '').trim().toLowerCase();
        const payload = {
          nom,
          email: emailSource || undefined,
          statut: 'ACTIF',
          creePar: admin?._id,
        };

        const created = await Client.create(payload);
        client = { _id: created._id };
        clientsCrees += 1;
      }

      const updateRes = await mongoose.connection
        .collection('factures')
        .updateOne({ _id: facture._id }, { $set: { client: client._id } });

      if (updateRes.modifiedCount > 0) {
        facturesMisesAJour += 1;
      }
    }

    console.log(`${clientsCrees} clients crees, ${facturesMisesAJour} factures mises a jour`);
  } catch (err) {
    console.error('Migration clients echouee:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

runMigration();
