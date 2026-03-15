// =============================================================
// backend/src/utils/seed.js
// Peuplement de la base MongoDB avec des données de test réalistes
// =============================================================
// Lancement :  node src/utils/seed.js
// Ou via npm :  npm run seed
// =============================================================

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Import des modèles
const User            = require('../models/User');
const CompteComptable = require('../models/CompteComptable');
const EcritureComptable = require('../models/EcritureComptable');
const Facture         = require('../models/Facture');
const Employe         = require('../models/Employe');
const Conge           = require('../models/Conge');
const FichePaie       = require('../models/FichePaie');
const Fournisseur     = require('../models/Fournisseur');
const Produit         = require('../models/Produit');
const MouvementStock  = require('../models/MouvementStock');

// =====================
// DONNÉES DE TEST
// =====================

const usersData = [
  {
    nom   : 'Administrateur',
    prenom: 'ERP',
    email : 'admin@erp-pme.ma',
    password: 'Admin@1234',
    role  : 'ADMIN',
  },
  {
    nom   : 'Benali',
    prenom: 'Fatima',
    email : 'f.benali@erp-pme.ma',
    password: 'Compta@1234',
    role  : 'COMPTABLE',
  },
  {
    nom   : 'Cherkaoui',
    prenom: 'Youssef',
    email : 'y.cherkaoui@erp-pme.ma',
    password: 'RH@12345678',
    role  : 'RH',
  },
  {
    nom   : 'Idrissi',
    prenom: 'Sara',
    email : 's.idrissi@erp-pme.ma',
    password: 'Mag@12345678',
    role  : 'MAGASINIER',
  },
];

const comptesData = [
  { numero: '101',  libelle: 'Capital social',            type: 'PASSIF'  },
  { numero: '411',  libelle: 'Clients',                   type: 'ACTIF'   },
  { numero: '401',  libelle: 'Fournisseurs',              type: 'PASSIF'  },
  { numero: '512',  libelle: 'Banque',                    type: 'ACTIF'   },
  { numero: '530',  libelle: 'Caisse',                    type: 'ACTIF'   },
  { numero: '606',  libelle: 'Achats fournitures de bureau', type: 'CHARGE' },
  { numero: '611',  libelle: 'Sous-traitance',            type: 'CHARGE'  },
  { numero: '641',  libelle: 'Rémunérations du personnel', type: 'CHARGE' },
  { numero: '701',  libelle: 'Ventes de marchandises',    type: 'PRODUIT' },
  { numero: '706',  libelle: 'Prestations de services',   type: 'PRODUIT' },
  { numero: '213',  libelle: 'Matériel informatique',     type: 'ACTIF'   },
  { numero: '4456', libelle: 'TVA collectée',             type: 'PASSIF'  },
];

const fournisseursData = [
  {
    nom      : 'Bureau Pro SARL',
    email    : 'contact@bureupro.ma',
    telephone: '+212 5 22 34 56 78',
    adresse  : { rue: '12 Rue Ibn Sina', ville: 'Casablanca', codePostal: '20000', pays: 'Maroc' },
  },
  {
    nom      : 'Tech Supplies SA',
    email    : 'ventes@techsupplies.ma',
    telephone: '+212 5 37 89 01 23',
    adresse  : { rue: '5 Avenue Hassan II', ville: 'Rabat', codePostal: '10000', pays: 'Maroc' },
  },
  {
    nom      : 'EcoFournitures',
    email    : 'info@ecofournitures.ma',
    telephone: '+212 5 24 11 22 33',
    adresse  : { rue: '8 Boulevard Mohammed V', ville: 'Marrakech', codePostal: '40000', pays: 'Maroc' },
  },
];

const employesData = [
  {
    matricule  : 'EMP-0001',
    nom        : 'El Amrani',
    prenom     : 'Khalid',
    email      : 'k.elamrani@entreprise.ma',
    telephone  : '+212 6 61 23 45 67',
    poste      : 'Directeur Général',
    departement: 'Direction',
    dateEmbauche: new Date('2018-03-15'),
    salaireBrut: 25000,
    statut     : 'ACTIF',
  },
  {
    matricule  : 'EMP-0002',
    nom        : 'Tazi',
    prenom     : 'Nadia',
    email      : 'n.tazi@entreprise.ma',
    telephone  : '+212 6 62 34 56 78',
    poste      : 'Responsable Comptabilité',
    departement: 'Finance',
    dateEmbauche: new Date('2019-07-01'),
    salaireBrut: 15000,
    statut     : 'ACTIF',
  },
  {
    matricule  : 'EMP-0003',
    nom        : 'Ouali',
    prenom     : 'Hassan',
    email      : 'h.ouali@entreprise.ma',
    telephone  : '+212 6 63 45 67 89',
    poste      : 'Ingénieur Développement',
    departement: 'IT',
    dateEmbauche: new Date('2020-09-14'),
    salaireBrut: 12000,
    statut     : 'ACTIF',
  },
  {
    matricule  : 'EMP-0004',
    nom        : 'Mellouki',
    prenom     : 'Samira',
    email      : 's.mellouki@entreprise.ma',
    telephone  : '+212 6 64 56 78 90',
    poste      : 'Chargée RH',
    departement: 'Ressources Humaines',
    dateEmbauche: new Date('2021-01-10'),
    salaireBrut: 10000,
    statut     : 'ACTIF',
  },
  {
    matricule  : 'EMP-0005',
    nom        : 'Bouazza',
    prenom     : 'Amine',
    email      : 'a.bouazza@entreprise.ma',
    telephone  : '+212 6 65 67 89 01',
    poste      : 'Gestionnaire de Stock',
    departement: 'Logistique',
    dateEmbauche: new Date('2022-04-20'),
    salaireBrut: 7500,
    statut     : 'ACTIF',
  },
];

// =====================
// FONCTION PRINCIPALE
// =====================

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // --- Nettoyage des collections existantes ---
    console.log('\n🗑️  Nettoyage des données existantes...');
    await Promise.all([
      User.deleteMany({}),
      CompteComptable.deleteMany({}),
      EcritureComptable.deleteMany({}),
      Facture.deleteMany({}),
      Employe.deleteMany({}),
      Conge.deleteMany({}),
      FichePaie.deleteMany({}),
      Fournisseur.deleteMany({}),
      Produit.deleteMany({}),
      MouvementStock.deleteMany({}),
    ]);
    console.log('   Collections vidées');

    // --- 1. Utilisateurs ---
    console.log('\n👤 Création des utilisateurs...');
    const users = await User.insertMany(
      await Promise.all(
        usersData.map(async (u) => ({
          ...u,
          password: await bcrypt.hash(u.password, 12),
        }))
      )
    );
    console.log(`   ${users.length} utilisateurs créés`);
    const adminUser = users[0];

    // --- 2. Plan Comptable ---
    console.log('\n📊 Création du plan comptable...');
    const comptes = await CompteComptable.insertMany(comptesData);
    console.log(`   ${comptes.length} comptes créés`);

    const compteMap = {};
    comptes.forEach((c) => { compteMap[c.numero] = c._id; });

    // --- 3. Fournisseurs ---
    console.log('\n🏭 Création des fournisseurs...');
    const fournisseurs = await Fournisseur.insertMany(fournisseursData);
    console.log(`   ${fournisseurs.length} fournisseurs créés`);

    // --- 4. Produits ---
    console.log('\n📦 Création des produits...');
    const produitsData = [
      { reference: 'PROD-0001', designation: 'Ordinateur Portable HP 15"', categorie: 'Informatique', quantiteStock: 15, seuilAlerte: 3, prixUnitaire: 8500, prixAchat: 6500, unite: 'unité', fournisseur: fournisseurs[1]._id },
      { reference: 'PROD-0002', designation: 'Imprimante Laser Brother', categorie: 'Informatique', quantiteStock: 8, seuilAlerte: 2, prixUnitaire: 3200, prixAchat: 2400, unite: 'unité', fournisseur: fournisseurs[1]._id },
      { reference: 'PROD-0003', designation: 'Ramette Papier A4 500 feuilles', categorie: 'Fournitures Bureau', quantiteStock: 120, seuilAlerte: 20, prixUnitaire: 45, prixAchat: 30, unite: 'ramette', fournisseur: fournisseurs[0]._id },
      { reference: 'PROD-0004', designation: 'Stylo Bille BIC (lot 50)', categorie: 'Fournitures Bureau', quantiteStock: 30, seuilAlerte: 5, prixUnitaire: 35, prixAchat: 20, unite: 'lot', fournisseur: fournisseurs[0]._id },
      { reference: 'PROD-0005', designation: 'Classeur A4 Levier (lot 10)', categorie: 'Fournitures Bureau', quantiteStock: 25, seuilAlerte: 5, prixUnitaire: 85, prixAchat: 55, unite: 'lot', fournisseur: fournisseurs[0]._id },
      { reference: 'PROD-0006', designation: 'Écran 27" Dell Ultrasharp', categorie: 'Informatique', quantiteStock: 2, seuilAlerte: 2, prixUnitaire: 5500, prixAchat: 4200, unite: 'unité', fournisseur: fournisseurs[1]._id },
      { reference: 'PROD-0007', designation: 'Chaise de Bureau Ergonomique', categorie: 'Mobilier', quantiteStock: 10, seuilAlerte: 2, prixUnitaire: 1800, prixAchat: 1200, unite: 'unité', fournisseur: fournisseurs[2]._id },
      { reference: 'PROD-0008', designation: 'Bureau Open Space 140cm', categorie: 'Mobilier', quantiteStock: 4, seuilAlerte: 1, prixUnitaire: 2500, prixAchat: 1800, unite: 'unité', fournisseur: fournisseurs[2]._id },
      { reference: 'PROD-0009', designation: 'Toner HP LaserJet (Noir)', categorie: 'Consommables', quantiteStock: 20, seuilAlerte: 5, prixUnitaire: 320, prixAchat: 210, unite: 'unité', fournisseur: fournisseurs[1]._id },
      { reference: 'PROD-0010', designation: 'Clé USB 64Go SanDisk', categorie: 'Informatique', quantiteStock: 3, seuilAlerte: 5, prixUnitaire: 95, prixAchat: 60, unite: 'unité', fournisseur: fournisseurs[1]._id },
    ];

    const produits = await Produit.insertMany(produitsData);
    console.log(`   ${produits.length} produits créés`);

    // --- 5. Employés ---
    console.log('\n👥 Création des employés...');
    const employes = await Employe.insertMany(employesData);
    console.log(`   ${employes.length} employés créés`);

    // --- 6. Congés ---
    console.log('\n🏖️  Création des congés...');
    const congesData = [
      {
        employe  : employes[2]._id,
        type     : 'ANNUEL',
        dateDebut: new Date('2026-02-10'),
        dateFin  : new Date('2026-02-14'),
        statut   : 'APPROUVE',
        motif    : 'Vacances d\'hiver',
        traitePar: users[2]._id,
        dateTraitement: new Date('2026-02-01'),
      },
      {
        employe  : employes[3]._id,
        type     : 'MALADIE',
        dateDebut: new Date('2026-01-20'),
        dateFin  : new Date('2026-01-22'),
        statut   : 'APPROUVE',
        motif    : 'Grippe',
        traitePar: users[2]._id,
        dateTraitement: new Date('2026-01-20'),
      },
      {
        employe  : employes[1]._id,
        type     : 'ANNUEL',
        dateDebut: new Date('2026-04-01'),
        dateFin  : new Date('2026-04-10'),
        statut   : 'EN_ATTENTE',
        motif    : 'Congé annuel spring',
      },
    ];
    const conges = await Conge.insertMany(congesData);
    console.log(`   ${conges.length} congés créés`);

    // --- 7. Fiches de paie (Février 2026) ---
    console.log('\n💰 Création des fiches de paie...');
    const fichesData = employes.map((emp) => {
      const brut        = emp.salaireBrut;
      const cnss        = +(brut * 0.0448).toFixed(2);
      const amo         = +(brut * 0.0226).toFixed(2);
      const retraite    = +(brut * 0.03).toFixed(2);
      const totalRetenues = +(cnss + amo + retraite).toFixed(2);
      const net         = +(brut - totalRetenues).toFixed(2);

      return {
        employe  : emp._id,
        mois     : 2,
        annee    : 2026,
        salaireBrut: brut,
        cotisations: [
          { libelle: 'CNSS', tauxSalarial: 4.48, montantSalarial: cnss, tauxPatronal: 8.98, montantPatronal: +(brut * 0.0898).toFixed(2) },
          { libelle: 'AMO',  tauxSalarial: 2.26, montantSalarial: amo,  tauxPatronal: 4.11, montantPatronal: +(brut * 0.0411).toFixed(2) },
          { libelle: 'Retraite Complémentaire', tauxSalarial: 3.0, montantSalarial: retraite, tauxPatronal: 3.0, montantPatronal: +(brut * 0.03).toFixed(2) },
        ],
        totalCotisationsSalariales: totalRetenues,
        salaireNet: net,
        genereePar: users[2]._id,
      };
    });
    const fiches = await FichePaie.insertMany(fichesData);
    console.log(`   ${fiches.length} fiches de paie créées`);

    // --- 8. Factures ---
    console.log('\n🧾 Création des factures...');
    const facturesData = [
      {
        numero      : 'F-2026-001',
        date        : new Date('2026-01-15'),
        dateEcheance: new Date('2026-02-14'),
        clientNom   : 'Société Alpha SARL',
        clientEmail : 'compta@alpha.ma',
        clientAdresse: 'Casablanca, Maroc',
        lignes: [
          { designation: 'Ordinateur Portable HP 15"', quantite: 2, prixUnitaire: 8500, tvaPercent: 20, produit: produits[0]._id },
          { designation: 'Écran 27" Dell',             quantite: 2, prixUnitaire: 5500, tvaPercent: 20, produit: produits[5]._id },
        ],
        statut  : 'PAYEE',
        creePar : adminUser._id,
      },
      {
        numero      : 'F-2026-002',
        date        : new Date('2026-02-03'),
        dateEcheance: new Date('2026-03-05'),
        clientNom   : 'BetaCorp SA',
        clientEmail : 'achat@betacorp.ma',
        clientAdresse: 'Rabat, Maroc',
        lignes: [
          { designation: 'Chaises ergonomiques', quantite: 5, prixUnitaire: 1800, tvaPercent: 20, produit: produits[6]._id },
          { designation: 'Bureaux open space',   quantite: 3, prixUnitaire: 2500, tvaPercent: 20, produit: produits[7]._id },
        ],
        statut  : 'VALIDEE',
        creePar : adminUser._id,
      },
      {
        numero  : 'F-2026-003',
        date    : new Date('2026-03-01'),
        clientNom: 'Startup Gamma',
        clientEmail: 'finance@gamma.ma',
        lignes: [
          { designation: 'Fournitures bureau — lot mensuel', quantite: 10, prixUnitaire: 250, tvaPercent: 20 },
        ],
        statut  : 'BROUILLON',
        creePar : adminUser._id,
      },
    ];
    const factures = await Facture.insertMany(facturesData);
    console.log(`   ${factures.length} factures créées`);

    // --- 9. Écritures comptables ---
    console.log('\n📒 Création des écritures comptables...');
    const ecrituresData = [
      // Facture F-2026-001 : vente de matériel
      { date: new Date('2026-01-15'), libelle: 'Client Société Alpha — Vente matériel info', montantDebit: 28800, montantCredit: 0,     compte: compteMap['411'],  journal: 'VENTES', reference: 'F-2026-001', saisiePar: adminUser._id },
      { date: new Date('2026-01-15'), libelle: 'Vente matériel info — Produits',              montantDebit: 0,     montantCredit: 24000, compte: compteMap['701'],  journal: 'VENTES', reference: 'F-2026-001', saisiePar: adminUser._id },
      { date: new Date('2026-01-15'), libelle: 'TVA collectée F-2026-001',                    montantDebit: 0,     montantCredit: 4800,  compte: compteMap['4456'], journal: 'VENTES', reference: 'F-2026-001', saisiePar: adminUser._id },
      // Paiement de la facture
      { date: new Date('2026-02-01'), libelle: 'Règlement Société Alpha — Virement',          montantDebit: 28800, montantCredit: 0,     compte: compteMap['512'],  journal: 'BANQUE', reference: 'F-2026-001', saisiePar: adminUser._id },
      { date: new Date('2026-02-01'), libelle: 'Apurement créance Société Alpha',             montantDebit: 0,     montantCredit: 28800, compte: compteMap['411'],  journal: 'BANQUE', reference: 'F-2026-001', saisiePar: adminUser._id },
      // Salaires Février 2026
      { date: new Date('2026-02-28'), libelle: 'Salaires personnel — Février 2026',           montantDebit: 70000, montantCredit: 0,     compte: compteMap['641'],  journal: 'OD', reference: 'PAIE-02-2026', saisiePar: adminUser._id },
      { date: new Date('2026-02-28'), libelle: 'Virement salaires Février 2026',              montantDebit: 0,     montantCredit: 70000, compte: compteMap['512'],  journal: 'OD', reference: 'PAIE-02-2026', saisiePar: adminUser._id },
    ];
    const ecritures = await EcritureComptable.insertMany(ecrituresData);
    console.log(`   ${ecritures.length} écritures comptables créées`);

    // --- 10. Mouvements de stock ---
    console.log('\n🔄 Création des mouvements de stock...');
    const mouvementsData = [
      { produit: produits[0]._id, type: 'ENTREE', quantite: 5, motif: 'Réception commande fournisseur Tech Supplies', date: new Date('2026-01-10'), effectuePar: users[3]._id, fournisseur: fournisseurs[1]._id },
      { produit: produits[2]._id, type: 'ENTREE', quantite: 50, motif: 'Réapprovisionnement mensuel', date: new Date('2026-01-15'), effectuePar: users[3]._id, fournisseur: fournisseurs[0]._id },
      { produit: produits[0]._id, type: 'SORTIE', quantite: 2, motif: 'Livraison Société Alpha F-2026-001', date: new Date('2026-01-15'), effectuePar: users[3]._id },
      { produit: produits[5]._id, type: 'SORTIE', quantite: 2, motif: 'Livraison Société Alpha F-2026-001', date: new Date('2026-01-15'), effectuePar: users[3]._id },
      { produit: produits[9]._id, type: 'ENTREE', quantite: 10, motif: 'Achat urgent clés USB formation', date: new Date('2026-02-10'), effectuePar: users[3]._id, fournisseur: fournisseurs[1]._id },
      { produit: produits[3]._id, type: 'SORTIE', quantite: 5, motif: 'Distribution équipes', date: new Date('2026-02-15'), effectuePar: users[3]._id },
    ];
    // Pas d'insertMany ici car le hook post-save doit se déclencher un par un
    for (const mv of mouvementsData) {
      await MouvementStock.create(mv);
    }
    console.log(`   ${mouvementsData.length} mouvements de stock créés`);

    // =====================
    // RÉSUMÉ
    // =====================
    console.log('\n🎉 ============================================');
    console.log('   BASE DE DONNÉES PEUPLÉE AVEC SUCCÈS');
    console.log('================================================');
    console.log('   Comptes utilisateurs créés :');
    usersData.forEach((u) => {
      console.log(`   [${u.role.padEnd(10)}] ${u.email}  →  mdp: ${u.password}`);
    });
    console.log('================================================\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur seed :', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach((e) => console.error('  -', e.message));
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
