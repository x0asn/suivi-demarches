# Mise en ligne de Suivi Démarches

Ce guide décrit l'installation de l'application sur un **vrai serveur**, sans aucune donnée de démonstration.
Il s'adresse à la personne qui fera la mise en ligne (membre de l'équipe, service informatique de la mairie
ou hébergeur). Compter environ une heure la première fois.

> L'application n'est **pas** en ligne aujourd'hui. Tout ce qui suit est prêt et testé, mais n'a pas été exécuté
> sur un serveur public : la décision appartient à l'équipe.

---

## 1. Démonstration ou installation réelle : ce qui change

| | Poste de démonstration | Installation réelle |
|---|---|---|
| Lancement | `demarrer.bat` (serveurs de développement) | Nginx + PHP-FPM, site compilé (`npm run build`) |
| Données de départ | Comptes, dossiers et notifications fictifs (`DatabaseSeeder`) | Démarches, mairies et modèles de notification seulement (`ProductionSeeder`) |
| Comptes | Mot de passe commun `Demo2026` | Aucun ; le premier administrateur est créé avec `php artisan admin:creer` |
| Coordonnées des administrations | Téléphones, e-mails et horaires d'exemple | Vides, à saisir par l'administrateur |
| Démarches | Publiées | En brouillon : l'administrateur les vérifie (pièces, délais, **frais**) puis les publie |
| Erreurs | Détaillées (`APP_DEBUG=true`) | Message simple pour l'usager, détail dans le journal du serveur |
| Adresse | `http://localhost` | `https://` obligatoire |
| Paiement | PayDunya en mode test (aucun argent) | PayDunya en mode réel (compte validé) |
| Connexion | Sans limite de durée | Expire au bout de 7 jours |

Le jeu de démonstration **refuse de s'installer** quand `APP_ENV=production` : il est impossible de créer
par erreur les comptes `Demo2026` sur le vrai serveur.

---

## 2. Ce qu'il faut avant de commencer

- Un serveur Linux (Ubuntu 22.04 ou 24.04 conseillé), 2 Go de mémoire, 20 Go de disque.
- Un **nom de domaine** pointant vers ce serveur (exemple utilisé ici : `suivi-demarches.sn`).
- Les logiciels : PHP 8.2 ou plus (extensions `mbstring`, `xml`, `curl`, `zip`, `gd`, `mysql`, `intl`, `bcmath`),
  Composer 2, MySQL 8 (ou MariaDB 10.6+), Node.js 20 ou plus, Nginx, Git, Certbot.
- Un serveur d'envoi d'e-mails (SMTP) : nécessaire pour « mot de passe oublié ».
- Pour encaisser les frais : un compte PayDunya **validé** (documents de la mairie ou de la structure qui encaisse).

---

## 3. Installation pas à pas

### 3.1 Récupérer le code

```bash
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/x0asn/suivi-demarches.git
sudo chown -R $USER:www-data suivi-demarches
cd suivi-demarches
```

### 3.2 Base de données

Créer une base et un utilisateur **dédiés** (jamais `root`), avec un mot de passe long :

```sql
CREATE DATABASE suivi_demarches CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'suivi_demarches'@'localhost' IDENTIFIED BY 'un-mot-de-passe-long-et-unique';
GRANT ALL PRIVILEGES ON suivi_demarches.* TO 'suivi_demarches'@'localhost';
FLUSH PRIVILEGES;
```

### 3.3 Serveur (Laravel)

```bash
cd /var/www/suivi-demarches/backend
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
php artisan key:generate
nano .env          # remplir : adresses, base de données, e-mails, PayDunya
```

Chaque ligne de `.env` est expliquée dans le fichier lui-même. Points essentiels :
`APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` et `FRONTEND_URL` en `https://`.

```bash
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder --force
php artisan admin:creer       # premier administrateur (mot de passe : 12 caractères, majuscule, chiffre, symbole)

sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
chmod 600 .env

php artisan optimize          # met en cache réglages, adresses et vues
```

### 3.4 Site (React)

```bash
cd /var/www/suivi-demarches/frontend
npm ci
npm run build                 # produit le dossier dist/
```

Le site appelle l'API à l'adresse `/api` du même domaine : aucun réglage supplémentaire n'est nécessaire.

### 3.5 Nginx

Créer `/etc/nginx/snippets/suivi-securite.conf` (en-têtes de sécurité du site) :

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org; font-src 'self'; connect-src 'self'; frame-src blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
```

Puis `/etc/nginx/sites-available/suivi-demarches` :

```nginx
server {
    listen 80;
    server_name suivi-demarches.sn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name suivi-demarches.sn;
    # Les lignes ssl_certificate sont ajoutées par Certbot (étape 3.6).

    root /var/www/suivi-demarches/frontend/dist;
    index index.html;
    client_max_body_size 8m;          # pièces justificatives : 5 Mo maximum
    server_tokens off;
    include snippets/suivi-securite.conf;

    # API Laravel
    location ~ ^/(api|up)(/|$) {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/suivi-demarches/backend/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    # Fichiers compilés : mis en cache longtemps (leur nom change à chaque version)
    location /assets/ {
        include snippets/suivi-securite.conf;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Application React : toutes les autres adresses affichent index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Jamais de fichiers cachés (.env, .git…)
    location ~ /\. { deny all; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/suivi-demarches /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Dans `/etc/php/8.2/fpm/php.ini`, vérifier : `upload_max_filesize = 8M`, `post_max_size = 8M`,
`expose_php = Off`, puis `sudo systemctl restart php8.2-fpm`.

### 3.6 HTTPS

```bash
sudo certbot --nginx -d suivi-demarches.sn
```

Le certificat se renouvelle automatiquement.

### 3.7 Tâches automatiques

`sudo crontab -u www-data -e`, puis ajouter :

```cron
* * * * * cd /var/www/suivi-demarches/backend && php artisan schedule:run >> /dev/null 2>&1
```

(Nettoyage quotidien des connexions expirées.)

---

## 4. Vérification avant d'ouvrir au public

```bash
cd /var/www/suivi-demarches/backend
php artisan production:verifier
```

La commande contrôle chaque réglage et explique quoi corriger :

- ✔ réglé ;
- ⚠ à vérifier (n'empêche pas la mise en ligne) ;
- ✘ bloquant.

Elle doit afficher **« Prêt pour la mise en ligne »**.

Puis, dans le navigateur :

1. Ouvrir `https://suivi-demarches.sn` : la page d'accueil s'affiche, sans encadré « comptes de démonstration ».
2. Se connecter avec le compte administrateur.
3. **Administration > Services** : compléter adresse, téléphone et horaires des mairies concernées.
4. **Administration > Procédures** : vérifier chaque démarche (pièces, délais, **frais**), puis la publier.
5. **Administration > Utilisateurs** : créer les comptes des agents et les rattacher à leur mairie.
6. Créer un compte citoyen d'essai, déposer un dossier, payer (voir section 5), le traiter avec un compte agent.
7. Ouvrir `https://suivi-demarches.sn/up` : la page doit répondre (surveillance de disponibilité).

---

## 5. Paiement Wave et Orange Money (PayDunya)

1. Sur paydunya.com, faire **valider le compte** (documents demandés par PayDunya).
2. Dans l'application PayDunya : activer le **mode production**, garder les moyens de paiement
   **Wave Sénégal** et **Orange Money Sénégal**.
3. Copier les **clés de production** dans `backend/.env` :

   ```
   PAYDUNYA_MODE=live
   PAYDUNYA_MASTER_KEY=…
   PAYDUNYA_PRIVATE_KEY=…      (commence par live_private_)
   PAYDUNYA_TOKEN=…
   ```

4. Champ « notification de paiement » (IPN) de PayDunya :
   `https://suivi-demarches.sn/api/paiements/notification`.
   L'application transmet aussi cette adresse à chaque paiement.
5. `php artisan optimize`, puis payer une petite démarche réelle pour vérifier : le dossier doit afficher
   « Payé par Wave » (ou Orange Money) et l'agent doit le voir.

Sécurité : un paiement n'est jamais cru sur la parole du navigateur. L'application interroge PayDunya avant de
débloquer l'envoi, et vérifie la signature des avis de paiement.

---

## 6. Sauvegardes

À programmer dès le premier jour (exemple : chaque nuit, conservées 30 jours, copiées hors du serveur) :

```bash
# Base de données
mysqldump --single-transaction -u suivi_demarches -p suivi_demarches | gzip > /sauvegardes/base-$(date +%F).sql.gz
# Pièces justificatives déposées par les citoyens
tar -czf /sauvegardes/pieces-$(date +%F).tar.gz -C /var/www/suivi-demarches/backend/storage/app private
```

Conserver aussi une copie du fichier `backend/.env` dans un endroit sûr (il contient la clé `APP_KEY`, indispensable).

---

## 7. Mettre à jour l'application

```bash
cd /var/www/suivi-demarches
php backend/artisan down                       # page de maintenance
git pull
cd backend && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan optimize
cd ../frontend && npm ci && npm run build
php ../backend/artisan up
```

---

## 8. À ne jamais faire sur le vrai serveur

- Lancer `demarrer.bat`, `reinitialiser-demo.bat` ou `php artisan db:seed` sans `--class=ProductionSeeder`.
- Mettre `APP_DEBUG=true`.
- Publier ou envoyer le fichier `.env` (il contient les mots de passe et les clés PayDunya).
- Se connecter à MySQL avec `root` depuis l'application.
- Lancer `php artisan migrate:fresh` (efface toutes les données).
