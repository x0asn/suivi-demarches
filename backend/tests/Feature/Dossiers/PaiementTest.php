<?php

namespace Tests\Feature\Dossiers;

use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\JournalAction;
use App\Models\Paiement;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Paiement des frais par Wave ou Orange Money (PayDunya) — RG-019.
 * PayDunya est remplacé par de fausses réponses : aucun appel ne sort du poste.
 */
class PaiementTest extends TestCase
{
    use RefreshDatabase;

    private const MASTER = 'cle-principale-de-test';

    private Procedure $procedure;

    private User $citoyen;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'paiement.cles.master' => self::MASTER,
            'paiement.cles.privee' => 'test_private_x',
            'paiement.cles.jeton' => 'jeton_x',
            'paiement.mode' => 'test',
        ]);

        $service = Service::create(['nom' => 'Mairie de Dakar-Plateau', 'type' => 'mairie']);
        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $this->procedure = new Procedure([
            'titre' => "Extrait d'acte de naissance", 'slug' => 'extrait-naissance', 'resume' => 'Résumé',
            'categorie_id' => $categorie->id, 'service_id' => $service->id, 'delai_jours' => 2, 'frais' => 200,
        ]);
        $this->procedure->statut = 'publiee';
        $this->procedure->save();

        $this->citoyen = User::factory()->create();
    }

    private function dossier(): Dossier
    {
        Sanctum::actingAs($this->citoyen);
        $id = $this->postJson('/api/dossiers', ['procedure' => 'extrait-naissance', 'motif' => 'Inscription scolaire'])->json('data.id');

        return Dossier::find($id);
    }

    private function fauxPayDunya(string $statut = 'completed'): void
    {
        Http::fake([
            '*/checkout-invoice/create' => Http::response([
                'response_code' => '00',
                'response_text' => 'https://paydunya.com/sandbox-checkout/invoice/test_jeton',
                'token' => 'test_jeton',
            ]),
            '*/checkout-invoice/confirm/*' => Http::response([
                'response_code' => '00',
                'status' => $statut,
                'receipt_url' => 'https://paydunya.com/sandbox-checkout/receipt/pdf/test_jeton.pdf',
            ]),
        ]);
    }

    public function test_rg019_une_demarche_payante_ne_peut_etre_envoyee_sans_paiement(): void
    {
        $dossier = $this->dossier();

        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")
            ->assertStatus(422)
            ->assertJsonValidationErrors('paiement');
    }

    public function test_sans_cles_pay_dunya_les_frais_se_reglent_au_guichet(): void
    {
        config(['paiement.cles.master' => null]);
        $dossier = $this->dossier();

        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave'])->assertStatus(503);
        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")->assertOk();
    }

    public function test_le_citoyen_est_redirige_vers_la_page_de_paiement_de_son_operateur(): void
    {
        $this->fauxPayDunya();
        $dossier = $this->dossier();

        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'orange_money'])
            ->assertCreated()
            ->assertJsonPath('data.url_paiement', 'https://paydunya.com/sandbox-checkout/invoice/test_jeton')
            ->assertJsonPath('data.paiement.statut', 'en_attente');

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/sandbox-api/v1/checkout-invoice/create')
            && $r->header('PAYDUNYA-MASTER-KEY')[0] === self::MASTER
            && $r['invoice']['total_amount'] === 200
            && $r['invoice']['channels'] === ['orange-money-senegal']);
    }

    public function test_le_paiement_n_est_confirme_que_par_pay_dunya_puis_la_demande_peut_partir(): void
    {
        $this->fauxPayDunya('completed');
        $dossier = $this->dossier();
        $id = $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave'])->json('data.paiement.id');

        $this->getJson("/api/paiements/{$id}")
            ->assertOk()
            ->assertJsonPath('data.statut', 'paye')
            ->assertJsonPath('data.operateur_libelle', 'Wave');

        $this->assertTrue($dossier->fresh()->estPaye());
        $this->assertSame(1, JournalAction::where('action', 'paiement.paye')->count());
        $this->assertSame('paiement.paye', $this->citoyen->notifications()->first()->data['evenement']);
        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")->assertOk();
        $this->getJson("/api/dossiers/{$dossier->id}")->assertJsonPath('data.paiement.statut', 'paye');
    }

    public function test_un_paiement_en_attente_ou_annule_ne_debloque_rien(): void
    {
        $this->fauxPayDunya('cancelled');
        $dossier = $this->dossier();
        $id = $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave'])->json('data.paiement.id');

        $this->getJson("/api/paiements/{$id}")->assertJsonPath('data.statut', 'annule');
        $this->postJson("/api/dossiers/{$dossier->id}/soumettre")->assertStatus(422);
    }

    public function test_un_autre_citoyen_ne_peut_ni_payer_ni_consulter_ce_paiement(): void
    {
        $this->fauxPayDunya();
        $dossier = $this->dossier();
        $id = $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave'])->json('data.paiement.id');

        Sanctum::actingAs(User::factory()->create());
        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave'])->assertForbidden();
        $this->getJson("/api/paiements/{$id}")->assertForbidden();
    }

    public function test_un_brouillon_paye_ne_peut_pas_etre_supprime(): void
    {
        $this->fauxPayDunya('completed');
        $dossier = $this->dossier();
        $id = $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave'])->json('data.paiement.id');
        $this->getJson("/api/paiements/{$id}");

        $this->getJson("/api/dossiers/{$dossier->id}")->assertJsonPath('data.permissions.supprimer', false);
        $this->deleteJson("/api/dossiers/{$dossier->id}")->assertForbidden();
        $this->assertDatabaseHas('paiements', ['id' => $id, 'statut' => Paiement::PAYE]);
    }

    public function test_un_paiement_en_attente_finalement_regle_bloque_la_suppression(): void
    {
        $this->fauxPayDunya('completed');
        $dossier = $this->dossier();
        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'orange_money']);

        // Le citoyen n'est pas revenu sur l'application, mais il a bien payé.
        $this->deleteJson("/api/dossiers/{$dossier->id}")->assertStatus(409);
        $this->assertTrue($dossier->fresh()->estPaye());
    }

    public function test_un_brouillon_avec_un_paiement_annule_peut_etre_supprime(): void
    {
        $this->fauxPayDunya('cancelled');
        $dossier = $this->dossier();
        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave']);

        $this->deleteJson("/api/dossiers/{$dossier->id}")->assertOk();
        $this->assertNull($dossier->fresh());
        $this->assertSame(0, Paiement::count());
    }

    public function test_operateur_inconnu_refuse(): void
    {
        $dossier = $this->dossier();

        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'carte'])
            ->assertStatus(422)->assertJsonValidationErrors('operateur');
    }

    public function test_l_avis_de_pay_dunya_doit_etre_signe(): void
    {
        $this->fauxPayDunya('completed');
        $dossier = $this->dossier();
        $this->postJson("/api/dossiers/{$dossier->id}/paiements", ['operateur' => 'wave']);

        $this->post('/api/paiements/notification', ['data' => ['hash' => 'faux', 'invoice' => ['token' => 'test_jeton']]])
            ->assertForbidden();
        $this->assertFalse($dossier->fresh()->estPaye());

        $this->post('/api/paiements/notification', ['data' => ['hash' => hash('sha512', self::MASTER), 'invoice' => ['token' => 'test_jeton']]])
            ->assertOk();
        $this->assertTrue($dossier->fresh()->estPaye());
        $this->assertSame(Paiement::PAYE, Paiement::first()->statut);
    }
}
