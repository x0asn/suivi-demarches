<?php

namespace Tests\Feature\Dossiers;

use App\Enums\StatutDossier;
use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Suivi d'un dossier sans compte (RF-009) et accusé de réception (RF-007).
 */
class SuiviPublicTest extends TestCase
{
    use RefreshDatabase;

    private User $citoyen;

    private Dossier $dossier;

    protected function setUp(): void
    {
        parent::setUp();
        $service = Service::create(['nom' => 'Mairie de Diamniadio', 'type' => 'mairie', 'commune' => 'Diamniadio', 'region' => 'Dakar']);
        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $procedure = new Procedure(['titre' => 'Certificat de résidence', 'slug' => 'certificat-de-residence', 'resume' => 'r', 'categorie_id' => $categorie->id, 'service_id' => $service->id, 'delai_jours' => 2]);
        $procedure->statut = 'publiee';
        $procedure->save();

        $this->citoyen = User::factory()->create(['prenom' => 'Fatou', 'nom' => 'Ba']);
        $this->dossier = $this->dossier(StatutDossier::EnVerification);
    }

    private function dossier(StatutDossier $statut): Dossier
    {
        $dossier = new Dossier(['motif' => 'Ouverture de compte bancaire']);
        $dossier->procedure_id = Procedure::first()->id;
        $dossier->service_id = Service::first()->id;
        $dossier->citoyen_id = $this->citoyen->id;
        $dossier->statut = $statut;
        $dossier->soumis_at = $statut === StatutDossier::Brouillon ? null : now()->subDay();
        $dossier->save();
        $dossier->historique()->create(['nouveau_statut' => 'soumis', 'commentaire' => 'Note réservée', 'user_id' => $this->citoyen->id]);

        return $dossier->fresh();
    }

    public function test_rg002_chaque_dossier_recoit_un_code_de_suivi_aleatoire(): void
    {
        $autre = $this->dossier(StatutDossier::Soumis);

        $this->assertMatchesRegularExpression('/^[A-HJ-NP-Z2-9]{8}$/', $this->dossier->code_suivi);
        $this->assertNotSame($this->dossier->code_suivi, $autre->code_suivi);
    }

    public function test_rf009_suivi_sans_compte_avec_la_reference_et_le_code(): void
    {
        $this->getJson("/api/suivi?reference={$this->dossier->reference}&code={$this->dossier->code_suivi}")
            ->assertOk()
            ->assertJsonPath('data.reference', $this->dossier->reference)
            ->assertJsonPath('data.statut', 'en_verification')
            ->assertJsonPath('data.demarche', 'Certificat de résidence')
            ->assertJsonPath('data.administration.nom', 'Mairie de Diamniadio')
            ->assertJsonPath('data.historique.0.statut', 'soumis');
    }

    public function test_rnf002_le_suivi_public_ne_revele_aucune_donnee_personnelle(): void
    {
        $contenu = $this->getJson("/api/suivi?reference={$this->dossier->reference}&code={$this->dossier->code_suivi}")
            ->assertOk()
            ->getContent();

        foreach (['Fatou', $this->citoyen->email, 'Ouverture de compte bancaire', 'Note réservée'] as $prive) {
            $this->assertStringNotContainsString($prive, $contenu);
        }
    }

    public function test_rnf001_un_code_faux_ou_une_reference_inconnue_donnent_la_meme_reponse(): void
    {
        $faux = $this->getJson("/api/suivi?reference={$this->dossier->reference}&code=AAAAAAAA")->assertNotFound()->json('message');
        $inconnu = $this->getJson('/api/suivi?reference=DEM-2026-99999&code=AAAAAAAA')->assertNotFound()->json('message');

        $this->assertSame($faux, $inconnu);
    }

    public function test_un_brouillon_n_est_pas_consultable_publiquement(): void
    {
        $brouillon = $this->dossier(StatutDossier::Brouillon);

        $this->getJson("/api/suivi?reference={$brouillon->reference}&code={$brouillon->code_suivi}")->assertNotFound();
    }

    public function test_le_code_de_suivi_n_est_montre_qu_au_citoyen_proprietaire(): void
    {
        Sanctum::actingAs($this->citoyen);
        $this->getJson("/api/dossiers/{$this->dossier->id}")->assertJsonPath('data.code_suivi', $this->dossier->code_suivi);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson("/api/dossiers/{$this->dossier->id}")->assertJsonPath('data.code_suivi', null);
    }

    public function test_rf007_accuse_de_reception_en_pdf_pour_un_dossier_soumis(): void
    {
        Sanctum::actingAs($this->citoyen);

        $reponse = $this->get("/api/dossiers/{$this->dossier->id}/accuse")->assertOk();

        $this->assertSame('application/pdf', $reponse->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $reponse->getContent());
        $this->assertDatabaseHas('journal_actions', ['action' => 'dossier.accuse_telecharge']);
    }

    public function test_rg008_l_accuse_est_reserve_aux_personnes_habilitees(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/dossiers/{$this->dossier->id}/accuse")->assertForbidden();
    }

    public function test_pas_d_accuse_pour_un_brouillon(): void
    {
        Sanctum::actingAs($this->citoyen);
        $brouillon = $this->dossier(StatutDossier::Brouillon);

        $this->getJson("/api/dossiers/{$brouillon->id}/accuse")->assertStatus(422);
    }
}
