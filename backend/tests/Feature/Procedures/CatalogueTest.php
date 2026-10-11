<?php

namespace Tests\Feature\Procedures;

use App\Enums\StatutDossier;
use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\JournalAction;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Module M02 — RF-004 (consulter), RF-005 (rechercher), RF-017 (gérer), RF-021 (services).
 */
class CatalogueTest extends TestCase
{
    use RefreshDatabase;

    private Categorie $categorie;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $this->service = Service::create(['nom' => 'Mairie de Diamniadio', 'type' => 'mairie', 'region' => 'Dakar', 'commune' => 'Diamniadio']);
    }

    private function procedure(string $titre, string $statut = 'publiee'): Procedure
    {
        $p = new Procedure([
            'titre' => $titre,
            'slug' => Str::slug($titre),
            'resume' => "Résumé de {$titre}",
            'categorie_id' => $this->categorie->id,
            'service_id' => $this->service->id,
            'delai_jours' => 3,
        ]);
        $p->statut = $statut;
        $p->save();
        $p->pieces()->create(['libelle' => "Pièce d'identité", 'obligatoire' => true]);
        $p->etapes()->create(['titre' => 'Dépôt']);

        return $p;
    }

    public function test_rf004_le_catalogue_ne_montre_que_les_procedures_publiees(): void
    {
        $this->procedure('Certificat de résidence');
        $this->procedure('Procédure en préparation', 'brouillon');
        $this->procedure('Ancienne procédure', 'desactivee');

        $this->getJson('/api/procedures')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.titre', 'Certificat de résidence')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_rf004_la_fiche_affiche_conditions_pieces_etapes_et_service(): void
    {
        $this->procedure('Certificat de résidence');

        $this->getJson('/api/procedures/certificat-de-residence')
            ->assertOk()
            ->assertJsonPath('data.pieces.0.libelle', "Pièce d'identité")
            ->assertJsonPath('data.etapes.0.titre', 'Dépôt')
            ->assertJsonPath('data.service.nom', 'Mairie de Diamniadio')
            ->assertJsonPath('data.categorie.slug', 'etat-civil');
    }

    public function test_rf004_une_procedure_non_publiee_est_introuvable(): void
    {
        $this->procedure('Brouillon secret', 'brouillon');

        $this->getJson('/api/procedures/brouillon-secret')->assertNotFound();
    }

    public function test_rf005_la_recherche_retourne_les_procedures_correspondantes(): void
    {
        $this->procedure('Certificat de résidence');
        $this->procedure('Extrait de naissance');

        $this->getJson('/api/procedures?q=naissance')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.titre', 'Extrait de naissance');

        $this->getJson('/api/procedures?categorie=etat-civil')->assertJsonCount(2, 'data');
        $this->getJson('/api/procedures?categorie=justice')->assertJsonCount(0, 'data');
    }

    public function test_rf004_tri_par_procedures_les_plus_demandees(): void
    {
        $peu = $this->procedure('Alpha peu demandée');
        $beaucoup = $this->procedure('Zeta très demandée');
        $citoyen = User::factory()->create();
        foreach ([[$beaucoup, 3], [$peu, 1]] as [$p, $n]) {
            for ($i = 0; $i < $n; $i++) {
                $d = new Dossier;
                $d->procedure_id = $p->id;
                $d->citoyen_id = $citoyen->id;
                $d->statut = StatutDossier::Soumis;
                $d->soumis_at = now();
                $d->save();
            }
        }

        $this->getJson('/api/procedures?tri=populaires')
            ->assertOk()
            ->assertJsonPath('data.0.titre', 'Zeta très demandée')
            ->assertJsonPath('data.0.dossiers_count', 3)
            ->assertJsonPath('data.1.dossiers_count', 1);
    }

    public function test_rf021_recherche_de_services_par_commune(): void
    {
        Service::create(['nom' => 'Mairie de Thiès', 'type' => 'mairie', 'region' => 'Thiès', 'commune' => 'Thiès']);

        $this->getJson('/api/services?q=Diamniadio')
            ->assertOk()
            ->assertJsonCount(1, 'data.services')
            ->assertJsonPath('data.services.0.nom', 'Mairie de Diamniadio');

        $this->getJson('/api/services?region=Thiès')->assertJsonCount(1, 'data.services');
    }

    public function test_rf017_seul_l_admin_gere_les_procedures(): void
    {
        Sanctum::actingAs(User::factory()->agent()->create());
        $this->getJson('/api/admin/procedures')->assertForbidden();
        $this->postJson('/api/admin/procedures', [])->assertForbidden();
    }

    public function test_rf017_l_admin_cree_une_procedure_en_brouillon_avec_pieces_et_etapes(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $r = $this->postJson('/api/admin/procedures', [
            'titre' => 'Certificat de vie',
            'categorie_id' => $this->categorie->id,
            'service_id' => $this->service->id,
            'resume' => 'Prouver que vous êtes en vie.',
            'delai_jours' => 2,
            'pieces' => [
                ['libelle' => "Pièce d'identité", 'obligatoire' => true],
                ['libelle' => 'Photo', 'obligatoire' => false],
            ],
            'etapes' => [['titre' => 'Dépôt'], ['titre' => 'Délivrance']],
        ]);

        $r->assertCreated()
            ->assertJsonPath('data.statut', 'brouillon')
            ->assertJsonPath('data.slug', 'certificat-de-vie')
            ->assertJsonCount(2, 'data.pieces')
            ->assertJsonPath('data.pieces.1.obligatoire', false);

        $this->assertDatabaseHas('journal_actions', ['action' => 'admin.procedure.creee']);
        // Brouillon : invisible du public
        $this->getJson('/api/procedures/certificat-de-vie')->assertNotFound();
    }

    public function test_rf017_publier_puis_desactiver_une_procedure(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $p = $this->procedure('Légalisation', 'brouillon');

        $this->patchJson("/api/admin/procedures/{$p->id}/statut", ['statut' => 'publiee'])->assertOk();
        $this->getJson('/api/procedures/legalisation')->assertOk();

        $this->patchJson("/api/admin/procedures/{$p->id}/statut", ['statut' => 'desactivee'])->assertOk();
        $this->getJson('/api/procedures/legalisation')->assertNotFound();

        $this->assertSame(2, JournalAction::where('action', 'admin.procedure.statut')->count());
    }

    public function test_rf017_une_procedure_sans_piece_ne_peut_pas_etre_publiee(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $p = $this->procedure('Sans pièce', 'brouillon');
        $p->pieces()->delete();

        $this->patchJson("/api/admin/procedures/{$p->id}/statut", ['statut' => 'publiee'])->assertStatus(422);
    }

    public function test_rf017_modifier_remplace_les_pieces_dans_l_ordre(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $p = $this->procedure('Certificat de résidence');

        $this->putJson("/api/admin/procedures/{$p->id}", [
            'titre' => 'Certificat de résidence',
            'categorie_id' => $this->categorie->id,
            'resume' => 'Nouveau résumé',
            'pieces' => [['libelle' => 'Facture'], ['libelle' => 'CNI']],
            'etapes' => [['titre' => 'Unique étape']],
        ])->assertOk()
            ->assertJsonPath('data.pieces.0.libelle', 'Facture')
            ->assertJsonPath('data.pieces.1.libelle', 'CNI')
            ->assertJsonCount(1, 'data.etapes');
    }
}
