<?php

namespace Tests\Feature\Services;

use App\Models\Categorie;
use App\Models\Procedure;
use App\Models\Service;
use App\Support\Regions;
use Database\Seeders\MairiesSenegalSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Module M08 — Référentiel des mairies du Sénégal (une par commune, dans les 14 régions).
 */
class MairiesSenegalTest extends TestCase
{
    use RefreshDatabase;

    public function test_rf021_toutes_les_regions_du_senegal_ont_leurs_mairies(): void
    {
        $this->seed(MairiesSenegalSeeder::class);

        $mairies = Service::where('type', 'mairie')->get();

        $this->assertGreaterThan(500, $mairies->count());
        $this->assertEqualsCanonicalizing(Regions::LISTE, $mairies->pluck('region')->unique()->all());
        $this->assertSame(0, $mairies->filter(fn ($m) => ! $m->latitude || ! $m->longitude)->count());
        $this->assertDatabaseHas('services', ['nom' => "Mairie d'Oussouye", 'region' => 'Ziguinchor']);
    }

    public function test_les_mairies_deja_presentes_ne_sont_pas_modifiees_ni_dupliquees(): void
    {
        $existante = Service::create(['nom' => 'Mairie de Diamniadio', 'type' => 'mairie', 'region' => 'Dakar', 'commune' => 'Diamniadio', 'telephone' => '+221 33 800 10 20', 'latitude' => 14.7252, 'longitude' => -17.1838]);

        $this->seed(MairiesSenegalSeeder::class);
        $this->seed(MairiesSenegalSeeder::class);

        $this->assertSame(1, Service::where('nom', 'Mairie de Diamniadio')->count());
        $this->assertSame('+221 33 800 10 20', $existante->fresh()->telephone);
    }

    public function test_les_demarches_de_mairie_sont_ouvertes_a_toutes_les_mairies(): void
    {
        $mairie = Service::create(['nom' => 'Mairie de Diamniadio', 'type' => 'mairie', 'region' => 'Dakar']);
        $tribunal = Service::create(['nom' => 'Tribunal de Dakar', 'type' => 'tribunal', 'region' => 'Dakar']);
        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $enMairie = Procedure::create(['titre' => 'Certificat de résidence', 'slug' => 'residence', 'resume' => 'r', 'categorie_id' => $categorie->id, 'service_id' => $mairie->id]);
        $auTribunal = Procedure::create(['titre' => 'Casier judiciaire', 'slug' => 'casier', 'resume' => 'r', 'categorie_id' => $categorie->id, 'service_id' => $tribunal->id]);

        $this->seed(MairiesSenegalSeeder::class);

        $this->assertSame(Service::where('type', 'mairie')->count(), $enMairie->services()->count());
        $this->assertSame(1, $auTribunal->services()->count());
    }
}
