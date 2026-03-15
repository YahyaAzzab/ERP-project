# ERP PME — Système de Gestion Intégré

> Projet de Fin d'Études (PFE) — ERP simplifié pour PME  
> Développé étape par étape, de l'architecture jusqu'au déploiement

---

## Description

Système ERP (Enterprise Resource Planning) simplifié, conçu pour les Petites et Moyennes Entreprises (PME). Il couvre trois modules fonctionnels complets :

| Module | Fonctionnalités |
|--------|----------------|
| **Comptabilité** | Journaux comptables, plan de comptes, bilan, grand livre |
| **RH** | Gestion des employés, congés, fiches de paie |
| **Stocks** | Produits, mouvements de stock, alertes de seuil |

---

## Stack Technique & Justification

### Node.js + Express

**Pourquoi ?**
- **JavaScript full-stack** : même langage côté frontend (React) et backend → montée en compétences unifiée, réutilisation du code (validations, constantes).
- **Non-bloquant & événementiel** : Node.js gère efficacement les I/O (requêtes DB, fichiers) avec son event loop, idéal pour une API REST avec beaucoup de requêtes simultanées.
- **Écosystème npm** : accès à des milliers de packages matures (JWT, bcrypt, mongoose…).
- **Express** est minimaliste et non-opinionated : on choisit exactement ce dont on a besoin, sans sur-engineering.

### MongoDB + Mongoose

**Pourquoi NoSQL pour cet ERP ?**

Contrairement aux idées reçues, MongoDB est pertinent ici pour plusieurs raisons :

1. **Schémas flexibles en PME** : les besoins évoluent rapidement. Ajouter un champ à une collection ne nécessite pas de migration de table (ALTER TABLE).
2. **Documents imbriqués** : une facture avec ses lignes d'articles est stockée dans un seul document → moins de JOINs, moins de latence.
3. **Scalabilité horizontale** : le sharding MongoDB est natif, pratique si l'ERP doit gérer plusieurs filiales.
4. **Format JSON natif** : les données vont de MongoDB → Node.js → React sans sérialisation/désérialisation complexe.
5. **Développement rapide** : prototypage et changements de modèles beaucoup plus rapides qu'avec des migrations SQL.

**Pourquoi Mongoose (et pas le driver MongoDB natif) ?**
- Définit des **schémas** avec types, validations, valeurs par défaut.
- Fournit des **modèles** (classes) avec des méthodes `.find()`, `.save()`, `.populate()`.
- Gère automatiquement les **timestamps** (`createdAt`, `updatedAt`).
- Permet des **middlewares** (hooks pre/post save) pour hacher un mot de passe avant sauvegarde, par exemple.

### React.js

**Pourquoi ?**
- **Composants réutilisables** : un composant `<DataTable>` ou `<StatCard>` est créé une fois, utilisé dans les 3 modules.
- **Virtual DOM** : mises à jour performantes sans re-render complet de la page.
- **React Router** : navigation mono-page (SPA) fluide entre Dashboard, Comptabilité, RH, Stocks.
- **Écosystème riche** : React Hook Form (formulaires), Recharts (graphiques), Tailwind (styles).
- **Standard de l'industrie** : compétence directement valorisable en entreprise.

### JWT (JSON Web Tokens)

**Pourquoi ?**
- **Stateless** : le serveur ne stocke pas les sessions en mémoire. Chaque requête porte son propre token → meilleure scalabilité.
- **Auto-contenu** : le token encode l'identité et les rôles de l'utilisateur (payload signé). Plus besoin de requête DB pour vérifier qui est connecté.
- **Standard ouvert** (RFC 7519) : compatible avec tous les clients (navigateur, mobile, CLI).
- **Expiration intégrée** : `exp` dans le payload → sécurité automatique après 8h.

---

## Arborescence du Projet

```
erp-pme/
│
├── backend/                          # API REST Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Connexion Mongoose à MongoDB
│   │   │
│   │   ├── controllers/              # Logique métier (CRUD) par module
│   │   │   ├── authController.js     # (étape 2) Login, register, refresh token
│   │   │   ├── comptaController.js   # (étape 3) Écritures, comptes, bilans
│   │   │   ├── rhController.js       # (étape 4) Employés, congés, fiches de paie
│   │   │   └── stocksController.js   # (étape 5) Produits, mouvements
│   │   │
│   │   ├── routes/                   # Définition des endpoints HTTP
│   │   │   ├── authRoutes.js         # POST /api/auth/login|register
│   │   │   ├── comptaRoutes.js       # GET|POST|PUT|DELETE /api/comptabilite
│   │   │   ├── rhRoutes.js           # GET|POST|PUT|DELETE /api/rh
│   │   │   └── stocksRoutes.js       # GET|POST|PUT|DELETE /api/stocks
│   │   │
│   │   ├── middleware/               # Fonctions intermédiaires Express
│   │   │   ├── authMiddleware.js     # (étape 2) Vérification token JWT
│   │   │   ├── roleMiddleware.js     # (étape 2) Contrôle des rôles (admin, rh…)
│   │   │   └── validateMiddleware.js # Validation des entrées (express-validator)
│   │   │
│   │   ├── models/                   # Schémas Mongoose (modèles MongoDB)
│   │   │   ├── User.js               # (étape 1) Utilisateurs & rôles
│   │   │   ├── Compte.js             # (étape 1) Plan comptable
│   │   │   ├── Ecriture.js           # (étape 1) Journaux comptables
│   │   │   ├── Employe.js            # (étape 1) Fiche employé
│   │   │   ├── Conge.js              # (étape 1) Demandes de congé
│   │   │   ├── Produit.js            # (étape 1) Catalogue produits
│   │   │   └── MouvementStock.js     # (étape 1) Entrées/sorties de stock
│   │   │
│   │   ├── utils/                    # Fonctions utilitaires réutilisables
│   │   │   ├── generateToken.js      # (étape 2) Génération JWT
│   │   │   └── apiResponse.js        # Helper pour réponses JSON standardisées
│   │   │
│   │   ├── app.js                    # Config Express : middlewares + routes
│   │   └── server.js                 # Point d'entrée : DB connect + listen
│   │
│   ├── .env.example                  # Template des variables d'environnement
│   ├── .env                          # Variables réelles (IGNORÉ par Git)
│   ├── .gitignore
│   └── package.json
│
├── frontend/                         # Application React.js (SPA)
│   ├── src/
│   │   ├── components/               # Composants UI réutilisables
│   │   │   ├── Layout/               # Navbar, Sidebar, Footer
│   │   │   ├── Common/               # Button, Modal, Table, Badge…
│   │   │   └── Charts/               # Graphiques Recharts
│   │   │
│   │   ├── pages/                    # Une page = une route React Router
│   │   │   ├── Login.jsx             # (étape 7) Formulaire d'authentification
│   │   │   ├── Dashboard.jsx         # (étape 9) Vue d'ensemble KPIs
│   │   │   ├── Comptabilite/         # (étape 8) Ecritures, comptes
│   │   │   ├── RH/                   # (étape 8) Employés, congés
│   │   │   └── Stocks/               # (étape 9) Produits, mouvements
│   │   │
│   │   ├── services/                 # Appels API avec Axios
│   │   │   ├── api.js                # Instance Axios avec baseURL + interceptors
│   │   │   ├── authService.js        # Login, logout, refresh token
│   │   │   ├── comptaService.js      # Appels API comptabilité
│   │   │   ├── rhService.js          # Appels API RH
│   │   │   └── stocksService.js      # Appels API stocks
│   │   │
│   │   ├── context/                  # State global React Context API
│   │   │   ├── AuthContext.jsx       # User connecté, token, rôles
│   │   │   └── ThemeContext.jsx      # Mode clair/sombre (optionnel)
│   │   │
│   │   ├── App.jsx                   # Routeur principal + providers
│   │   └── main.jsx                  # Point d'entrée React (ReactDOM.render)
│   │
│   └── package.json
│
└── README.md                         # Ce fichier
```

---

## Roadmap — 10 Étapes

- [x] **ÉTAPE 0** — Architecture & Setup ✅
- [x] **ÉTAPE 1** — Modèles MongoDB (Mongoose Schemas) ✅
- [x] **ÉTAPE 2** — Authentification & JWT : register, login, middleware de protection ✅
- [x] **ÉTAPE 3** — API Module Comptabilité : plan de comptes, journaux, grand livre ✅
- [x] **ÉTAPE 4** — API Module RH : employés, congés, fiches de paie ✅
- [x] **ÉTAPE 5** — API Module Stocks : produits, mouvements, alertes de seuil ✅
- [x] **ÉTAPE 6** — API Dashboard & Statistiques : agrégations MongoDB, KPIs ✅
- [x] **ÉTAPE 7** — Frontend Setup & Auth : Vite + React + Tailwind + login UI ✅
- [ ] **ÉTAPE 8** — Frontend Comptabilité & RH : tableaux, formulaires, CRUD
- [ ] **ÉTAPE 9** — Frontend Stocks & Dashboard : graphiques Recharts, alertes
- [ ] **ÉTAPE 10** — Tests, Docker & Finalisation : Jest, Supertest, Dockerfile

---

### Étape 7 : Frontend - Initialisation et Authentification

L'architecture frontend a été mise en place avec Vite, React et Tailwind CSS. Cette base inclut un système d'authentification complet et une structure de composants réutilisables.

**Composants clés créés :**

| Fichier | Rôle |
|---|---|
| `services/api.js` | Instance Axios centralisée avec intercepteurs pour l'ajout automatique du token JWT et la gestion globale des erreurs (ex: déconnexion si 401). |
| `services/authService.js` | Fonctions pour interagir avec l'API d'authentification (`login`, `logout`, `getCurrentUser`). |
| `context/AuthContext.jsx` | Contexte React pour partager l'état de l'utilisateur (données, token, rôles) à travers toute l'application. |
| `components/layout/ProtectedRoute.jsx` | HOC (Higher-Order Component) qui protège les routes. Il vérifie si un utilisateur est connecté et s'il possède les rôles requis avant d'autoriser l'accès. |
| `components/layout/Layout.jsx` | Structure principale de la page après connexion, incluant la `Sidebar` et le `Header`. |
| `components/layout/Sidebar.jsx` | Barre de navigation latérale. Les liens affichés sont conditionnels aux rôles de l'utilisateur connecté. |
| `pages/Login.jsx` | Page de connexion avec formulaire géré par `React Hook Form` pour une validation robuste et une expérience utilisateur soignée. |
| `App.jsx` | Configuration centrale du routeur (`React Router v6`) qui définit les routes publiques et protégées. |

**Flux d'authentification :**

1.  L'utilisateur arrive sur `/login`.
2.  Il soumet ses identifiants via le formulaire.
3.  `authService.login()` est appelé, envoyant une requête POST à `/api/auth/login`.
4.  Si les identifiants sont valides, le backend retourne un **token JWT** et les **données de l'utilisateur**.
5.  Le `token` et l'`user` sont sauvegardés dans le `localStorage` du navigateur.
6.  `AuthContext` est mis à jour, rendant l'état `isAuthenticated` à `true`.
7.  L'utilisateur est redirigé vers `/dashboard`.
8.  Pour chaque requête API suivante, l'intercepteur Axios attache automatiquement le token JWT.
9.  Si l'utilisateur se déconnecte, le `localStorage` est vidé et il est redirigé vers `/login`.

---

## Installation & Lancement

### Prérequis

- [Node.js](https://nodejs.org/) v18+ installé
- [MongoDB](https://www.mongodb.com/try/download/community) Community Server installé et démarré
- Git

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd erp-pme
```

### 2. Configurer le Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env à partir du template
cp .env.example .env

# Éditer .env avec vos valeurs (MongoDB URI, JWT_SECRET…)
# nano .env  (ou votre éditeur préféré)
```

### 3. Démarrer le Backend

```bash
# Depuis le dossier /backend
npm run dev
# Le serveur tourne sur http://localhost:5001
```

### 4. Configurer le Frontend

```bash
# Depuis la racine du projet, aller dans le dossier frontend
cd ../frontend

# Installer les dépendances
npm install

# Le fichier .env est déjà créé avec l'URL de l'API
```

### 5. Démarrer le Frontend

```bash
# Depuis le dossier /frontend
npm run dev
# L'application est accessible sur http://localhost:3000
```

### 6. Démarrer MongoDB (si pas déjà fait)
- [ ] **ÉTAPE 9** — Frontend Stocks & Dashboard : graphiques Recharts, alertes
- [ ] **ÉTAPE 10** — Tests, Docker & Finalisation : Jest, Supertest, Dockerfile

---

## Installation & Lancement

### Prérequis

- [Node.js](https://nodejs.org/) v18+ installé
- [MongoDB](https://www.mongodb.com/try/download/community) Community Server installé et démarré
- Git

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd erp-pme
```

### 2. Configurer le Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env à partir du template
cp .env.example .env

# Éditer .env avec vos valeurs (MongoDB URI, JWT_SECRET…)
# nano .env  (ou votre éditeur préféré)
```

### 3. Démarrer MongoDB (si pas déjà fait)

```bash
# macOS (avec Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 4. Démarrer le Backend

```bash
# Depuis le dossier backend/
npm run dev
# → Serveur démarré sur http://localhost:5001
# → MongoDB connecté
```

### 5. Tester l'API

```bash
curl http://localhost:5001/api/health
# Réponse : {"status":"OK","message":"ERP API running",...}
```

### 6. Démarrer le Frontend (étape 7+)

```bash
cd ../frontend
npm install
npm run dev
# → Application disponible sur http://localhost:3001
```

---

## Variables d'Environnement Requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute du serveur Express | `5001` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/erp-pme` |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT (min. 32 chars en prod) | `ma_cle_super_secrete_2026` |
| `JWT_EXPIRES_IN` | Durée de validité d'un token JWT | `8h` |
| `NODE_ENV` | Environnement d'exécution | `development` / `production` / `test` |
| `FRONTEND_URL` | URL du frontend (pour CORS en production) | `https://erp.monentreprise.com` |

> ⚠️ Ne jamais committer le fichier `.env` dans Git. Il est listé dans `.gitignore`.

---

## Scripts Disponibles

### Backend

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur en mode développement (nodemon, hot-reload) |
| `npm start` | Démarre le serveur en mode production |
| `npm test` | Lance la suite de tests Jest |
| `npm run test:watch` | Lance les tests en mode watch |

### Frontend

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre Vite en mode développement |
| `npm run build` | Compile pour la production |
| `npm run preview` | Prévisualise le build de production |

---

## Modèles MongoDB — ÉTAPE 1 ✅

### Module Auth

| Modèle | Fichier | Champs clés | Particularités |
|--------|---------|-------------|----------------|
| `User` | `models/User.js` | email, password, role (ADMIN\|COMPTABLE\|RH\|MAGASINIER), actif | Hook pre-save : hash bcrypt auto, `select: false` sur password, méthode `verifierPassword()` |

### Module Comptabilité

| Modèle | Fichier | Champs clés | Particularités |
|--------|---------|-------------|----------------|
| `CompteComptable` | `models/CompteComptable.js` | numero (3-6 chiffres), libelle, type (ACTIF\|PASSIF\|CHARGE\|PRODUIT) | Index unique sur numero |
| `EcritureComptable` | `models/EcritureComptable.js` | date, libelle, montantDebit, montantCredit, compte (ref), journal | Ref vers CompteComptable et Facture, index composé (compte + date) |
| `Facture` | `models/Facture.js` | numero, clientNom, lignes[], montantHT, tva, montantTTC, statut | **Lignes imbriquées** (sous-documents), calcul auto des totaux en pre-save |

### Module RH

| Modèle | Fichier | Champs clés | Particularités |
|--------|---------|-------------|----------------|
| `Employe` | `models/Employe.js` | matricule, nom, prenom, poste, departement, dateEmbauche, salaireBrut, statut | Virtuel `nomComplet` et `anciennete` (années) |
| `Conge` | `models/Conge.js` | employe (ref), type, dateDebut, dateFin, statut | Validation pre-save dateFin >= dateDebut, virtuel `nombreJours` |
| `FichePaie` | `models/FichePaie.js` | employe (ref), mois, annee, cotisations[], salaireNet | Index unique (employe + mois + annee), cotisations comme sous-documents |

### Module Stocks

| Modèle | Fichier | Champs clés | Particularités |
|--------|---------|-------------|----------------|
| `Fournisseur` | `models/Fournisseur.js` | nom, email, telephone, adresse (imbriqué) | Adresse comme sous-document |
| `Produit` | `models/Produit.js` | reference, designation, categorie, quantiteStock, seuilAlerte, prixUnitaire | Virtuels `enAlerte` et `valeurStock`, ref Fournisseur |
| `MouvementStock` | `models/MouvementStock.js` | produit (ref), type (ENTREE\|SORTIE\|AJUSTEMENT), quantite, motif | **Hook post-save** : met à jour automatiquement `quantiteStock` du Produit |

---

## Seed — Données de Test

```bash
# Depuis le dossier backend/
npm run seed
```

Le seed crée :
- **4 utilisateurs** (1 ADMIN, 1 COMPTABLE, 1 RH, 1 MAGASINIER)
- **12 comptes comptables** (plan comptable de base)
- **3 fournisseurs**
- **10 produits** (informatique, mobilier, fournitures)
- **5 employés** avec fiches de paie Février 2026
- **3 congés**
- **3 factures** (dont 1 payée avec écritures comptables)
- **7 écritures comptables**
- **6 mouvements de stock**

### Comptes de test générés par le seed

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| ADMIN | admin@erp-pme.ma | Admin@1234 |
| COMPTABLE | f.benali@erp-pme.ma | Compta@1234 |
| RH | y.cherkaoui@erp-pme.ma | RH@12345678 |
| MAGASINIER | s.idrissi@erp-pme.ma | Mag@12345678 |

---

## Authentification & Sécurité — ÉTAPE 2 ✅

### Routes Auth

| Méthode | Route | Auth requise | Rôles | Description |
|---------|-------|-------------|--------|-------------|
| `POST` | `/api/auth/register` | Non | — | Créer un compte |
| `POST` | `/api/auth/login` | Non | — | Connexion + token JWT |
| `GET`  | `/api/auth/me` | Oui (JWT) | Tous | Profil utilisateur connecté |
| `PUT`  | `/api/auth/password` | Oui (JWT) | Tous | Changer son mot de passe |

### Utiliser le token dans les requêtes suivantes

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Après un login réussi, stocke le token reçu et envoie-le dans le header `Authorization` de **toutes** les requêtes protégées.

### Matrice des rôles et permissions

| Module | Endpoint | ADMIN | COMPTABLE | RH | MAGASINIER |
|--------|----------|-------|-----------|----|------------|
| Auth | register / login | ✅ | ✅ | ✅ | ✅ |
| Auth | me / password | ✅ | ✅ | ✅ | ✅ |
| **Comptabilité** | CRUD comptes / écritures / factures | ✅ | ✅ | ❌ | ❌ |
| **RH** | CRUD employés / congés / fiches paie | ✅ | ❌ | ✅ | ❌ |
| **Stocks** | CRUD produits / mouvements | ✅ | ❌ | ❌ | ✅ |
| **Dashboard** | Lecture statistiques | ✅ | ✅ | ✅ | ✅ |

### Fichiers créés (ÉTAPE 2)

| Fichier | Rôle |
|---------|------|
| `utils/generateToken.js` | Génère un JWT signé avec `_id`, `email`, `role` |
| `utils/apiResponse.js` | Helpers `success()`, `error()`, `paginate()`, `created()` |
| `middleware/authMiddleware.js` | Vérifie le token JWT, attach `req.user` |
| `middleware/roleMiddleware.js` | RBAC — `checkRole('ADMIN','RH')` sur les routes |
| `controllers/authController.js` | `register`, `login`, `me`, `updatePassword` |
| `routes/authRoutes.js` | Monte les 4 routes avec validation `express-validator` |

---

## Tests API (ÉTAPE 2)

### Test 1 — Register
```http
POST http://localhost:5001/api/auth/register
Content-Type: application/json

{
  "nom": "Test",
  "prenom": "User",
  "email": "test@test.com",
  "password": "Test@1234",
  "role": "ADMIN"
}

# Réponse attendue : 201 + { user: {...}, token: "eyJ..." }
```

### Test 2 — Login (avec les données du seed)
```http
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@erp-pme.ma",
  "password": "Admin@1234"
}

# Réponse attendue : 200 + { user: {...}, token: "eyJ..." }
```

### Test 3 — Profil (avec token)
```http
GET http://localhost:5001/api/auth/me
Authorization: Bearer <token_du_test_2>

# Réponse attendue : 200 + profil utilisateur
```

### Test 4 — Profil (sans token)
```http
GET http://localhost:5001/api/auth/me

# Réponse attendue : 401 “Token manquant”
```

---

## Module Comptabilite — ETAPE 3 ✅

### Routes Comptabilite

| Methode | Route | Auth | Roles | Description |
|---------|-------|------|-------|-------------|
| `GET` | `/api/comptabilite/comptes` | Oui | ADMIN, COMPTABLE | Lister les comptes (filtres type/search/actif) |
| `POST` | `/api/comptabilite/comptes` | Oui | ADMIN, COMPTABLE | Creer un compte comptable |
| `GET` | `/api/comptabilite/comptes/:id` | Oui | ADMIN, COMPTABLE | Detail d'un compte |
| `PUT` | `/api/comptabilite/comptes/:id` | Oui | ADMIN, COMPTABLE | Modifier libelle/description/actif |
| `DELETE` | `/api/comptabilite/comptes/:id` | Oui | ADMIN, COMPTABLE | Supprimer si aucune ecriture associee |
| `GET` | `/api/comptabilite/ecritures` | Oui | ADMIN, COMPTABLE | Lister les ecritures (filtres + pagination) |
| `POST` | `/api/comptabilite/ecritures` | Oui | ADMIN, COMPTABLE | Creer une ecriture comptable |
| `GET` | `/api/comptabilite/ecritures/:id` | Oui | ADMIN, COMPTABLE | Detail d'une ecriture |
| `PUT` | `/api/comptabilite/ecritures/:id` | Oui | ADMIN, COMPTABLE | Modifier une ecriture non verrouillee |
| `DELETE` | `/api/comptabilite/ecritures/:id` | Oui | ADMIN, COMPTABLE | Supprimer une ecriture non verrouillee |
| `GET` | `/api/comptabilite/grand-livre/:compteId` | Oui | ADMIN, COMPTABLE | Grand livre avec solde progressif |
| `GET` | `/api/comptabilite/balance` | Oui | ADMIN, COMPTABLE | Balance generale debit/credit/solde |
| `GET` | `/api/comptabilite/factures` | Oui | ADMIN, COMPTABLE | Lister les factures (filtres + pagination) |
| `POST` | `/api/comptabilite/factures` | Oui | ADMIN, COMPTABLE | Creer facture brouillon + numero auto |
| `GET` | `/api/comptabilite/factures/:id` | Oui | ADMIN, COMPTABLE | Detail facture avec ecritures |
| `PUT` | `/api/comptabilite/factures/:id` | Oui | ADMIN, COMPTABLE | Modifier uniquement une facture BROUILLON |
| `PATCH` | `/api/comptabilite/factures/:id/statut` | Oui | ADMIN, COMPTABLE | Changer le statut selon transitions autorisees |
| `DELETE` | `/api/comptabilite/factures/:id` | Oui | ADMIN, COMPTABLE | Supprimer uniquement une facture BROUILLON |

### Regles metier importantes

- Numerotation auto facture : `FAC-ANNEE-XXXX` (ex: `FAC-2026-0004`) avec increment automatique.
- Transitions autorisees : `BROUILLON -> VALIDEE`, `VALIDEE -> PAYEE`, `BROUILLON -> ANNULEE`, `VALIDEE -> ANNULEE`.
- Validation facture (`BROUILLON -> VALIDEE`) : creation automatique de 2 ecritures (debit 411 Clients, credit 701 Ventes).
- Facture verrouillee : une facture `VALIDEE` ou `PAYEE` ne peut plus etre modifiee/supprimee.
- Compte verrouille : suppression interdite si des ecritures existent deja sur ce compte.

### Tests Thunder Client / Postman

#### Test 1 — Lister les comptes (token COMPTABLE)
`GET http://localhost:5001/api/comptabilite/comptes`

Header:
`Authorization: Bearer <token_comptable>`

Resultat attendu: `200` + liste (12 comptes seedes)

#### Test 2 — Creer une facture
`POST http://localhost:5001/api/comptabilite/factures`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

Body:
```json
{
  "client": { "nom": "Societe ABC", "email": "abc@test.ma" },
  "lignes": [
    { "designation": "Prestation conseil", "quantite": 2, "prixUnitaire": 1500 },
    { "designation": "Formation", "quantite": 1, "prixUnitaire": 3000 }
  ],
  "tva": 20
}
```

Resultat attendu: `201` + facture `BROUILLON` avec numero auto et montants calcules

#### Test 3 — Valider la facture
`PATCH http://localhost:5001/api/comptabilite/factures/:id/statut`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

Body:
```json
{ "statut": "VALIDEE" }
```

Resultat attendu: `200` + statut maj + 2 ecritures creees automatiquement

#### Test 4 — Grand livre d'un compte
`GET http://localhost:5001/api/comptabilite/grand-livre/:compteId`

Header:
`Authorization: Bearer <token>`

Resultat attendu: `200` + ecritures du compte avec `soldeCumulatif`

#### Test 5 — Balance generale
`GET http://localhost:5001/api/comptabilite/balance`

Header:
`Authorization: Bearer <token>`

Resultat attendu: `200` + comptes + totaux debit/credit/solde + regroupement par type

#### Test 6 — Acces refuse (role RH)
`GET http://localhost:5000/api/comptabilite/comptes`

Header:
`Authorization: Bearer <token_rh>`

Resultat attendu: `403` acces refuse

---

## Module RH — ETAPE 4 ✅

### Routes RH

| Méthode | Route | Auth | Rôles | Description |
|---------|-------|------|-------|-------------|
| `GET` | `/api/rh/employes` | Oui | ADMIN, RH | Lister les employés (filtres + pagination) |
| `POST` | `/api/rh/employes` | Oui | ADMIN, RH | Créer un employé avec matricule auto |
| `GET` | `/api/rh/employes/statistiques` | Oui | ADMIN, RH | Obtenir les statistiques RH clés |
| `GET` | `/api/rh/employes/:id` | Oui | ADMIN, RH | Détail d'un employé |
| `PUT` | `/api/rh/employes/:id` | Oui | ADMIN, RH | Mettre à jour un employé |
| `DELETE` | `/api/rh/employes/:id` | Oui | ADMIN, RH | Désactiver un employé (soft delete) |
| `GET` | `/api/rh/conges` | Oui | Tous | Lister les congés (soi-même ou tous si RH/Admin) |
| `POST` | `/api/rh/conges` | Oui | Tous | Créer une demande de congé |
| `GET` | `/api/rh/conges/:id` | Oui | Tous | Détail d'un congé |
| `PUT` | `/api/rh/conges/:id/traiter` | Oui | ADMIN, RH | Approuver ou refuser un congé |
| `PUT` | `/api/rh/conges/:id/annuler` | Oui | Tous | Annuler une demande de congé |
| `GET` | `/api/rh/employes/:id/solde-conges` | Oui | ADMIN, RH | Consulter le solde de congés d'un employé |
| `GET` | `/api/rh/fiches-paie` | Oui | ADMIN, RH | Lister les fiches de paie (filtres) |
| `POST` | `/api/rh/fiches-paie` | Oui | ADMIN, RH | Générer une fiche de paie |
| `GET` | `/api/rh/fiches-paie/:id` | Oui | ADMIN, RH | Détail d'une fiche de paie |
| `PUT` | `/api/rh/fiches-paie/:id` | Oui | ADMIN, RH | Modifier primes/retenues sur une fiche |
| `DELETE` | `/api/rh/fiches-paie/:id` | Oui | ADMIN, RH | Supprimer une fiche de paie |

### Règles métier importantes

- **Génération matricule** : `EMP-XXX` est généré automatiquement en s'incrémentant.
- **Jours ouvrés** : Le calcul des jours de congé exclut les samedis et dimanches.
- **Solde de congés** : Une demande de congé `ANNUEL` est bloquée si le solde est insuffisant. Le solde est déduit à l'approbation.
- **Soft Delete** : Les employés ne sont jamais supprimés de la base, leur statut passe à `INACTIF` pour conserver l'historique.
- **Calculs Fiche de Paie** : Les cotisations salariales (22%) et patronales (30%) sont calculées automatiquement à partir du salaire brut.
- **Unicité Fiche de Paie** : Un index unique sur le modèle Mongoose empêche de créer deux fiches pour le même employé, le même mois et la même année.

---

## Module Stocks — ETAPE 5 ✅

### Routes Stocks

| Méthode | Route | Auth | Rôles | Description |
|---------|-------|------|-------|-------------|
| `GET` | `/api/stocks/fournisseurs` | Oui | ADMIN, MAGASINIER | Lister les fournisseurs |
| `POST` | `/api/stocks/fournisseurs` | Oui | ADMIN, MAGASINIER | Créer un fournisseur |
| `GET` | `/api/stocks/fournisseurs/:id` | Oui | ADMIN, MAGASINIER | Détail d'un fournisseur |
| `PUT` | `/api/stocks/fournisseurs/:id` | Oui | ADMIN, MAGASINIER | Mettre à jour un fournisseur |
| `DELETE` | `/api/stocks/fournisseurs/:id` | Oui | ADMIN | Supprimer un fournisseur |
| `GET` | `/api/stocks/produits` | Oui | ADMIN, MAGASINIER | Lister les produits (filtres + pagination) |
| `POST` | `/api/stocks/produits` | Oui | ADMIN, MAGASINIER | Créer un produit avec référence auto |
| `GET` | `/api/stocks/produits/alertes` | Oui | ADMIN, MAGASINIER | Lister les produits en alerte de stock |
| `GET` | `/api/stocks/produits/categories` | Oui | ADMIN, MAGASINIER | Obtenir la liste des catégories uniques |
| `GET` | `/api/stocks/produits/:id` | Oui | ADMIN, MAGASINIER | Détail d'un produit |
| `PUT` | `/api/stocks/produits/:id` | Oui | ADMIN, MAGASINIER | Mettre à jour un produit |
| `DELETE` | `/api/stocks/produits/:id` | Oui | ADMIN | Supprimer un produit |
| `GET` | `/api/stocks/mouvements` | Oui | ADMIN, MAGASINIER | Lister les mouvements de stock |
| `GET` | `/api/stocks/mouvements/:id` | Oui | ADMIN, MAGASINIER | Détail d'un mouvement |
| `POST` | `/api/stocks/mouvements/entree` | Oui | ADMIN, MAGASINIER | Enregistrer une entrée de stock |
| `POST` | `/api/stocks/mouvements/sortie` | Oui | ADMIN, MAGASINIER | Enregistrer une sortie de stock |
| `POST` | `/api/stocks/mouvements/ajustement` | Oui | ADMIN, MAGASINIER | Corriger le stock (ajustement) |
| `GET` | `/api/stocks/inventaire` | Oui | ADMIN, MAGASINIER | Obtenir l'état complet de l'inventaire |
| `GET` | `/api/stocks/statistiques` | Oui | ADMIN, MAGASINIER | Obtenir les statistiques du module stock |

### Règles métier importantes

- **Génération référence** : `PROD-XXX` est généré automatiquement en s'incrémentant pour chaque nouveau produit.
- **Gestion du stock atomique** : La quantité en stock d'un produit ne peut **jamais** être modifiée directement. Elle est mise à jour **uniquement** via la création d'un mouvement (entrée, sortie, ajustement). Cela garantit une traçabilité parfaite.
- **Contrôle de stock** : Toute sortie est bloquée si la quantité demandée est supérieure au stock disponible. Une alerte est générée si une sortie fait passer le stock sous le seuil défini.
- **Traçabilité des mouvements** : Chaque mouvement enregistre la quantité *avant* et *après* l'opération, ainsi que l'utilisateur responsable (`effectuePar`), pour un audit complet.
- **Suppression contrôlée** : Un fournisseur ne peut être supprimé s'il a des produits actifs. Un produit ne peut être supprimé s'il a un historique de mouvements.

---

## Dashboard & Statistiques — ETAPE 6 ✅

### Routes Dashboard

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/dashboard/kpis` | Oui | Récupère tous les indicateurs de performance clés (KPIs) |
| `GET` | `/api/dashboard/alertes` | Oui | Récupère toutes les alertes actives (stocks, congés, factures) |
| `GET` | `/api/dashboard/graphique/ca` | Oui | Données pour le graphique du CA sur 12 mois |
| `GET` | `/api/dashboard/graphique/factures-statut` | Oui | Données pour le graphique de répartition des factures par statut |
| `GET` | `/api/dashboard/graphique/employes-departement` | Oui | Données pour le graphique de répartition des employés par département |
| `GET` | `/api/dashboard/graphique/masse-salariale` | Oui | Données pour le graphique d'évolution de la masse salariale |
| `GET` | `/api/dashboard/graphique/conges` | Oui | Données pour les graphiques de répartition des congés |
| `GET` | `/api/dashboard/graphique/mouvements-stock` | Oui | Données pour le graphique des mouvements de stock sur 30 jours |
| `GET` | `/api/dashboard/graphique/stock-categorie` | Oui | Données pour le graphique de la valeur du stock par catégorie |

### KPIs et Données Retournés

- **KPIs Généraux** : Chiffre d'affaires (mois actuel, précédent, évolution), factures impayées (nombre, montant), effectif RH, congés en attente, masse salariale, nombre de produits, produits en alerte, et valeur totale du stock.
- **Graphiques** : Chaque endpoint de graphique retourne des données pré-formatées pour être directement consommables par une librairie de graphiques comme Recharts ou Chart.js côté frontend.
- **Alertes** : Un point centralisé pour remonter les actions urgentes nécessaires dans l'ERP (stocks bas, congés à traiter, factures en retard).

---

## Frontend Modules — ETAPE 8 COMPLETEE ✅

### Composants communs crees

- `frontend/src/components/common/StatCard.jsx`
- `frontend/src/components/common/DataTable.jsx`
- `frontend/src/components/common/Modal.jsx`
- `frontend/src/components/common/Badge.jsx`
- `frontend/src/components/common/SearchBar.jsx`

### Services API crees

- `frontend/src/services/comptaService.js`
  - Comptes: `getComptes`, `createCompte`, `updateCompte`, `deleteCompte`
  - Ecritures: `getEcritures`, `createEcriture`
  - Factures: `getFactures`, `getFactureById`, `createFacture`, `updateFacture`, `updateStatutFacture`, `deleteFacture`
  - Reporting: `getBalance`, `getGrandLivre`
- `frontend/src/services/rhService.js`
  - Employes: `getEmployes`, `getEmployeById`, `createEmploye`, `updateEmploye`, `deleteEmploye`, `getStatistiquesRH`
  - Conges: `getConges`, `createConge`, `traiterConge`, `annulerConge`
  - Fiches de paie: `getFichesPaie`, `genererFichePaie`, `deleteFichePaie`

### Pages Comptabilite crees

- `frontend/src/pages/Comptabilite/index.jsx` (onglets Factures, Comptes, Ecritures, Balance)
- `frontend/src/pages/Comptabilite/Factures.jsx`
  - Liste + recherche + filtre statut
  - Creation de facture (lignes dynamiques)
  - Changement de statut avec transitions metier
  - Consultation detail facture
- `frontend/src/pages/Comptabilite/Comptes.jsx`
  - Liste filtree par type
  - Creation/edition/suppression de compte
- `frontend/src/pages/Comptabilite/Ecritures.jsx`
  - Liste des ecritures
  - Creation d'ecriture liee a un compte
- `frontend/src/pages/Comptabilite/Balance.jsx`
  - Balance generale debit/credit/solde
  - Totaux globaux + actualisation

### Pages RH crees

- `frontend/src/pages/RH/index.jsx` (onglets Employes, Conges, Fiches de Paie)
- `frontend/src/pages/RH/Employes.jsx`
  - StatCards RH (total, actifs, masse salariale)
  - Liste filtree + creation/edition + desactivation
- `frontend/src/pages/RH/Conges.jsx`
  - Liste des conges + filtre statut
  - Creation de demande avec calcul des jours ouvres
  - Actions approuver/refuser/annuler selon role et statut
- `frontend/src/pages/RH/FichesPaie.jsx`
  - Filtre mois/annee
  - Generation des fiches
  - Liste et consultation detail bulletin

### Routing frontend mis a jour

- Routes principales: `/comptabilite`, `/rh`
- Sous-routes: `/comptabilite/factures`, `/comptabilite/comptes`, `/comptabilite/balance`, `/rh/employes`, `/rh/conges`, `/rh/fiches-paie`
- Port frontend Vite: `http://localhost:3001`

### Prochaine etape

**ETAPE 9 — Stocks & Dashboard**

---



*ERP PME — Projet de Fin d'Études | Stack : Node.js + Express + MongoDB + React*
