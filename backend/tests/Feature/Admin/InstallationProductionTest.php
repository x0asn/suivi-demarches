<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Models\JournalAction;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

/** Installation réelle (sans données fictives) et réglages de sécurité du serveur. */
class InstallationProductionTest extends TestCase
{
    use RefreshDatabase;

    public function test_l_installation_reelle_ne_contient_aucune_donnee_fictive(): void
    {
        $this->seed(ProductionSeeder::class);

        $this->assertSame(0, User::count(), 'Aucun compte ne doit être créé.');
        $this->assertGreaterThan(500, Service::where('type', 'mairie')->count(), 'Les mairies du Sénégal sont importées.');
        $this->assertSame(0, Service::whereNotNull('telephone')->orWhereNotNull('email')->count(), 'Aucune coordonnée inventée.');
        $this->assertGreaterThan(0, Procedure::count());
        $this->assertSame(0, Procedure::where('statut', 'publiee')->count(), 'Les démarches attendent la vérification de l’administrateur.');
    }

    public function test_le_jeu_de_demonstration_est_refuse_en_production(): void
    {
        $this->app['env'] = 'production';

        $this->expectException(RuntimeException::class);
        (new DatabaseSeeder)->setContainer($this->app)->__invoke();
    }

    public function test_creation_du_premier_administrateur(): void
    {
        $this->artisan('admin:creer')
            ->expectsQuestion('Prénom', 'Aïssatou')
            ->expectsQuestion('Nom', 'Ndiaye')
            ->expectsQuestion('Adresse e-mail', 'admin@mairie.sn')
            ->expectsQuestion('Téléphone (facultatif)', null)
            ->expectsQuestion('Mot de passe (12 caractères minimum, lettres, chiffres et symbole)', 'Teranga-2026!Sn')
            ->expectsQuestion('Confirmez le mot de passe', 'Teranga-2026!Sn')
            ->assertSuccessful();

        $admin = User::firstWhere('email', 'admin@mairie.sn');
        $this->assertSame(Role::Admin, $admin->role);
        $this->assertTrue($admin->actif);
        $this->assertTrue(Hash::check('Teranga-2026!Sn', $admin->password));
        $this->assertSame(1, JournalAction::where('action', 'admin.utilisateur.cree')->count());
    }

    public function test_mot_de_passe_administrateur_trop_faible_refuse(): void
    {
        $this->artisan('admin:creer')
            ->expectsQuestion('Prénom', 'Awa')
            ->expectsQuestion('Nom', 'Diop')
            ->expectsQuestion('Adresse e-mail', 'admin@mairie.sn')
            ->expectsQuestion('Téléphone (facultatif)', null)
            ->expectsQuestion('Mot de passe (12 caractères minimum, lettres, chiffres et symbole)', 'Demo2026')
            ->expectsQuestion('Confirmez le mot de passe', 'Demo2026')
            ->assertFailed();

        $this->assertSame(0, User::count());
    }

    public function test_les_reponses_portent_les_en_tetes_de_securite(): void
    {
        $this->getJson('/api/procedures')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    public function test_les_pieces_justificatives_ne_sont_jamais_servies_directement(): void
    {
        $this->get('/storage/dossiers/piece.pdf')->assertNotFound();
    }

    public function test_la_verification_signale_un_poste_de_developpement(): void
    {
        config(['app.debug' => true, 'app.url' => 'http://localhost:8000']);

        $this->artisan('production:verifier')
            ->expectsOutputToContain('APP_DEBUG=true')
            ->assertFailed();
    }
}
