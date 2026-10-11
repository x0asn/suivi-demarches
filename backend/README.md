# Suivi Démarches — API

API REST de la plateforme, écrite avec Laravel 12 (PHP 8.2) et MySQL. Elle porte les règles
métier, la sécurité et les données ; l'interface se trouve dans [../frontend](../frontend).

## Commandes

```bash
composer install                 # installer les dépendances
php artisan migrate --seed       # créer les tables et les données de démonstration
php artisan serve --port=8000    # lancer l'API sur http://localhost:8000
php artisan test                 # lancer les tests
vendor/bin/pint                  # appliquer le style de code
```

L'installation complète est décrite dans le [README principal](../README.md).

## Où trouver quoi

| Dossier | Contenu |
|---|---|
| `routes/api.php` | Liste des adresses de l'API |
| `app/Http/Controllers/Api/` | Contrôleurs (`Admin/` pour l'administration) |
| `app/Http/Requests/` | Validation des données envoyées |
| `app/Http/Resources/` | Mise en forme des réponses JSON |
| `app/Http/Middleware/` | Contrôle du rôle et du compte actif |
| `app/Policies/` | Droits d'accès aux dossiers et aux réclamations |
| `app/Services/` | Règles métier : workflow, notifications, journal d'audit |
| `app/Models/` et `app/Enums/` | Données, rôles et statuts |
| `database/` | Migrations et données de démonstration |
| `tests/` | Tests unitaires et tests de parcours |

Le détail est dans [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) et les contrats de l'API
dans [../docs/API.md](../docs/API.md).
