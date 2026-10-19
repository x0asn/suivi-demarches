<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Installation réelle : uniquement les référentiels, sans aucune donnée fictive.
 *
 *   - catégories et démarches (en brouillon : l'administrateur les vérifie puis les publie) ;
 *   - mairies du Sénégal et autres administrations, sans coordonnées inventées ;
 *   - modèles de notification.
 *
 * Aucun compte n'est créé : le premier administrateur se crée avec `php artisan admin:creer`.
 *
 *   php artisan db:seed --class=ProductionSeeder --force
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $referentiels = new ReferentielsSeeder;
        $referentiels->production = true;
        $referentiels->setContainer($this->container)->setCommand($this->command)->__invoke();

        $this->call([
            MairiesSenegalSeeder::class,
            ModelesNotificationSeeder::class,
        ]);
    }
}
