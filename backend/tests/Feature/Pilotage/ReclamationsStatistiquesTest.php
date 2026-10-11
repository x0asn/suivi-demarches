<?php

namespace Tests\Feature\Pilotage;

use App\Enums\StatutDossier;
use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\ModeleNotification;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use App\Services\Notifieur;
use Database\Seeders\ModelesNotificationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * M07 (RF-012), M09 (RF-019, RG-012) et M06/M10 (RF-020).
 */
class ReclamationsStatistiquesTest extends TestCase
{
    use RefreshDatabase;

    private Procedure $procedure;

    private User $citoyen;

    protected function setUp(): void
    {
        parent::setUp();
        $service = Service::create(['nom' => 'Mairie', 'type' => 'mairie']);
        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $this->procedure = new Procedure(['titre' => 'Extrait', 'slug' => 'extrait', 'resume' => 'r', 'categorie_id' => $categorie->id, 'service_id' => $service->id, 'delai_jours' => 3]);
        $this->procedure->statut = 'publiee';
        $this->procedure->save();
        $this->citoyen = User::factory()->create();
    }

    private function dossier(string $statut, int $joursSoumission, ?int $joursDecision = null): Dossier
    {
        $d = new Dossier(['motif' => 'm']);
        $d->procedure_id = $this->procedure->id;
        $d->service_id = $this->procedure->service_id;
        $d->citoyen_id = $this->citoyen->id;
        $d->statut = StatutDossier::from($statut);
        $d->soumis_at = now()->subDays($joursSoumission);
        $d->decision_at = $joursDecision !== null ? now()->subDays($joursDecision) : null;
        $d->save();

        return $d;
    }

    public function test_rf012_une_reclamation_recoit_une_reference_et_un_statut(): void
    {
        Sanctum::actingAs($this->citoyen);
        $dossier = $this->dossier('en_traitement', 10);

        $r = $this->postJson('/api/reclamations', [
            'motif' => 'retard',
            'sujet' => 'Délai dépassé',
            'description' => 'Mon dossier dépasse largement le délai annoncé sur la fiche.',
            'dossier_id' => $dossier->id,
        ]);

        $r->assertCreated()->assertJsonPath('data.statut', 'ouverte');
        $this->assertMatchesRegularExpression('/^REC-\d{4}-\d{4}$/', $r->json('data.reference'));
    }

    public function test_rf012_un_citoyen_ne_peut_pas_rattacher_le_dossier_d_un_autre(): void
    {
        $dossierAutre = $this->dossier('soumis', 1);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/reclamations', [
            'motif' => 'retard', 'sujet' => 'x', 'description' => 'Une description suffisamment longue.', 'dossier_id' => $dossierAutre->id,
        ])->assertStatus(422)->assertJsonValidationErrors('dossier_id');
    }

    public function test_rf012_traitement_et_reponse_notifient_le_citoyen(): void
    {
        Sanctum::actingAs($this->citoyen);
        $id = $this->postJson('/api/reclamations', ['motif' => 'autre', 'sujet' => 'Question', 'description' => 'Une description suffisamment longue.'])->json('data.id');

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->patchJson("/api/reclamations/{$id}", ['statut' => 'resolue'])->assertStatus(422)->assertJsonValidationErrors('reponse');
        $this->patchJson("/api/reclamations/{$id}", ['statut' => 'resolue', 'reponse' => 'Voici notre réponse.'])->assertOk();
        $this->patchJson("/api/reclamations/{$id}", ['statut' => 'en_cours'])->assertStatus(422); // déjà close

        $this->assertTrue($this->citoyen->notifications()->get()->contains(fn ($n) => $n->data['evenement'] === 'reclamation.reponse'));
    }

    public function test_un_citoyen_ne_voit_que_ses_reclamations(): void
    {
        Sanctum::actingAs($this->citoyen);
        $id = $this->postJson('/api/reclamations', ['motif' => 'autre', 'sujet' => 'Question', 'description' => 'Une description suffisamment longue.'])->json('data.id');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/reclamations/{$id}")->assertForbidden();
        $this->getJson('/api/reclamations')->assertJsonCount(0, 'data');
    }

    public function test_rf019_statistiques_reservees_au_pilotage(): void
    {
        Sanctum::actingAs($this->citoyen);
        $this->getJson('/api/statistics')->assertForbidden();
        Sanctum::actingAs(User::factory()->agent()->create());
        $this->getJson('/api/statistics')->assertForbidden();
    }

    public function test_rg012_indicateurs_coherents_avec_les_donnees(): void
    {
        $this->dossier('termine', 10, 8);   // décision en 2 jours, dans le délai
        $this->dossier('valide', 20, 13);   // 7 jours, hors délai
        $this->dossier('rejete', 15, 14);   // 1 jour
        $this->dossier('en_traitement', 5); // en retard (délai 3 j)
        $this->dossier('soumis', 1);

        Sanctum::actingAs(User::factory()->responsable()->create());
        $r = $this->getJson('/api/statistics')->assertOk();

        $this->assertSame(5, $r->json('data.indicateurs.deposes'));
        $this->assertSame(2, $r->json('data.indicateurs.en_cours'));
        $this->assertSame(3, $r->json('data.indicateurs.decisions'));
        $this->assertEquals(66.7, $r->json('data.indicateurs.taux_validation'));
        $this->assertEquals(3.3, $r->json('data.indicateurs.delai_moyen_jours'));
        $this->assertEquals(66.7, $r->json('data.indicateurs.respect_delai'));
        $this->assertSame(1, $r->json('data.indicateurs.en_retard'));
        $this->assertSame(5, collect($r->json('data.evolution'))->sum('deposes'));
    }

    public function test_rf019_filtre_par_periode_et_statut(): void
    {
        $this->dossier('termine', 100, 95);
        $this->dossier('soumis', 2);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/statistics?du='.now()->subDays(10)->toDateString())
            ->assertJsonPath('data.indicateurs.deposes', 1);
        $this->getJson('/api/statistics?du='.now()->subYear()->toDateString().'&statut=termine')
            ->assertJsonPath('data.indicateurs.deposes', 1);
    }

    public function test_rf020_un_modele_desactive_ne_produit_pas_de_notification(): void
    {
        $this->seed(ModelesNotificationSeeder::class);
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $modele = ModeleNotification::firstWhere('evenement', 'dossier.valide');
        $this->putJson("/api/admin/modeles-notification/{$modele->id}", [
            'titre' => 'Félicitations {procedure}', 'message' => 'Dossier {reference} validé.', 'actif' => false, 'email' => false,
        ])->assertOk();

        Notifieur::envoyer('dossier.valide', $this->citoyen, ['reference' => 'DEM-1']);
        $this->assertSame(0, $this->citoyen->notifications()->count());

        $modele->refresh()->update(['actif' => true]);
        Notifieur::envoyer('dossier.valide', $this->citoyen, ['reference' => 'DEM-1', 'procedure' => 'Extrait']);
        $this->assertSame('Félicitations Extrait', $this->citoyen->notifications()->first()->data['titre']);
    }
}
