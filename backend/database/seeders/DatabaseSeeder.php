<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ReferentielsSeeder::class,
            MairiesSenegalSeeder::class,
            ModelesNotificationSeeder::class,
            UtilisateursDemoSeeder::class,
            DossiersDemoSeeder::class,
        ]);
    }
}
