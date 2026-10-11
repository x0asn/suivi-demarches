<?php

namespace Database\Seeders;

use App\Models\Procedure;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Référence toutes les mairies du Sénégal (une par commune) dans le module M08,
 * et les habilite pour les démarches traitées en mairie.
 *
 * Source : database/data/communes-senegal.json (OpenStreetMap, licence ODbL).
 * La position enregistrée est le centre du territoire de la commune : l'adresse exacte,
 * les horaires et le téléphone de chaque mairie restent à compléter par l'administrateur.
 * Les mairies déjà présentes (jeu de démonstration) ne sont pas modifiées.
 */
class MairiesSenegalSeeder extends Seeder
{
    public function run(): void
    {
        $donnees = json_decode(file_get_contents(database_path('data/communes-senegal.json')), true);

        foreach ($donnees['communes'] as $c) {
            Service::firstOrCreate(
                ['nom' => self::nomMairie($c['commune']), 'region' => $c['region']],
                [
                    'type' => 'mairie',
                    'commune' => $c['commune'],
                    'latitude' => $c['latitude'],
                    'longitude' => $c['longitude'],
                    'actif' => true,
                ]
            );
        }

        // Les démarches dont le service de référence est une mairie peuvent être traitées
        // par toutes les mairies : c'est la règle de compétence qui désigne la bonne.
        $mairies = Service::where('type', 'mairie')->where('actif', true)->pluck('id');
        Procedure::whereHas('service', fn ($q) => $q->where('type', 'mairie'))
            ->get()
            ->each(fn (Procedure $p) => $p->services()->syncWithoutDetaching($mairies));
    }

    /** « Mairie de Thiès », « Mairie d'Oussouye ». */
    public static function nomMairie(string $commune): string
    {
        $voyelle = in_array(Str::lower(Str::ascii(mb_substr($commune, 0, 1))), ['a', 'e', 'i', 'o', 'u', 'y'], true);

        return $voyelle ? "Mairie d'{$commune}" : "Mairie de {$commune}";
    }
}
