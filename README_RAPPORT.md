# BRIEF COMPLET — RAPPORT PFE ERP PME
## Document de référence pour rédaction du rapport universitaire

---

### SECTION 1 — INFORMATIONS GÉNÉRALES DU PROJET

- Nom complet du projet : ERP DOYA — Système de Gestion Intégré (ERP PME)
- Type de projet : Projet de Fin d'Études (PFE)
- Domaine : Développement Web Full-Stack
- Description (3 phrases) :
  1. ERP DOYA est une application web full-stack destinée aux PME pour centraliser la comptabilité, les ressources humaines et la gestion des stocks.
  2. Le backend expose une API REST sécurisée (JWT + RBAC) et le frontend React propose une interface SPA responsive et modulaire.
  3. Le projet met l'accent sur la traçabilité métier (écritures comptables, mouvements de stock, historique RH), la sécurité et la productivité opérationnelle.
- Objectif principal : concevoir et livrer un ERP simplifié, sécurisé et extensible permettant à une PME de piloter ses processus métier essentiels dans une seule plateforme.
- Public cible : PME (Petites et Moyennes Entreprises)
- Durée de développement : 2 mois
- Nombre d'étapes de développement : 10 étapes (avec étape 0 d'initialisation + lot d'améliorations UX post-étapes)

---

### SECTION 2 — STACK TECHNIQUE COMPLÈTE JUSTIFIÉE

#### BACKEND

1. Technologie : Node.js
- Version utilisée : >= 18.0.0 (engine projet)
- Rôle : runtime JavaScript serveur pour exécuter l'API REST.
- Justification : unification du langage (JavaScript) entre frontend et backend, modèle non bloquant adapté aux I/O (MongoDB, API), écosystème npm mature.
- Alternative considérée et rejetée : PHP/Laravel ou Java/Spring Boot, rejetés pour éviter l'hétérogénéité technologique et réduire le temps de montée en charge sur un PFE court.

2. Technologie : Express.js
- Version utilisée : ^4.18.3
- Rôle : framework HTTP minimaliste (routing, middlewares, gestion d'erreurs).
- Justification : simplicité, flexibilité, architecture claire (middlewares + routes + contrôleurs), idéal pour un backend modulaire.
- Alternative considérée et rejetée : NestJS, rejeté pour éviter une courbe d'apprentissage plus forte et une structure plus opinionated.

3. Technologie : MongoDB
- Version utilisée : Community Server (locale, version non figée dans le dépôt)
- Rôle : base de données NoSQL orientée documents.
- Justification : flexibilité des schémas, documents imbriqués pertinents (ex. lignes de facture), itérations rapides.
- Alternative considérée et rejetée : PostgreSQL/MySQL, rejetés pour limiter la complexité des migrations et des jointures dans un contexte PFE agile.

4. Technologie : Mongoose ODM
- Version utilisée : ^8.2.3
- Rôle : modélisation des données MongoDB avec schémas, validations, hooks, virtuels et population.
- Justification : robustesse de la couche domaine (contraintes, index, hooks pre/post), meilleure maintenabilité qu'un driver brut.
- Alternative considérée et rejetée : driver MongoDB natif, rejeté car plus verbeux et moins structurant pour des règles métier riches.

5. Technologie : JWT (jsonwebtoken)
- Version utilisée : ^9.0.2
- Rôle : authentification stateless par jetons signés.
- Justification : scalabilité (pas de session serveur), standard ouvert, intégration simple avec API REST.
- Alternative considérée et rejetée : sessions côté serveur (express-session), rejetées pour éviter la dépendance à un store de session et simplifier l'architecture.

6. Technologie : bcryptjs
- Version utilisée : ^2.4.3
- Rôle : hachage sécurisé des mots de passe.
- Justification : protection des identifiants en base, implémentation stable et largement adoptée.
- Alternative considérée et rejetée : stockage en clair (inacceptable) ou hash faible, rejetés pour raisons de sécurité.

7. Technologie : helmet
- Version utilisée : ^7.1.0
- Rôle : sécurisation des headers HTTP.
- Justification : réduction des risques web (XSS, clickjacking, MIME sniffing, etc.) via configuration standard éprouvée.
- Alternative considérée et rejetée : configuration manuelle des headers, rejetée car plus risquée et moins maintenable.

8. Technologie : cors
- Version utilisée : ^2.8.5
- Rôle : contrôle des origines autorisées entre frontend et backend.
- Justification : indispensable pour exécuter une SPA et une API sur des origines différentes en développement et production.
- Alternative considérée et rejetée : proxy unique sans politique CORS explicite, rejetée car moins flexible pour dev/test.

9. Technologie : morgan
- Version utilisée : ^1.10.0
- Rôle : journalisation HTTP en développement.
- Justification : accélère le diagnostic des erreurs API et la traçabilité des requêtes.
- Alternative considérée et rejetée : logs manuels dispersés, rejetés pour manque de standardisation.

10. Technologie : express-validator
- Version utilisée : ^7.2.0
- Rôle : validation/sanitation des entrées HTTP.
- Justification : sécurise les payloads, limite les erreurs métier et améliore la qualité des réponses.
- Alternative considérée et rejetée : validation ad hoc dans chaque contrôleur, rejetée car source de duplication.

11. Technologie : nodemon
- Version utilisée : ^3.1.0
- Rôle : redémarrage automatique du serveur en développement.
- Justification : gain de productivité élevé pendant les itérations.
- Alternative considérée et rejetée : redémarrage manuel, rejeté pour coût temporel.

12. Technologie : Jest + Supertest
- Version utilisée : Jest ^29.7.0, Supertest ^6.3.4
- Rôle : tests backend automatisés (unitaires/intégration API).
- Justification : stack de test standard Node.js, fiable pour vérifier auth, permissions et logique métier.
- Alternative considérée et rejetée : tests uniquement manuels, rejetés car insuffisants pour prévenir les régressions.

#### FRONTEND

1. Technologie : React.js 18
- Version utilisée : react ^18.3.1, react-dom ^18.3.1
- Rôle : interface utilisateur SPA basée composants.
- Justification : modularité, réutilisabilité, performance de rendu et écosystème riche.
- Alternative considérée et rejetée : Vue.js/Angular, rejetées pour rester sur un stack JS homogène et réduire la dispersion d'apprentissage.

2. Technologie : Vite
- Version utilisée : ^5.4.11
- Rôle : bundler/dev server frontend.
- Justification : démarrage rapide, HMR performant, configuration légère pour React.
- Alternative considérée et rejetée : Create React App, rejeté pour des performances de développement moins bonnes.

3. Technologie : Tailwind CSS v3
- Version utilisée : ^3.4.17
- Rôle : framework CSS utilitaire pour un design rapide et cohérent.
- Justification : productivité UI, uniformité visuelle, responsive simple.
- Alternative considérée et rejetée : Bootstrap (moins granulaire) et Tailwind v4 (incompatibilité postcss rencontrée).

4. Technologie : React Router v6
- Version utilisée : react-router-dom ^6.28.0
- Rôle : navigation SPA et protection des routes.
- Justification : API moderne, intégration naturelle avec React et règles d'accès par rôle.
- Alternative considérée et rejetée : gestion de routes custom, rejetée pour complexité inutile.

5. Technologie : Axios
- Version utilisée : ^1.7.9
- Rôle : client HTTP (instance centralisée + intercepteurs JWT).
- Justification : gestion fine des headers, erreurs globales et sérialisation JSON.
- Alternative considérée et rejetée : fetch natif, rejeté pour éviter la répétition de logique d'interception.

6. Technologie : React Hook Form
- Version utilisée : ^7.54.2
- Rôle : gestion performante des formulaires et validations.
- Justification : peu de re-renders, intégration ergonomique, simplification des formulaires métiers.
- Alternative considérée et rejetée : formulaires contrôlés React natifs uniquement, rejetés pour verbosité.

7. Technologie : Lucide React
- Version utilisée : ^0.469.0
- Rôle : bibliothèque d'icônes UI.
- Justification : cohérence visuelle, personnalisation simple, poids maîtrisé.
- Alternative considérée et rejetée : emojis/icônes hétérogènes, rejetés pour homogénéité insuffisante.

8. Technologie : Recharts
- Version utilisée : ^3.8.0
- Rôle : visualisation des KPIs (line/bar/pie charts).
- Justification : intégration React native et composants de graphiques adaptés au dashboard ERP.
- Alternative considérée et rejetée : Chart.js direct, rejeté car moins idiomatique React sans wrapper.

9. Technologie : jsPDF + jsPDF-AutoTable
- Version utilisée : jspdf ^4.2.1, jspdf-autotable ^5.0.7
- Rôle : export PDF des données métier selon rôle.
- Justification : génération client-side immédiate, tableaux multi-colonnes robustes.
- Alternative considérée et rejetée : génération PDF backend, rejetée pour éviter surcharge serveur et complexité de file d'attente.

10. Technologie : React Context API
- Version utilisée : API native React 18
- Rôle : état global (authentification, thème).
- Justification : suffisant pour la taille du projet, évite l'ajout d'une dépendance externe de state management.
- Alternative considérée et rejetée : Redux Toolkit, rejeté car surdimensionné pour le périmètre PFE.

#### OUTILS DE DÉVELOPPEMENT

1. Visual Studio Code
- Version utilisée : non figée dans le dépôt
- Rôle : IDE principal.
- Justification : productivité, extensions, débogage intégré.
- Alternative considérée et rejetée : autres IDE plus lourds ou moins intégrés aux outils JS.

2. GitHub Copilot (assistance IA au développement)
- Version utilisée : extension VS Code (non figée)
- Rôle : génération assistée de code, accélération des tâches répétitives.
- Justification : gain de vitesse et exploration de solutions.
- Alternative considérée et rejetée : développement sans IA, plus lent sur un calendrier serré.

3. MongoDB Compass
- Version utilisée : non figée dans le dépôt
- Rôle : inspection visuelle des collections et requêtes.
- Justification : validation rapide des données et index.
- Alternative considérée et rejetée : shell uniquement, moins ergonomique pour audit visuel.

4. Thunder Client
- Version utilisée : extension VS Code (non figée)
- Rôle : tests manuels API.
- Justification : exécution rapide de scénarios HTTP sans quitter l'éditeur.
- Alternative considérée et rejetée : Postman uniquement, rejeté par préférence d'intégration VS Code.

5. Git + GitHub
- Version utilisée : non figée
- Rôle : versioning, collaboration, historisation.
- Justification : standard industriel et traçabilité des livrables.
- Alternative considérée et rejetée : absence de VCS structuré, inadaptée au PFE.

6. PlantUML
- Version utilisée : non figée
- Rôle : génération de diagrammes UML (classes, séquences, déploiement).
- Justification : diagrammes texte versionnables et maintenables.
- Alternative considérée et rejetée : dessin manuel non versionné, rejeté pour manque de reproductibilité.

---

### SECTION 3 — ARCHITECTURE TECHNIQUE DÉTAILLÉE

#### 3.1 Architecture globale

- Type : architecture 3-tiers.
  - Couche Présentation : frontend React (SPA) exécuté dans le navigateur.
  - Couche Logique Métier : backend Node.js/Express (contrôleurs + services métier).
  - Couche Données : MongoDB (collections gérées via Mongoose).
- Communication Frontend ↔ Backend : API REST.
- Format d'échange : JSON.
- Protocole : HTTP/HTTPS.
- Authentification : JWT stateless (token signé transmis via header Authorization).

#### 3.2 Architecture Backend

- Pattern : MVC (Model-View-Controller, adapté API REST sans vues serveur).
- Structure des dossiers et rôles :
  - src/config : configuration infrastructure (connexion DB).
  - src/models : schémas Mongoose, validations, index, hooks, virtuels.
  - src/controllers : logique métier par module.
  - src/routes : mapping des endpoints HTTP.
  - src/middleware : auth JWT, RBAC, validation.
  - src/utils : fonctions transverses (génération token, réponses API, seed, migration).
  - src/app.js : composition Express (middlewares + routes + erreurs).
  - src/server.js : démarrage serveur + connexion MongoDB.
- Flux d'une requête HTTP :
  1. Client (frontend) envoie une requête HTTP.
  2. Route Express correspondante est résolue.
  3. Middleware Auth JWT valide le token.
  4. Middleware Role (RBAC) vérifie la permission.
  5. Contrôleur exécute la logique métier.
  6. Modèle Mongoose lit/écrit dans MongoDB.
  7. Réponse JSON structurée est renvoyée au client.

#### 3.3 Architecture Frontend

- Pattern : SPA (Single Page Application).
- Structure React :
  - Components communs : DataTable, Modal, Badge, SearchBar, StatCard.
  - Pages par domaine : Comptabilité, RH, Stocks, Dashboard, Clients, Messages, Paramètres.
  - Services API : un service Axios par domaine.
  - Contexts globaux : AuthContext (session), ThemeContext (dark/light mode).
- Flux JWT côté client :
  1. Login via formulaire React Hook Form.
  2. Récupération token + profil utilisateur.
  3. Stockage local (localStorage).
  4. Intercepteur Axios ajoute Authorization: Bearer <token>.
  5. ProtectedRoute applique le contrôle d'accès par rôle.
  6. En cas de 401/expiration, déconnexion contrôlée.
- State global : React Context API (auth, thème).
- Services Axios : baseURL centralisée, intercepteurs requête/réponse.

#### 3.4 Sécurité

- Hashage bcrypt des mots de passe (hook pre-save User).
- Tokens JWT avec expiration 8h (JWT_EXPIRES_IN=8h).
- Middleware de vérification token sur toutes les routes privées.
- Contrôle d'accès RBAC par rôles (ADMIN, COMPTABLE, RH, MAGASINIER).
- Protection CORS (origines autorisées configurées selon environnement).
- Headers sécurisés via Helmet.

---

### SECTION 4 — MODULES FONCTIONNELS DÉTAILLÉS

#### 4.1 Module Authentification & Sécurité

- Description : gestion des comptes utilisateurs, connexion JWT, profil connecté, changement/réinitialisation de mot de passe.
- Rôles autorisés :
  - Public : register/login.
  - Tous rôles connectés : me/password.
  - ADMIN : gestion utilisateurs (/users).
- Fonctionnalités : register, login, profil, update password, CRUD utilisateurs admin, reset password admin.
- Routes API :
  - POST /api/auth/register : créer un compte.
  - POST /api/auth/login : authentification et émission JWT.
  - GET /api/auth/me : profil de l'utilisateur connecté.
  - PUT /api/auth/password : changement de mot de passe personnel.
  - GET /api/auth/users : lister les utilisateurs (ADMIN).
  - POST /api/auth/users : créer un utilisateur (ADMIN).
  - PUT /api/auth/users/:id : modifier utilisateur (ADMIN).
  - PUT /api/auth/users/:id/password : réinitialiser mot de passe (ADMIN).
  - DELETE /api/auth/users/:id : supprimer utilisateur (ADMIN).
- Règles métier importantes : validation stricte email/mot de passe, unicité email, rôle borné à 4 valeurs, password non exposé (select:false).
- Modèle de données principal : User (voir section 5).

#### 4.2 Module Comptabilité (Comptes, Écritures, Factures, Balance)

- Description : gestion du plan comptable, écritures en partie double, cycle de vie des factures, reporting comptable.
- Rôles autorisés : ADMIN, COMPTABLE.
- Fonctionnalités : CRUD comptes, CRUD écritures, grand livre, balance générale, CRUD factures avec transitions de statut.
- Routes API :
  - GET /api/comptabilite/comptes
  - POST /api/comptabilite/comptes
  - GET /api/comptabilite/comptes/:id
  - PUT /api/comptabilite/comptes/:id
  - DELETE /api/comptabilite/comptes/:id
  - GET /api/comptabilite/ecritures
  - POST /api/comptabilite/ecritures
  - GET /api/comptabilite/ecritures/:id
  - PUT /api/comptabilite/ecritures/:id
  - DELETE /api/comptabilite/ecritures/:id
  - GET /api/comptabilite/grand-livre/:compteId
  - GET /api/comptabilite/balance
  - GET /api/comptabilite/factures
  - POST /api/comptabilite/factures
  - GET /api/comptabilite/factures/:id
  - PUT /api/comptabilite/factures/:id
  - PATCH /api/comptabilite/factures/:id/statut
  - DELETE /api/comptabilite/factures/:id
- Règles métier importantes :
  - Numéro facture auto FAC-ANNEE-XXXX.
  - Transitions autorisées : BROUILLON->VALIDEE, VALIDEE->PAYEE, BROUILLON->ANNULEE, VALIDEE->ANNULEE.
  - Validation de facture : génération automatique d'écritures comptables.
  - Facture verrouillée dès VALIDEE/PAYEE (pas de modification/suppression).
  - Suppression compte interdite si écritures existantes.
- Modèles : CompteComptable, EcritureComptable, Facture (avec LigneFacture embedded), relation vers Client.

#### 4.3 Module Ressources Humaines (Employés, Congés, Fiches de Paie)

- Description : cycle RH complet (employés, demandes de congé, paie), avec traçabilité des statuts.
- Rôles autorisés :
  - Employés : création/consultation de congés selon droits.
  - RH, ADMIN : gestion complète employés, congés, paie.
- Fonctionnalités :
  - Employés : CRUD + statistiques + soft delete + historique statuts.
  - Congés : création, consultation, traitement (approbation/refus), annulation.
  - Fiches de paie : génération mensuelle, détail cotisations, modification/suppression.
- Routes API :
  - GET /api/rh/employes
  - POST /api/rh/employes
  - GET /api/rh/employes/statistiques
  - GET /api/rh/employes/:id
  - PUT /api/rh/employes/:id
  - DELETE /api/rh/employes/:id
  - GET /api/rh/conges
  - POST /api/rh/conges
  - GET /api/rh/conges/:id
  - PUT /api/rh/conges/:id/traiter
  - PUT /api/rh/conges/:id/annuler
  - GET /api/rh/employes/:id/solde-conges
  - GET /api/rh/fiches-paie
  - POST /api/rh/fiches-paie
  - GET /api/rh/fiches-paie/:id
  - PUT /api/rh/fiches-paie/:id
  - DELETE /api/rh/fiches-paie/:id
- Règles métier importantes :
  - Matricule auto EMP-XXX.
  - Solde de congé contrôlé (blocage si insuffisant pour ANNUEL).
  - Jours ouvrés et validation dateFin >= dateDebut.
  - Soft delete employé (statut INACTIF).
  - Cotisations calculées automatiquement pour la paie.
  - Unicité fiche de paie par employé/mois/année.
- Modèles : Employe (historiqueStatuts embedded), Conge, FichePaie.

#### 4.4 Module Gestion des Stocks (Produits, Mouvements, Fournisseurs, Inventaire)

- Description : gestion du référentiel fournisseurs/produits, traçabilité des mouvements et monitoring inventaire.
- Rôles autorisés : ADMIN, MAGASINIER (certaines suppressions ADMIN uniquement).
- Fonctionnalités :
  - Fournisseurs : CRUD (suppression ADMIN).
  - Produits : CRUD + alertes seuil + catégories + inventaire.
  - Mouvements : entrée/sortie/ajustement avec snapshots stockAvant/stockApres.
  - Statistiques stocks.
- Routes API :
  - GET /api/stocks/fournisseurs
  - POST /api/stocks/fournisseurs
  - GET /api/stocks/fournisseurs/:id
  - PUT /api/stocks/fournisseurs/:id
  - DELETE /api/stocks/fournisseurs/:id
  - GET /api/stocks/produits
  - POST /api/stocks/produits
  - GET /api/stocks/produits/alertes
  - GET /api/stocks/produits/categories
  - GET /api/stocks/produits/:id
  - PUT /api/stocks/produits/:id
  - DELETE /api/stocks/produits/:id
  - GET /api/stocks/mouvements
  - GET /api/stocks/mouvements/:id
  - POST /api/stocks/mouvements/entree
  - POST /api/stocks/mouvements/sortie
  - POST /api/stocks/mouvements/ajustement
  - GET /api/stocks/inventaire
  - GET /api/stocks/statistiques
- Règles métier importantes :
  - Référence produit auto PROD-XXX.
  - Stock non modifiable directement : uniquement via mouvements.
  - Sortie bloquée si stock insuffisant.
  - Hook post-save mouvement pour synchroniser quantiteStock.
  - Suppression contrôlée fournisseur/produit selon dépendances.
- Modèles : Fournisseur, Produit, MouvementStock.

#### 4.5 Module Clients (ADMIN + COMPTABLE en lecture/création)

- Description : gestion du référentiel clients et indicateurs commerciaux (CA, nombre factures) couplés à la comptabilité.
- Rôles autorisés :
  - Lecture/Création : ADMIN, COMPTABLE.
  - Modification/Suppression : ADMIN.
- Fonctionnalités : CRUD clients, statistiques, liens factures-clients, consultation du détail client.
- Routes API :
  - GET /api/clients
  - POST /api/clients
  - GET /api/clients/statistiques
  - GET /api/clients/:id
  - PUT /api/clients/:id
  - DELETE /api/clients/:id
- Règles métier importantes :
  - Client lié aux factures via ObjectId (plus robuste que texte libre).
  - Calcul automatique des stats client (CA/nombre de factures) suite aux opérations facture.
  - Migration legacy disponible pour convertir les factures historiques.
- Modèle : Client + relation Facture.client.

#### 4.6 Module Dashboard & Statistiques (KPIs, Graphiques, Alertes)

- Description : vue consolidée multi-modules pour pilotage temps réel.
- Rôles autorisés : tous les utilisateurs authentifiés.
- Fonctionnalités : KPIs globaux, alertes opérationnelles, séries temporelles CA, ventilation factures/statuts, données RH et stocks.
- Routes API :
  - GET /api/dashboard/kpis
  - GET /api/dashboard/alertes
  - GET /api/dashboard/graphique/ca
  - GET /api/dashboard/graphique/factures-statut
  - GET /api/dashboard/graphique/employes-departement
  - GET /api/dashboard/graphique/masse-salariale
  - GET /api/dashboard/graphique/conges
  - GET /api/dashboard/graphique/mouvements-stock
  - GET /api/dashboard/graphique/stock-categorie
- Règles métier importantes :
  - Agrégations MongoDB centralisées par domaine.
  - Données API préformatées pour Recharts.
  - Consolidation des alertes critiques inter-modules.
- Modèles impliqués : Facture, EcritureComptable, Employe, Conge, FichePaie, Produit, MouvementStock.

---

### SECTION 5 — MODÈLES DE DONNÉES MONGODB

#### 5.1 User (collection: users)

- Champs et contraintes :
  - nom: String, requis, trim, max 50
  - prenom: String, requis, trim, max 50
  - email: String, requis, unique, lowercase, format email
  - password: String, requis, min 8, select:false
  - role: String enum [ADMIN, COMPTABLE, RH, MAGASINIER], défaut MAGASINIER
  - actif: Boolean, défaut true
  - dernierLogin: Date
  - resetPasswordToken: String, select:false
  - resetPasswordExpire: Date, select:false
  - timestamps: createdAt, updatedAt
- Relations : aucune relation obligatoire; référencé par plusieurs modèles (creePar, effectuePar, etc.).
- Particularités :
  - Hook pre-save : hash bcrypt (salt 12)
  - Méthode instance verifierPassword()
  - Virtuel nomComplet
  - Index role
- Exemple JSON :
{
  "_id": "660000000000000000000001",
  "nom": "Benali",
  "prenom": "Fatima",
  "email": "f.benali@erp-pme.ma",
  "role": "COMPTABLE",
  "actif": true,
  "dernierLogin": "2026-03-01T08:00:00.000Z"
}

#### 5.2 CompteComptable (collection: comptecomptables)

- Champs : numero(String unique, 3-6 chiffres), libelle(String), type(enum ACTIF|PASSIF|CHARGE|PRODUIT), description(String), actif(Boolean), timestamps.
- Relations : référencé par EcritureComptable.compte.
- Particularités : index unique numero + index type.
- Exemple JSON :
{
  "numero": "411",
  "libelle": "Clients",
  "type": "ACTIF",
  "description": "Créances clients",
  "actif": true
}

#### 5.3 EcritureComptable (collection: ecriturecomptables)

- Champs :
  - date(Date)
  - libelle(String requis)
  - montantDebit(Number >=0)
  - montantCredit(Number >=0)
  - compte(ObjectId ref CompteComptable, requis)
  - facture(ObjectId ref Facture, optionnel)
  - saisiePar(ObjectId ref User)
  - journal(enum GENERAL|VENTES|ACHATS|BANQUE|CAISSE|OD)
  - reference(String)
  - timestamps
- Relations : vers CompteComptable, Facture, User.
- Particularités : index (compte,date), facture, date, (journal,date).
- Exemple JSON :
{
  "date": "2026-03-10T00:00:00.000Z",
  "libelle": "Vente facture FAC-2026-0004",
  "montantDebit": 12000,
  "montantCredit": 0,
  "compte": "660000000000000000000101",
  "facture": "660000000000000000000201",
  "journal": "VENTES"
}

#### 5.4 Facture avec LigneFacture embedded (collection: factures)

- Champs Facture :
  - numero(String requis, unique)
  - date(Date)
  - dateEcheance(Date)
  - client(ObjectId ref Client, requis)
  - lignes(Array<LigneFacture>, min 1)
  - montantHT(Number)
  - tva(Number)
  - montantTTC(Number)
  - statut(enum BROUILLON|VALIDEE|PAYEE|ANNULEE, défaut BROUILLON)
  - notes(String)
  - ecrituresComptables(Array<ObjectId ref EcritureComptable>)
  - creePar(ObjectId ref User)
  - timestamps
- Sous-document LigneFacture : designation(String), quantite(Number), prixUnitaire(Number), tvaPercent(Number), produit(ObjectId ref Produit).
- Relations : Client, Produit, EcritureComptable, User.
- Particularités :
  - Hook pre-save calcule montantHT/tva/montantTTC
  - Virtuels legacy clientNom/clientEmail
  - Index client, statut, date
- Exemple JSON :
{
  "numero": "FAC-2026-0004",
  "client": "660000000000000000000301",
  "lignes": [
    {
      "designation": "Prestation conseil",
      "quantite": 2,
      "prixUnitaire": 1500,
      "tvaPercent": 20
    }
  ],
  "montantHT": 3000,
  "tva": 600,
  "montantTTC": 3600,
  "statut": "BROUILLON"
}

#### 5.5 Client (collection: clients)

- Champs : nom(String requis), email(String unique sparse), telephone, adresse, ville, pays(defaut Maroc), secteurActivite, chiffreAffaires(Number), nombreFactures(Number), statut(enum ACTIF|INACTIF), notes, creePar(ObjectId User), timestamps.
- Relations : référencé par Facture.client; creePar vers User.
- Particularités : index texte (nom,email,ville), index statut, secteurActivite.
- Exemple JSON :
{
  "nom": "Société ABC",
  "email": "contact@abc.ma",
  "ville": "Casablanca",
  "secteurActivite": "Conseil",
  "chiffreAffaires": 85000,
  "nombreFactures": 12,
  "statut": "ACTIF"
}

#### 5.6 Employe avec HistoriqueStatut embedded (collection: employes)

- Champs : matricule(unique), nom, prenom, email(unique), telephone, poste, departement, dateEmbauche, salaireBrut, typeContrat(enum CDI|CDD|STAGE), soldeConges, statut(enum ACTIF|INACTIF|CONGE|SUSPENDU), adresse, dateNaiss, cin, user(ObjectId User), historiqueStatuts(Array<subdoc>), timestamps.
- Sous-document historiqueStatuts : statut(enum ACTIF|INACTIF|SUSPENDU), dateDebut, dateFin nullable, motif, modifiePar(ObjectId User).
- Relations : user/modifiePar vers User; référencé par Conge et FichePaie.
- Particularités : virtuels nomComplet et anciennete, index departement/statut/text.
- Exemple JSON :
{
  "matricule": "EMP-001",
  "nom": "Cherkaoui",
  "prenom": "Youssef",
  "email": "y.cherkaoui@erp-pme.ma",
  "poste": "Responsable RH",
  "departement": "RH",
  "statut": "ACTIF",
  "historiqueStatuts": [
    {
      "statut": "ACTIF",
      "dateDebut": "2025-01-01T00:00:00.000Z",
      "dateFin": null,
      "motif": "Embauche"
    }
  ]
}

#### 5.7 Conge (collection: conges)

- Champs : employe(ObjectId ref Employe requis), type(enum), dateDebut, dateFin, statut(enum EN_ATTENTE|APPROUVE|REFUSE|ANNULE), motif, commentaireRH, traitePar(ObjectId User), dateTraitement, timestamps.
- Relations : Employe, User.
- Particularités :
  - Hook pre-save valide dateFin >= dateDebut
  - Virtuel nombreJours
  - Index employe/date, statut, intervalle dates
- Exemple JSON :
{
  "employe": "660000000000000000000401",
  "type": "ANNUEL",
  "dateDebut": "2026-07-01",
  "dateFin": "2026-07-10",
  "statut": "EN_ATTENTE"
}

#### 5.8 FichePaie (collection: fichepaies)

- Champs : employe(ObjectId ref Employe requis), mois(1-12), annee(>=2000), salaireBrut, heuresSupplementaires, primes, cotisations(Array<Cotisation>), totalCotisationsSalariales, salaireNet, dateGeneration, genereePar(ObjectId User), timestamps.
- Sous-document Cotisation : libelle, tauxSalarial, tauxPatronal, montantSalarial, montantPatronal.
- Relations : Employe, User.
- Particularités : index unique (employe,mois,annee) + index (annee,mois).
- Exemple JSON :
{
  "employe": "660000000000000000000401",
  "mois": 2,
  "annee": 2026,
  "salaireBrut": 10000,
  "cotisations": [
    {
      "libelle": "CNSS",
      "tauxSalarial": 4.48,
      "montantSalarial": 448
    }
  ],
  "totalCotisationsSalariales": 2200,
  "salaireNet": 7800
}

#### 5.9 Fournisseur (collection: fournisseurs)

- Champs : nom(requis), email, telephone, adresse{subdoc}, ice, raisonSociale, actif, notes, timestamps.
- Relations : référencé par Produit.fournisseur et MouvementStock.fournisseur.
- Particularités : index texte nom, index actif.
- Exemple JSON :
{
  "nom": "FourniTech SARL",
  "email": "contact@fournitech.ma",
  "adresse": {
    "ville": "Rabat",
    "pays": "Maroc"
  },
  "actif": true
}

#### 5.10 Produit (collection: produits)

- Champs : reference(unique), designation, categorie, quantiteStock, seuilAlerte, prixUnitaire, prixAchat, unite, description, image, actif, fournisseur(ObjectId), timestamps.
- Relations : fournisseur ref Fournisseur; référencé par MouvementStock et potentiellement Facture.lignes.produit.
- Particularités :
  - Virtuel enAlerte (quantiteStock <= seuilAlerte)
  - Virtuel valeurStock (quantiteStock * prixUnitaire)
  - Index categorie, quantiteStock, texte designation/reference
- Exemple JSON :
{
  "reference": "PROD-001",
  "designation": "Ordinateur portable",
  "categorie": "Informatique",
  "quantiteStock": 12,
  "seuilAlerte": 5,
  "prixUnitaire": 9500,
  "fournisseur": "660000000000000000000501"
}

#### 5.11 MouvementStock (collection: mouvementstocks)

- Champs : produit(ObjectId ref Produit requis), type(enum ENTREE|SORTIE|AJUSTEMENT|RETOUR_FOURNISSEUR|RETOUR_CLIENT), quantite, stockAvant, stockApres, motif, date, effectuePar(ObjectId User), referenceDocument, fournisseur(ObjectId Fournisseur), timestamps.
- Relations : Produit, User, Fournisseur.
- Particularités :
  - Hook post-save : mise à jour automatique du stock produit
  - Index produit/date, type, date, effectuePar
- Exemple JSON :
{
  "produit": "660000000000000000000601",
  "type": "ENTREE",
  "quantite": 20,
  "stockAvant": 12,
  "stockApres": 32,
  "motif": "Réception commande",
  "effectuePar": "660000000000000000000001"
}

---

### SECTION 6 — SYSTÈME DE RÔLES ET PERMISSIONS

#### 6.1 Rôles

- ADMIN
- COMPTABLE
- RH
- MAGASINIER

#### 6.2 Matrice Rôle × Module × Permission

| Module | Action | ADMIN | COMPTABLE | RH | MAGASINIER |
|---|---|---|---|---|---|
| Auth | Register/Login | Oui | Oui | Oui | Oui |
| Auth | Me/Password | Oui | Oui | Oui | Oui |
| Utilisateurs (paramètres) | Lister/Créer/Modifier/Supprimer users | Oui | Non | Non | Non |
| Comptabilité | Comptes/Ecritures/Factures (CRUD + reporting) | Oui | Oui | Non | Non |
| RH Employés | CRUD + stats | Oui | Non | Oui | Non |
| RH Congés | Créer/consulter congé personnel | Oui | Oui | Oui | Oui |
| RH Congés | Traiter (approuver/refuser) | Oui | Non | Oui | Non |
| RH Fiches de paie | CRUD | Oui | Non | Oui | Non |
| Stocks Fournisseurs | Lire/Créer/Modifier | Oui | Non | Non | Oui |
| Stocks Fournisseurs | Supprimer | Oui | Non | Non | Non |
| Stocks Produits | Lire/Créer/Modifier | Oui | Non | Non | Oui |
| Stocks Produits | Supprimer | Oui | Non | Non | Non |
| Stocks Mouvements/Inventaire/Stats | Lire + mouvements | Oui | Non | Non | Oui |
| Clients | Lire/Créer | Oui | Oui | Non | Non |
| Clients | Modifier/Supprimer | Oui | Non | Non | Non |
| Dashboard | Lecture KPIs/graphes/alertes | Oui | Oui | Oui | Oui |
| Messagerie interne (lot post-étapes) | Envoi/réception entre utilisateurs connectés | Oui | Oui | Oui | Oui |

#### 6.3 Règles spéciales

- MAGASINIER peut consulter et modifier fournisseurs/produits/mouvements, mais ne peut pas supprimer fournisseur/produit.
- COMPTABLE peut créer et consulter les clients, mais ne peut ni modifier ni supprimer un client.
- RH peut consulter/traiter congés et gérer la paie, sans accès aux modules comptables et stocks.
- ADMIN dispose de tous les droits, y compris administration des utilisateurs.

#### 6.4 Implémentation technique RBAC

- Middleware authMiddleware : valide le JWT et attache req.user.
- Middleware checkRole(...roles) : bloque l'accès si req.user.role non autorisé (403).
- Application RBAC au niveau des routes Express (protection centralisée).
- Renforcement UI : masquage des actions sensibles selon rôle, en complément du contrôle backend.

---

### SECTION 7 — FONCTIONNALITÉS AVANCÉES

#### 7.1 Export PDF intelligent par rôle

- Technologie : jsPDF + jsPDF-AutoTable.
- Fonctionnement : export généré côté client depuis les datasets affichés, avec colonnes configurables et filtres (périodes/statuts).
- Données exportables par rôle :
  - Comptabilité : factures, comptes/balance.
  - RH : employés, congés, fiches de paie.
  - Stocks : produits, mouvements, inventaire.
  - Clients : liste clients.
- Interface : modal d'export dédiée avec options de sélection.

#### 7.2 Graphiques et visualisation (Recharts)

- Types de graphiques utilisés : LineChart, BarChart, PieChart.
- Données : endpoints dashboard dédiés consommés en temps réel (rafraîchissement périodique frontend).
- Agrégations MongoDB : CA mensuel, répartition des statuts de factures, masse salariale, stock par catégorie, mouvements sur période.

#### 7.3 Couleurs dégradées stock

- Logique : coloration visuelle selon ratio stock disponible / seuilAlerte.
- Formule de ratio : ratio = quantiteStock / max(seuilAlerte, 1).
- Interprétation :
  - ratio <= 1 : zone critique (rouge)
  - 1 < ratio <= 2 : zone attention (orange/ambre)
  - ratio > 2 : zone saine (vert)
- Palette utilisée : dégradés de rouge/ambre/vert pour lecture immédiate du risque.

#### 7.4 Sidebar hamburger responsive

- Desktop : sidebar fixe avec sous-menus déroulants par module.
- Mobile : sidebar en drawer avec overlay, ouverture/fermeture via bouton hamburger.
- Animations CSS : translate + transition (entrée/sortie fluide).
- Usabilité : fermeture automatique après navigation mobile + scroll vertical activé pour grands menus.

#### 7.5 Liaison Factures ↔ Clients

- Évolution : passage d'un stockage client texte à une référence ObjectId (Facture.client -> Client).
- Migration : script npm run migrate:clients pour convertir l'existant.
- Synchronisation : recalcul automatique des KPI client (chiffreAffaires, nombreFactures) après création/changement statut/suppression facture.
- Bénéfice : intégrité référentielle, navigation croisée facture/client, statistiques fiables.

#### 7.6 Historique des statuts employés

- Structure : tableau de sous-documents historiqueStatuts dans Employe.
- Traçabilité : chaque changement clôture l'ancien statut (dateFin) et ouvre un nouvel événement (dateDebut, motif, modifiePar).
- UI : affichage en timeline dans la fiche employé.

---

### SECTION 8 — PROCESSUS DE DÉVELOPPEMENT

#### Étape 0 — Architecture & Setup
- Objectif : poser l'architecture globale et initialiser les projets backend/frontend.
- Fichiers créés : structure dossiers, app.js, server.js, config DB, squelette frontend Vite.
- Fonctionnalités implémentées : base Express, connexion MongoDB, healthcheck API.
- Technologies introduites : Node.js, Express, MongoDB, Vite, React.
- Tests effectués : ping /api/health, démarrage des environnements local.

#### Étape 1 — Modèles MongoDB (Mongoose Schemas)
- Objectif : modéliser toutes les entités métier.
- Fichiers créés : User, CompteComptable, EcritureComptable, Facture, Employe, Conge, FichePaie, Fournisseur, Produit, MouvementStock.
- Fonctionnalités implémentées : validations, enums, index, hooks, virtuels.
- Technologies introduites : Mongoose ODM.
- Tests effectués : création/lecture de documents, validation contraintes.

#### Étape 2 — Authentification & JWT
- Objectif : sécuriser l'accès API.
- Fichiers créés : authController, authRoutes, authMiddleware, roleMiddleware, generateToken.
- Fonctionnalités implémentées : register/login/me/password, RBAC.
- Technologies introduites : jsonwebtoken, bcryptjs, express-validator.
- Tests effectués : scénarios login/token/401/403.

#### Étape 3 — API Module Comptabilité
- Objectif : livrer les API comptables.
- Fichiers créés : comptaController, comptaRoutes (+ compléments modèles).
- Fonctionnalités implémentées : comptes, écritures, grand livre, balance, factures + transitions.
- Technologies introduites : agrégations MongoDB ciblées compta.
- Tests effectués : CRUD, transitions statut, génération écritures, permissions.

#### Étape 4 — API Module RH
- Objectif : livrer les API RH.
- Fichiers créés : rhController, rhRoutes (+ compléments modèles RH).
- Fonctionnalités implémentées : employés, congés, paie, statistiques RH.
- Technologies introduites : logique jours ouvrés, soft delete, index unicité paie.
- Tests effectués : validations congés/solde, génération paie, droits RH.

#### Étape 5 — API Module Stocks
- Objectif : livrer les API de stock et traçabilité.
- Fichiers créés : stocksController, stocksRoutes.
- Fonctionnalités implémentées : fournisseurs, produits, mouvements, inventaire, alertes.
- Technologies introduites : hook post-save de synchronisation stock.
- Tests effectués : entrée/sortie stock, blocage insuffisance, permissions magasinier/admin.

#### Étape 6 — API Dashboard & Statistiques
- Objectif : fournir les données de pilotage global.
- Fichiers créés : dashboardController, dashboardRoutes.
- Fonctionnalités implémentées : KPIs, alertes, endpoints graphiques multi-modules.
- Technologies introduites : pipelines d'agrégation MongoDB avancés.
- Tests effectués : cohérence KPI vs données sources, contrôle d'accès authentifié.

#### Étape 7 — Frontend Setup & Auth
- Objectif : mettre en place SPA et authentification client.
- Fichiers créés : App.jsx, main.jsx, AuthContext, ProtectedRoute, Login, services API/auth.
- Fonctionnalités implémentées : login, stockage token, redirection, routes protégées.
- Technologies introduites : React Router v6, Axios, React Hook Form, Tailwind.
- Tests effectués : parcours login/logout, accès refusé sans token, redirections.

#### Étape 8 — Frontend Comptabilité & RH
- Objectif : livrer interfaces compta et RH.
- Fichiers créés : pages Comptabilite/*, pages RH/*, composants communs (DataTable, Modal, StatCard...).
- Fonctionnalités implémentées : tableaux, formulaires, CRUD, filtres, modales, détails.
- Technologies introduites : composants réutilisables et structuration UI modulaire.
- Tests effectués : scénarios métier par page, transitions factures, workflows RH.

#### Étape 9 — Frontend Stocks & Dashboard
- Objectif : finaliser pilotage visuel et stocks côté client.
- Fichiers créés : pages Stocks/*, Dashboard, composants graphiques.
- Fonctionnalités implémentées : inventaire visuel, alertes, graphiques Recharts, KPIs.
- Technologies introduites : Recharts.
- Tests effectués : vérification affichages graphiques et rafraîchissements.

#### Étape 10 — Tests, Docker & Finalisation
- Objectif : stabiliser, tester et préparer la livraison.
- Fichiers créés : tests Jest/Supertest, scripts et configurations de finalisation.
- Fonctionnalités implémentées : couverture des scénarios clés auth/compta/stocks.
- Technologies introduites : Jest, Supertest, outillage de packaging.
- Tests effectués : exécution complète des suites backend + tests fonctionnels manuels.

#### Améliorations UX post-étapes
- Module Clients avancé avec liaison ObjectId factures-clients.
- Export PDF intelligent par rôle.
- Dark mode / light mode global.
- Sidebar responsive (hamburger + scroll).
- Paramètres admin (gestion utilisateurs).
- Messagerie interne entre utilisateurs.

---

### SECTION 9 — DIFFICULTÉS ET ERREURS RENCONTRÉES

#### 9.1 Problèmes d'installation et configuration

1. Port 5000 déjà occupé par AirPlay macOS.
- Symptôme : erreur EADDRINUSE.
- Solution : définir PORT=5001 dans .env.

2. MongoDB non démarré (ECONNREFUSED 127.0.0.1:27017).
- Symptôme : échec de connexion Mongoose.
- Solution : brew services start mongodb-community.

3. Tailwind CSS v4 incompatible avec la configuration postcss standard du projet.
- Symptôme : build CSS en erreur.
- Solution : retour à Tailwind v3 + postcss.config.js classique.

4. App.jsx Vite par défaut avec contenu invalide causant PARSE_ERROR.
- Symptôme : page blanche ou erreur compilation JSX.
- Solution : réécriture complète App.jsx avec JSX valide.

5. Index Mongoose dupliqués (warnings au démarrage).
- Symptôme : avertissements de duplication d'index.
- Solution : suppression des schema.index() redondants.

#### 9.2 Problèmes d'authentification et tokens

1. Token JWT expiré (8h) causant des 401 pendant les tests.
- Solution : relancer login pour obtenir un nouveau token.

2. Header bearer en minuscule refusé par le middleware.
- Solution : utiliser systématiquement Authorization: Bearer <token>.

3. MODULE_NOT_FOUND sur comptaRoutes.
- Cause : import avant création du fichier.
- Solution : créer/valider le fichier puis monter la route dans app.js.

#### 9.3 Problèmes de base de données

1. Seed relancé créant des doublons.
- Solution : nettoyer la base avant reseed ou sécuriser idempotence.

2. Populate retournant null entraînant Cannot read properties of undefined.
- Solution : utiliser optional chaining (?.) et fallback défensif.

#### 9.4 Problèmes frontend

1. Page blanche React (écran Vite minimal).
- Solution : corriger main.jsx et index.css.

2. Token mal lu depuis localStorage causant 401 globales.
- Solution : corriger intercepteur Axios et aligner format réponse auth API.

3. Routes redirigées systématiquement vers /login (ProtectedRoute bug).
- Solution : corriger cycle de chargement AuthContext (setIsLoading(false)).

4. Cotisations salariales affichées à 0,00 MAD.
- Solution : calcul fallback côté frontend si non fourni par API.

#### 9.5 Difficultés conceptuelles

1. Confusion TYPE vs STATUT des comptes comptables.
- Clarification : ACTIF/PASSIF = nature comptable; ACTIF/INACTIF = état du compte.

2. Gestion des transitions de statut facture.
- Clarification : transitions limitées pour préserver la cohérence comptable.

3. Passage client texte -> ObjectId dans facture.
- Difficulté : migration des anciennes données et adaptation complète frontend/backend.
- Solution : script de migration dédié + virtuals de compatibilité.

#### 9.6 Difficultés liées à l'IA de développement

1. Génération parfois incohérente entre fichiers.
- Solution : validation systématique, tests, revues ciblées après génération IA.

2. Modèles IA indisponibles en cours de projet.
- Solution : bascule vers d'autres modèles (Gemini 2.5 Pro puis GPT-5.3-Codex) pour continuité.

3. Prompts trop longs dépassant la fenêtre de contexte.
- Solution : découpage en sous-tâches courtes et incrémentales.

---

### SECTION 10 — TESTS ET VALIDATION

#### 10.1 Tests backend (Jest + Supertest)

- Configuration : Jest en environnement Node, testMatch sur backend/src/__tests__/**/*.test.js, exécution en série (--runInBand).
- Modules testés : authentification, comptabilité, stocks.
- Scénarios couverts :
  - Auth : login valide/invalide, accès profil avec token.
  - Comptabilité : contrôle RBAC, création facture brouillon, validation facture.
  - Stocks : RBAC, entrée stock, blocage sortie en insuffisance.
- Résultats : 9 tests passés sur 9.

#### 10.2 Tests fonctionnels manuels

- Outil : Thunder Client (VS Code) et/ou Postman.
- Méthode : test systématique des routes par module avec profils utilisateurs différents.
- Scénarios : CRUD nominal, erreurs de validation, pagination/filtres, transitions métier, liens inter-modules.

#### 10.3 Tests de sécurité

- Test accès sans token -> 401 : valide.
- Test accès avec mauvais rôle -> 403 : valide.
- Test token expiré -> 401 : valide.
- Test validations input (email, password, champs requis) : valide.

---

### SECTION 11 — INSTRUCTIONS POUR LE RÉDACTEUR DU RAPPORT

INSTRUCTIONS :

1. Ce document est un brief technique complet pour rédiger un rapport universitaire PFE de niveau Bac+3/Bac+5.

2. Le rapport doit suivre cette structure :
- Pages préliminaires (dédicace, remerciements, résumé, table des matières, liste figures, abréviations)
- Chapitre 1 : Introduction générale
- Chapitre 2 : État de l'art & étude préalable
- Chapitre 3 : Analyse & Conception (avec diagrammes UML)
- Chapitre 4 : Réalisation & Implémentation
- Chapitre 5 : Tests & Validation
- Chapitre 6 : Conclusion & Perspectives
- Bibliographie & Webographie
- Annexes

3. Style rédactionnel :
- Français académique et professionnel
- Utiliser "nous" ou la forme passive
- Justifier chaque choix technique
- Référencer les figures avec "Figure X.X"
- Volume cible : 70-90 pages

4. Captures d'écran à intégrer (placeholders) :
L'étudiant ajoutera lui-même les captures d'écran.
Le rédacteur doit indiquer où chaque capture doit être insérée avec la mention :
[CAPTURE D'ÉCRAN : description de ce qui doit apparaître]

Captures nécessaires :
- Page de login
- Dashboard avec KPIs et graphiques
- Module Comptabilité - Liste des factures
- Module Comptabilité - Création facture
- Module Comptabilité - Balance générale
- Module RH - Liste des employés
- Module RH - Fiche employé avec historique statuts
- Module RH - Gestion des congés
- Module RH - Bulletin de paie
- Module Stocks - Liste des produits avec couleurs
- Module Stocks - Mouvements de stock
- Module Stocks - Inventaire
- Module Clients - Liste clients avec CA
- Sidebar hamburger ouverte/fermée
- Export PDF en action
- Diagramme de classes UML
- Architecture technique (schéma)
- Tests Jest passés

5. Diagrammes UML à inclure :
Le rédacteur doit prévoir des espaces pour :
- Diagramme de cas d'utilisation (Use Case)
- Diagramme de classes (à produire en PlantUML)
- Diagramme de séquence Login
- Diagramme de séquence Création Facture
- Diagramme de déploiement
Mentionner [DIAGRAMME UML : type] à chaque emplacement.

6. Points forts à mettre en valeur :
- Développement assisté par IA (GitHub Copilot)
- Architecture full-stack moderne
- Sécurité multi-niveaux (JWT + RBAC)
- Interface responsive avec animations
- Export PDF intelligent par rôle
- Traçabilité complète (stocks, statuts employés)
- Migration de données automatisée

---

### SECTION 12 — GLOSSAIRE TECHNIQUE

- ERP (Enterprise Resource Planning) : progiciel intégré centralisant les processus clés d'une entreprise (finance, RH, stocks, etc.).
- API REST : interface HTTP structurée autour des ressources et des verbes (GET, POST, PUT, DELETE).
- JWT (JSON Web Token) : jeton signé transportant des claims d'authentification/autorisation.
- RBAC (Role-Based Access Control) : contrôle d'accès basé sur les rôles utilisateurs.
- ODM (Object Document Mapper) : couche de mapping objet-document pour bases NoSQL (ex: Mongoose).
- SPA (Single Page Application) : application web qui charge une seule page et navigue côté client.
- CRUD (Create Read Update Delete) : opérations fondamentales de manipulation des données.
- ORM vs ODM : ORM cible des tables relationnelles SQL, ODM cible des documents NoSQL.
- NoSQL vs SQL : NoSQL privilégie flexibilité/scalabilité horizontale, SQL privilégie schéma strict et jointures relationnelles.
- MVC (Model-View-Controller) : séparation des responsabilités modèle, interface, logique de contrôle.
- Hot-reload / HMR : rechargement instantané des modules frontend sans refresh complet.
- Middleware : fonction intermédiaire exécutée dans le pipeline d'une requête HTTP.
- Populate (Mongoose) : résolution de références ObjectId en documents liés.
- Virtual (Mongoose) : propriété calculée non persistée dans la collection.
- Hook pre/post save : logique exécutée automatiquement avant/après sauvegarde d'un document.
- Soft Delete : suppression logique (désactivation) sans effacer physiquement l'enregistrement.
- Agrégation MongoDB : pipeline d'opérations ($match, $group, $project...) pour analyses statistiques.
- Responsive Design : adaptation de l'interface à différentes tailles d'écran.
- Token JWT : structure header.payload.signature.
- bcrypt / hachage : algorithme de dérivation sécurisé pour stocker les mots de passe.
- CORS : mécanisme navigateur de contrôle des requêtes cross-origin.

---

FIN DU BRIEF — Ce document est conçu pour permettre la rédaction d'un rapport PFE complet sans accès au code source.
