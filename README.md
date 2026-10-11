# Suivi Démarches

**Plateforme numérique de suivi des procédures administratives des citoyens**
pour les collectivités territoriales et les ministères.

> « Du dépôt de la demande à sa résolution : rendre la procédure compréhensible, traçable et accessible. »

Projet de fin d'études — Institut supérieur d'enseignement professionnel Amadou Trawaré de Diamniadio
Filière Développement Front-End · Promo 6 · 2025–2026
Équipe : Aida Sy Ndoye · Fatou Thior · Sokhna Cissé · Moustapha Gueye — Encadreur : Souleymane Harouna Maizaboura

---

## 1. Ce que fait la plateforme

| Acteur | Ce qu'il peut faire |
|---|---|
| **Citoyen** | Créer un compte (avec sa région du Sénégal et sa commune), consulter et rechercher les procédures, déposer un dossier avec ses pièces, suivre l'avancement (frise + historique), recevoir des notifications, échanger avec l'administration, déposer une réclamation |
| **Agent** | Voir la file de travail de **son** service, prendre un dossier en charge, accepter / refuser / faire corriger chaque pièce, faire avancer le dossier dans le circuit, écrire au citoyen ou laisser une note interne |
| **Administrateur** | Gérer les utilisateurs et leurs rôles, les procédures (rédaction, publication), les services, les modèles de notification, consulter le journal d'audit et les statistiques |
| **Responsable** | Consulter les indicateurs de pilotage et l'ensemble des dossiers |

Les dix modules du cahier des charges (M01 à M10) sont réalisés. Voir [docs/TRACABILITE.md](docs/TRACABILITE.md).

## 2. Technologies

| Couche | Choix |
|---|---|
| Interface | React 19 + Vite, React Router, Tailwind CSS 3, icônes Lucide, carte Leaflet / OpenStreetMap |
| API | Laravel 12 (PHP 8.2), authentification par jeton (Laravel Sanctum) |
| Base de données | MySQL 8 (via Laragon) |
| Tests | PHPUnit — 68 tests automatisés |

## 3. Installation (première fois)

Prérequis : **Laragon** (MySQL), **PHP 8.2+**, **Composer**, **Node.js 20+**.

```bash
# 1. Démarrer MySQL : ouvrir Laragon > « Démarrer tout »

# 2. API
cd backend
composer install
copy .env.example .env          # puis renseigner DB_DATABASE=suivi_demarches
php artisan key:generate
php artisan migrate --seed      # crée les tables et le jeu de démonstration

# 3. Interface
cd ../frontend
npm install
```

La base `suivi_demarches` doit exister dans MySQL (Laragon > Base de données, ou
`CREATE DATABASE suivi_demarches CHARACTER SET utf8mb4;`).

## 4. Lancer la plateforme

**Le plus simple :** démarrer Laragon, puis double-cliquer sur **`demarrer.bat`**.
Le navigateur s'ouvre sur http://localhost:5173.

À la main, dans deux terminaux :

```bash
cd backend  && php artisan serve --port=8000
cd frontend && npm run dev
```

Pour repartir de données propres (avant une répétition ou la soutenance) : **`reinitialiser-demo.bat`**.

## 5. Comptes de démonstration

Mot de passe commun : **`Demo2026`**. Sur la page de connexion, un encadré permet de remplir les identifiants en un clic.

| Rôle | E-mail | Remarque |
|---|---|---|
| Citoyen | `citoyen@suivi-demarches.sn` | Fatou Ba — 4 dossiers à différents stades, dont un « correction demandée » |
| Citoyen | `citoyen2@suivi-demarches.sn` | Moussa Sarr |
| Agent | `agent@suivi-demarches.sn` | Mariama Sow — Mairie de Dakar-Plateau |
| Agent | `agent2@suivi-demarches.sn` | Ousmane Ndiaye — Tribunal de grande instance de Dakar |
| Administrateur | `admin@suivi-demarches.sn` | Awa Diop |
| Responsable | `responsable@suivi-demarches.sn` | Ibrahima Fall |

Chaque service a un agent (`agent.diamniadio@…`, `agent.pikine@…`, `agent.thies@…`, etc.).

## 6. Scénario de démonstration (§28 du cahier des charges)

1. **Accueil** → rechercher « naissance » → ouvrir *Extrait d'acte de naissance* : conditions, pièces, étapes, service.
2. Se connecter en **citoyen** → *Commencer ma démarche* → le dossier reçoit une référence `DEM-2026-xxxxx`.
3. Déposer la pièce d'identité (glisser-déposer) → *Soumettre ma demande*.
4. Se connecter en **agent** (Mariama Sow) → le dossier apparaît dans la file → *Prendre en charge*.
5. Ouvrir la pièce, l'**accepter** (ou demander une correction avec un motif) → *Déclarer recevable* → *Valider*.
6. Revenir en **citoyen** → la cloche affiche la notification, la frise et l'historique sont à jour.
7. Se connecter en **administrateur** → *Statistiques* (indicateurs, évolution, délais par service) et *Journal d'audit* (chaque action est tracée).

Scénario de secours : le compte citoyen de démonstration possède déjà des dossiers à toutes les étapes.

## 7. Tests

```bash
cd backend
php artisan test
```

Les noms des tests reprennent les codes du cahier des charges (`test_rf001_…`, `test_rg006_…`) : ils servent de preuves dans la matrice de traçabilité.

## 8. Sécurité (§17)

- Mots de passe hachés (bcrypt), jamais stockés en clair ; jetons révoqués à la déconnexion et à la désactivation d'un compte.
- Droits vérifiés **côté serveur** (middleware de rôle + politiques d'accès) : un citoyen ne voit que ses dossiers, un agent que ceux de son service.
- Pièces justificatives stockées hors du dossier public, avec un nom aléatoire, téléchargeables uniquement par les personnes habilitées ; formats PDF/JPG/PNG et 5 Mo maximum.
- Limitation des tentatives de connexion, messages d'erreur génériques, journal d'audit des actions sensibles.
- Le fichier `.env` (secrets) n'est jamais versionné.

## 9. Données de démonstration

Les procédures, pièces, délais, coûts et coordonnées des services sont **illustratifs** : ils doivent
être vérifiés auprès des administrations concernées avant toute utilisation réelle (principe de rigueur, §4).
Les photos proviennent d'Unsplash (licence libre).

## 10. Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — organisation du code, dossier par dossier
- [docs/API.md](docs/API.md) — contrats de l'API REST
- [docs/TRACABILITE.md](docs/TRACABILITE.md) — exigences → écrans → tests
- [docs/conception/](docs/conception/) et [docs/maquettes/](docs/maquettes/) — UML, MCD/MLD et maquettes (à compléter)
- [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) — document de référence
