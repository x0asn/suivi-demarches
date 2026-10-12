<?php

namespace Tests\Feature\Dossiers;

use App\Enums\StatutDossier;
use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\JournalAction;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Modules M03 à M06 — parcours de bout en bout (scénario de soutenance §28).
 * RF-006 à RF-011, RF-013 à RF-016, RG-002 à RG-008, RG-011.
 */
class ParcoursDossierTest extends TestCase
{
    use RefreshDatabase;

    private Procedure $procedure;

    private Service $service;

    private User $citoyen;

    private User $agent;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->service = Service::create(['nom' => 'Mairie de Diamniadio', 'type' => 'mairie']);
        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);

        $this->procedure = new Procedure([
            'titre' => 'Certificat de résidence', 'slug' => 'certificat-de-residence', 'resume' => 'Résumé',
            'categorie_id' => $categorie->id, 'service_id' => $this->service->id, 'delai_jours' => 2,
        ]);
        $this->procedure->statut = 'publiee';
        $this->procedure->save();
        $this->procedure->pieces()->create(['libelle' => "Pièce d'identité", 'obligatoire' => true, 'ordre' => 0]);
        $this->procedure->pieces()->create(['libelle' => 'Justificatif de domicile', 'obligatoire' => true, 'ordre' => 1]);
        $this->procedure->pieces()->create(['libelle' => 'Attestation du délégué', 'obligatoire' => false, 'ordre' => 2]);

        $this->citoyen = User::factory()->create();
        $this->agent = User::factory()->agent()->create();
        $this->agent->forceFill(['service_id' => $this->service->id])->save();
    }

    private function creerDossier(): Dossier
    {
        Sanctum::actingAs($this->citoyen);
        $id = $this->postJson('/api/dossiers', ['procedure' => 'certificat-de-residence', 'motif' => 'Ouverture de compte bancaire'])->json('data.id');

        return Dossier::find($id);
    }

    private function deposerPieces(Dossier $dossier): void
    {
        Sanctum::actingAs($this->citoyen);
        foreach ($this->procedure->pieces->where('obligatoire', true) as $piece) {
            $this->post("/api/dossiers/{$dossier->id}/documents", [
                'fichier' => UploadedFile::fake()->create('piece.pdf', 200, 'application/pdf'),
                'piece_requise_id' => $piece->id,
            ], ['Accept' => 'application/json'])->assertCreated();
        }
    }

    private function dossierSoumis(): Dossier
    {
        $dossier = $this->creerDossier();
        $this->deposerPieces($dossier);
        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")->assertOk();

        return $dossier->fresh();
    }

    public function test_rf006_un_dossier_recoit_une_reference_unique_et_un_statut_initial(): void
    {
        Sanctum::actingAs($this->citoyen);

        $r = $this->postJson('/api/dossiers', ['procedure' => 'certificat-de-residence']);

        $r->assertCreated()
            ->assertJsonPath('data.statut', 'brouillon')
            ->assertJsonPath('data.historique.0.nouveau_statut', 'brouillon');
        $this->assertMatchesRegularExpression('/^DEM-\d{4}-\d{5}$/', $r->json('data.reference'));
    }

    public function test_rf006_impossible_de_creer_un_dossier_sur_une_procedure_non_publiee(): void
    {
        $this->procedure->forceFill(['statut' => 'desactivee'])->save();
        Sanctum::actingAs($this->citoyen);

        $this->postJson('/api/dossiers', ['procedure' => 'certificat-de-residence'])->assertStatus(422);
    }

    public function test_rg004_soumission_refusee_si_pieces_obligatoires_manquantes(): void
    {
        $dossier = $this->creerDossier();

        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")
            ->assertStatus(422)
            ->assertJsonValidationErrors('pieces');

        $this->assertSame(StatutDossier::Brouillon, $dossier->fresh()->statut);
    }

    public function test_rf008_format_et_taille_des_pieces_controles(): void
    {
        $dossier = $this->creerDossier();
        $piece = $this->procedure->pieces->first();

        $this->post("/api/dossiers/{$dossier->id}/documents", [
            'fichier' => UploadedFile::fake()->create('virus.exe', 10, 'application/octet-stream'),
            'piece_requise_id' => $piece->id,
        ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('fichier');

        $this->post("/api/dossiers/{$dossier->id}/documents", [
            'fichier' => UploadedFile::fake()->create('enorme.pdf', 6000, 'application/pdf'),
            'piece_requise_id' => $piece->id,
        ], ['Accept' => 'application/json'])->assertStatus(422)
            ->assertJsonPath('errors.fichier.0', 'Le fichier dépasse la taille maximale de 5 Mo.');
    }

    public function test_rf008_les_fichiers_sont_stockes_avec_un_nom_non_previsible(): void
    {
        $dossier = $this->creerDossier();
        $this->deposerPieces($dossier);

        $document = $dossier->documents()->first();
        $this->assertStringNotContainsString('piece.pdf', $document->chemin);
        Storage::disk('local')->assertExists($document->chemin);
    }

    public function test_rf007_soumission_horodatee_et_notifications(): void
    {
        $dossier = $this->dossierSoumis();

        $this->assertSame(StatutDossier::Soumis, $dossier->statut);
        $this->assertNotNull($dossier->soumis_at);
        // RG-011 : le citoyen est informé, les agents du service aussi.
        $this->assertSame(1, $this->citoyen->notifications()->count());
        $this->assertSame(1, $this->agent->notifications()->count());
        $this->assertSame('agent.dossier_nouveau', $this->agent->notifications()->first()->data['evenement']);
    }

    public function test_rg008_un_citoyen_ne_voit_pas_le_dossier_d_un_autre(): void
    {
        $dossier = $this->creerDossier();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/dossiers/{$dossier->id}")->assertForbidden();
        $this->getJson('/api/dossiers')->assertJsonCount(0, 'data');
    }

    public function test_rg006_un_agent_ne_voit_que_les_dossiers_de_son_service(): void
    {
        $dossier = $this->dossierSoumis();

        $autreAgent = User::factory()->agent()->create();
        $autreAgent->forceFill(['service_id' => Service::create(['nom' => 'Tribunal', 'type' => 'tribunal'])->id])->save();

        Sanctum::actingAs($autreAgent);
        $this->getJson("/api/dossiers/{$dossier->id}")->assertForbidden();
        $this->getJson('/api/traitement/dossiers')->assertJsonCount(0, 'data');
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'en_verification'])->assertForbidden();

        Sanctum::actingAs($this->agent);
        $this->getJson('/api/traitement/dossiers')->assertJsonCount(1, 'data')->assertJsonPath('data.0.reference', $dossier->reference);
    }

    public function test_un_agent_ne_voit_pas_les_brouillons(): void
    {
        $dossier = $this->creerDossier();

        Sanctum::actingAs($this->agent);
        $this->getJson("/api/dossiers/{$dossier->id}")->assertForbidden();
    }

    public function test_rf015_transition_incoherente_refusee(): void
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);

        // SOUMIS → VALIDÉ directement : interdit
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'valide'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('statut');

        // Un citoyen ne peut pas valider son propre dossier
        Sanctum::actingAs($this->citoyen);
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'en_verification'])->assertForbidden();
    }

    public function test_parcours_complet_jusqu_a_la_validation(): void
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);

        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'en_verification'])->assertOk();
        $this->accepterLesPieces($dossier);
        foreach (['en_traitement', 'valide', 'pret_a_retirer'] as $statut) {
            $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => $statut])->assertOk();
        }
        // Remise du document contre le code de retrait du citoyen.
        $this->patchJson("/api/dossiers/{$dossier->id}/remise", [
            'code_retrait' => $dossier->fresh()->code_retrait,
            'identite_verifiee' => true,
        ])->assertOk();
        $dossier->refresh();
        $this->assertSame(StatutDossier::Termine, $dossier->statut);
        $this->assertSame($this->agent->id, $dossier->agent_id);
        $this->assertNotNull($dossier->decision_at);
        // RG-005 : brouillon, soumis, en vérification, en traitement, validé, prêt à retirer, terminé
        $this->assertSame(7, $dossier->historique()->count());
        $this->assertSame(7, JournalAction::where('action', 'dossier.statut')->count() + 1);
        // RF-009 : le citoyen voit le statut et l'historique
        Sanctum::actingAs($this->citoyen);
        $this->getJson("/api/dossiers/{$dossier->id}")
            ->assertOk()
            ->assertJsonPath('data.statut', 'termine')
            ->assertJsonCount(7, 'data.historique');
    }

    public function test_uc05_correction_demandee_puis_dossier_complete(): void
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'en_verification'])->assertOk();

        // Le commentaire est obligatoire pour demander une correction
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'correction_demandee'])
            ->assertStatus(422)->assertJsonValidationErrors('commentaire');

        // RF-014 / RG-007 : pièce marquée à corriger avec motif
        $document = $dossier->documents()->first();
        $this->patchJson("/api/documents/{$document->id}/verification", ['statut' => 'a_corriger'])
            ->assertStatus(422)->assertJsonValidationErrors('motif');
        $this->patchJson("/api/documents/{$document->id}/verification", ['statut' => 'a_corriger', 'motif' => 'Document illisible'])
            ->assertOk();
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'correction_demandee', 'commentaire' => 'Merci de renvoyer une copie lisible.'])
            ->assertOk();

        // Le citoyen ne peut pas resoumettre tant que la pièce n'est pas remplacée
        Sanctum::actingAs($this->citoyen);
        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")->assertStatus(422);

        $this->post("/api/dossiers/{$dossier->id}/documents", [
            'fichier' => UploadedFile::fake()->image('cni.jpg'),
            'piece_requise_id' => $document->piece_requise_id,
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")->assertOk()->assertJsonPath('data.statut', 'soumis');

        // L'agent responsable est notifié de la correction
        $this->assertTrue($this->agent->notifications()->get()->contains(fn ($n) => $n->data['evenement'] === 'agent.dossier_resoumis'));
        $this->assertTrue($this->citoyen->notifications()->get()->contains(fn ($n) => $n->data['evenement'] === 'document.a_corriger'));
    }

    public function test_rejet_motive_puis_cloture(): void
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'en_verification'])->assertOk();
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'rejete', 'commentaire' => 'Vous ne résidez pas dans la commune.'])->assertOk();
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'cloture'])->assertOk();

        $this->assertSame('Vous ne résidez pas dans la commune.', $dossier->fresh()->motif_decision);
    }

    public function test_rf016_observation_et_note_interne(): void
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);

        $this->postJson("/api/dossiers/{$dossier->id}/observations", ['contenu' => 'Dossier prioritaire', 'interne' => true])->assertCreated();
        $this->postJson("/api/dossiers/{$dossier->id}/observations", ['contenu' => 'Bonjour, votre dossier est bien reçu.'])->assertCreated();

        // La note interne n'est pas visible par le citoyen
        Sanctum::actingAs($this->citoyen);
        $this->getJson("/api/dossiers/{$dossier->id}")
            ->assertJsonCount(1, 'data.observations')
            ->assertJsonPath('data.observations.0.contenu', 'Bonjour, votre dossier est bien reçu.');
    }

    public function test_telechargement_d_une_piece_reserve_aux_personnes_habilitees(): void
    {
        $dossier = $this->dossierSoumis();
        $document = $dossier->documents()->first();

        Sanctum::actingAs(User::factory()->create());
        $this->get("/api/documents/{$document->id}/fichier", ['Accept' => 'application/json'])->assertForbidden();

        Sanctum::actingAs($this->agent);
        $this->get("/api/documents/{$document->id}/fichier")->assertOk();
    }

    public function test_rf010_notifications_consultables_et_marquees_lues(): void
    {
        $this->dossierSoumis();
        Sanctum::actingAs($this->citoyen);

        $apercu = $this->getJson('/api/notifications/apercu')->assertOk();
        $this->assertSame(1, $apercu->json('data.non_lues'));

        $id = $apercu->json('data.dernieres.0.id');
        $this->patchJson("/api/notifications/{$id}/lire")->assertOk()->assertJsonPath('data.lue', true);
        $this->getJson('/api/notifications/apercu')->assertJsonPath('data.non_lues', 0);
    }

    public function test_un_brouillon_peut_etre_supprime_mais_pas_un_dossier_soumis(): void
    {
        $brouillon = $this->creerDossier();
        $this->deleteJson("/api/dossiers/{$brouillon->id}")->assertOk();
        $this->assertModelMissing($brouillon);

        $soumis = $this->dossierSoumis();
        Sanctum::actingAs($this->citoyen);
        $this->deleteJson("/api/dossiers/{$soumis->id}")->assertForbidden();
    }

    /** L'agent accepte toutes les pièces du dossier (possible une fois le dossier pris en charge). */
    private function accepterLesPieces(Dossier $dossier): void
    {
        foreach ($dossier->documents()->get() as $document) {
            $this->patchJson("/api/documents/{$document->id}/verification", ['statut' => 'accepte'])->assertOk();
        }
    }

    /** Dossier validé par l'agent : la demande est approuvée, le document n'est pas encore préparé. */
    private function dossierValide(): Dossier
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'en_verification'])->assertOk();
        $this->accepterLesPieces($dossier);
        foreach (['en_traitement', 'valide'] as $statut) {
            $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => $statut])->assertOk();
        }

        return $dossier->fresh();
    }

    public function test_rf014_une_demande_ne_peut_pas_etre_validee_sans_pieces_acceptees(): void
    {
        $dossier = $this->dossierSoumis();
        Sanctum::actingAs($this->agent);
        foreach (['en_verification', 'en_traitement'] as $statut) {
            $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => $statut])->assertOk();
        }

        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'valide'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('statut');
        $this->assertSame(StatutDossier::EnTraitement, $dossier->fresh()->statut);

        $this->accepterLesPieces($dossier);
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'valide'])->assertOk();
    }

    public function test_retrait_valider_ne_termine_pas_le_dossier(): void
    {
        $dossier = $this->dossierValide();

        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'termine'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('statut');

        $this->assertSame(StatutDossier::Valide, $dossier->fresh()->statut);
        $this->assertNull($dossier->fresh()->code_retrait);
    }

    public function test_retrait_document_pret_le_citoyen_est_notifie_et_recoit_son_code(): void
    {
        $dossier = $this->dossierValide();
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'pret_a_retirer'])
            ->assertOk()
            ->assertJsonPath('data.statut', 'pret_a_retirer')
            // L'agent ne voit jamais le code : c'est le citoyen qui le lui présente.
            ->assertJsonPath('data.code_retrait', null);

        $dossier->refresh();
        $this->assertMatchesRegularExpression('/^\d{6}$/', $dossier->code_retrait);
        $this->assertNotNull($dossier->pret_at);

        $notification = $this->citoyen->notifications()->where('data->evenement', 'dossier.pret_a_retirer')->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('Mairie de Diamniadio', $notification->data['message']);
        $this->assertStringNotContainsString($dossier->code_retrait, $notification->data['message']);

        Sanctum::actingAs($this->citoyen);
        $this->getJson("/api/dossiers/{$dossier->id}")
            ->assertOk()
            ->assertJsonPath('data.code_retrait', $dossier->code_retrait)
            ->assertJsonPath('data.service.nom', 'Mairie de Diamniadio');
        $this->getJson('/api/dossiers/resume')->assertJsonPath('data.a_retirer', 1);
    }

    public function test_retrait_la_remise_exige_le_bon_code_et_la_verification_d_identite(): void
    {
        $dossier = $this->dossierValide();
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'pret_a_retirer'])->assertOk();
        $code = $dossier->fresh()->code_retrait;
        $faux = $code === '000000' ? '111111' : '000000';

        // Sans code : le changement de statut direct est refusé.
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'termine'])->assertStatus(422);
        // Mauvais code : refusé, et la tentative est journalisée.
        $this->patchJson("/api/dossiers/{$dossier->id}/remise", ['code_retrait' => $faux, 'identite_verifiee' => true])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code_retrait');
        $this->assertDatabaseHas('journal_actions', ['action' => 'dossier.retrait_refuse', 'resultat' => 'echec']);
        // Bon code, mais identité non confirmée : refusé.
        $this->patchJson("/api/dossiers/{$dossier->id}/remise", ['code_retrait' => $code, 'identite_verifiee' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors('identite_verifiee');
        $this->assertSame(StatutDossier::PretARetirer, $dossier->fresh()->statut);

        // Bon code et identité vérifiée : le document est remis.
        $this->patchJson("/api/dossiers/{$dossier->id}/remise", ['code_retrait' => $code, 'identite_verifiee' => true])
            ->assertOk()
            ->assertJsonPath('data.statut', 'termine');
        $this->assertNotNull($dossier->fresh()->retire_at);
    }

    public function test_rg006_la_remise_est_reservee_a_l_agent_du_service(): void
    {
        $dossier = $this->dossierValide();
        $this->patchJson("/api/dossiers/{$dossier->id}/status", ['statut' => 'pret_a_retirer'])->assertOk();
        $code = $dossier->fresh()->code_retrait;

        // Le citoyen ne peut pas clôturer lui-même son dossier avec son code.
        Sanctum::actingAs($this->citoyen);
        $this->patchJson("/api/dossiers/{$dossier->id}/remise", ['code_retrait' => $code, 'identite_verifiee' => true])->assertForbidden();
    }
}
