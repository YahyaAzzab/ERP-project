import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(value || 0));
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '-');

const createDoc = (title, filtres = {}) => {
  const doc = new jsPDF();
  const now = new Date().toLocaleString('fr-FR');
  doc.setFontSize(16);
  doc.text('ERP DOYA', 14, 16);
  doc.setFontSize(12);
  doc.text(title, 14, 24);
  doc.setFontSize(9);
  doc.text(`Date export: ${now}`, 14, 30);
  const entries = Object.entries(filtres || {}).filter(([, v]) => v !== undefined && v !== null && String(v) !== '');
  if (entries.length) {
    doc.text(`Filtres: ${entries.map(([k, v]) => `${k}=${v}`).join(' | ')}`, 14, 35);
  }
  return doc;
};

const saveTableDoc = (doc, fileName, head, body, foot) => {
  autoTable(doc, {
    startY: 40,
    head: [head],
    body,
    foot: foot ? [foot] : undefined,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 41, 55] },
  });
  doc.save(fileName);
};

export const exportFacturesPDF = (factures = [], filtres = {}, options = {}) => {
  const statuses = options.statuses || ['BROUILLON', 'VALIDEE', 'PAYEE', 'ANNULEE'];
  const rows = factures
    .filter((f) => statuses.includes(f.statut))
    .map((f) => [f.numero, f.clientNom || '-', formatDate(f.date), formatCurrency(f.montantHT), formatCurrency(f.tva), formatCurrency(f.montantTTC), f.statut]);

  const totals = factures
    .filter((f) => statuses.includes(f.statut))
    .reduce((acc, f) => {
      acc.ht += Number(f.montantHT || 0);
      acc.tva += Number(f.tva || 0);
      acc.ttc += Number(f.montantTTC || 0);
      return acc;
    }, { ht: 0, tva: 0, ttc: 0 });

  const doc = createDoc('Export Factures', filtres);
  saveTableDoc(
    doc,
    `factures-${Date.now()}.pdf`,
    ['Numero', 'Client', 'Date', 'HT', 'TVA', 'TTC', 'Statut'],
    rows,
    ['TOTAL', '', '', formatCurrency(totals.ht), formatCurrency(totals.tva), formatCurrency(totals.ttc), '']
  );
};

export const exportComptesClientsPDF = (clients = [], options = {}) => {
  const selected = options.columns || ['nom', 'email', 'telephone', 'ville', 'chiffreAffaires', 'nombreFactures'];
  const mapHeader = {
    nom: 'Nom',
    email: 'Email',
    telephone: 'Telephone',
    ville: 'Ville',
    chiffreAffaires: 'CA',
    nombreFactures: 'Nb Factures',
  };
  const head = selected.map((k) => mapHeader[k]);
  const body = clients.map((c) => selected.map((k) => (k === 'chiffreAffaires' ? formatCurrency(c[k]) : c[k] || '-')));
  const doc = createDoc('Export Clients');
  saveTableDoc(doc, `clients-${Date.now()}.pdf`, head, body);
};

export const exportBalancePDF = (balance = []) => {
  const doc = createDoc('Export Balance');
  const rows = balance.map((b) => [b.numero, b.libelle, b.type, formatCurrency(b.totalDebit), formatCurrency(b.totalCredit), formatCurrency(b.solde)]);
  saveTableDoc(doc, `balance-${Date.now()}.pdf`, ['Numero', 'Libelle', 'Type', 'Debit', 'Credit', 'Solde'], rows);
};

export const exportEmployesPDF = (employes = [], filtres = {}, options = {}) => {
  const includeSalaire = options.includeSalaire ?? true;
  const includeCoordonnees = options.includeCoordonnees ?? true;
  const includeDateEmbauche = options.includeDateEmbauche ?? true;

  const head = ['Matricule', 'Nom', 'Poste', 'Departement', 'Contrat'];
  if (includeSalaire) head.push('Salaire');
  if (includeCoordonnees) head.push('Email', 'Telephone');
  if (includeDateEmbauche) head.push('Date embauche');
  head.push('Statut');

  const body = employes.map((e) => {
    const row = [e.matricule || '-', `${e.prenom || ''} ${e.nom || ''}`.trim(), e.poste || '-', e.departement || '-', e.typeContrat || '-'];
    if (includeSalaire) row.push(formatCurrency(e.salaireBrut));
    if (includeCoordonnees) row.push(e.email || '-', e.telephone || '-');
    if (includeDateEmbauche) row.push(formatDate(e.dateEmbauche));
    row.push(e.statut || '-');
    return row;
  });

  const doc = createDoc('Export Employes', filtres);
  saveTableDoc(doc, `employes-${Date.now()}.pdf`, head, body);
};

export const exportCongesPDF = (conges = [], filtres = {}) => {
  const doc = createDoc('Export Conges', filtres);
  const body = conges.map((c) => [
    `${c.employe?.prenom || ''} ${c.employe?.nom || ''}`.trim() || '-',
    c.type,
    formatDate(c.dateDebut),
    formatDate(c.dateFin),
    c.nombreJours || '-',
    c.statut,
  ]);
  saveTableDoc(doc, `conges-${Date.now()}.pdf`, ['Employe', 'Type', 'Debut', 'Fin', 'Jours', 'Statut'], body);
};

export const exportFichesPaiePDF = (fiches = []) => {
  const doc = createDoc('Fiches de paie');
  let y = 42;
  fiches.forEach((f, index) => {
    if (index > 0) {
      doc.addPage();
      y = 22;
    }
    const brut = Number(f.salaireBrut || 0);
    const cot = Number(f.cotisationsSalariales || f.totalCotisationsSalariales || Math.round(brut * 0.22));
    const net = Number(f.salaireNet || brut - cot);
    doc.setFontSize(14);
    doc.text('Bulletin de paie', 14, y);
    doc.setFontSize(10);
    doc.text(`Employe: ${f.employe?.prenom || ''} ${f.employe?.nom || ''}`.trim(), 14, y + 8);
    doc.text(`Periode: ${f.mois}/${f.annee}`, 14, y + 14);
    doc.text(`Salaire brut: ${formatCurrency(brut)}`, 14, y + 24);
    doc.text(`Cotisations salariales: ${formatCurrency(cot)}`, 14, y + 30);
    doc.text(`Salaire net: ${formatCurrency(net)}`, 14, y + 36);
  });
  doc.save(`fiches-paie-${Date.now()}.pdf`);
};

export const exportProduitsPDF = (produits = [], filtres = {}, options = {}) => {
  const alertOnly = options.alertOnly || false;
  const includeValorisation = options.includeValorisation ?? true;
  const dataset = alertOnly ? produits.filter((p) => Number(p.quantiteStock || 0) <= Number(p.seuilAlerte || 0)) : produits;

  const head = ['Reference', 'Designation', 'Categorie', 'Stock', 'Seuil', 'Prix'];
  if (includeValorisation) head.push('Valeur');

  const body = dataset.map((p) => {
    const row = [p.reference, p.designation, p.categorie, `${p.quantiteStock || 0} ${p.unite || ''}`.trim(), p.seuilAlerte || 0, formatCurrency(p.prixUnitaire)];
    if (includeValorisation) row.push(formatCurrency((Number(p.quantiteStock || 0) * Number(p.prixUnitaire || 0))));
    return row;
  });

  const doc = createDoc('Export Produits', filtres);
  saveTableDoc(doc, `produits-${Date.now()}.pdf`, head, body);
};

export const exportMouvementsPDF = (mouvements = [], filtres = {}) => {
  const doc = createDoc('Export Mouvements de stock', filtres);
  const body = mouvements.map((m) => [
    formatDate(m.date),
    `${m.produit?.reference || ''} ${m.produit?.designation || ''}`.trim() || '-',
    m.type,
    m.stockAvant ?? m.quantiteAvant ?? '-',
    m.quantite,
    m.stockApres ?? m.quantiteApres ?? '-',
    m.motif || '-',
  ]);
  saveTableDoc(doc, `mouvements-${Date.now()}.pdf`, ['Date', 'Produit', 'Type', 'Qte avant', 'Qte mouv.', 'Qte apres', 'Motif'], body);
};

export const exportInventairePDF = (inventaire = []) => {
  const doc = createDoc('Export Inventaire');
  const body = inventaire.map((p) => [p.reference, p.designation, p.categorie, `${p.quantiteStock || 0} ${p.unite || ''}`.trim(), p.seuilAlerte || 0, formatCurrency(p.prixUnitaire), formatCurrency((Number(p.quantiteStock || 0) * Number(p.prixUnitaire || 0)))]);
  saveTableDoc(doc, `inventaire-${Date.now()}.pdf`, ['Reference', 'Designation', 'Categorie', 'Stock', 'Seuil', 'Prix', 'Valeur'], body);
}
