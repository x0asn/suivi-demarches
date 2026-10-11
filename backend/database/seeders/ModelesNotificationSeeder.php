<?php

namespace Database\Seeders;

use App\Models\ModeleNotification;
use App\Services\Notifieur;
use Illuminate\Database\Seeder;

/** RF-020 : modèles de notification initiaux, modifiables ensuite par l'administrateur. */
class ModelesNotificationSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Notifieur::MODELES as $evenement => [$libelle, $titre, $message, $email]) {
            ModeleNotification::updateOrCreate(['evenement' => $evenement], [
                'libelle' => $libelle,
                'titre' => $titre,
                'message' => $message,
                'email' => $email,
                'actif' => true,
            ]);
        }
    }
}
