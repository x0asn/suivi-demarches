<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

/** Jeu de démonstration complet (comptes, dossiers) : réservé aux postes de développement et à la soutenance. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Les comptes de démonstration (mot de passe connu de tous) ne doivent jamais arriver sur un vrai serveur.
        if (app()->isProduction()) {
            throw new RuntimeException('Jeu de démonstration refusé en production. Utilisez : php artisan db:seed --class=ProductionSeeder --force');
        }

        $this->call([
            ReferentielsSeeder::class,
            MairiesSenegalSeeder::class,
            ModelesNotificationSeeder::class,
            UtilisateursDemoSeeder::class,
            AgentsMairiesSeeder::class,
            DossiersDemoSeeder::class,
        ]);
    }
}
