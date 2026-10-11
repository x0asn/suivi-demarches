<?php

namespace Tests\Feature\Services;

use App\Enums\RegleCompetence;
use App\Models\Categorie;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Module M08 — Compétence des administrations (RF-021) : l'administration la plus proche
 * n'est pas forcément celle qui est habilitée à traiter la demande.
 */
class CompetenceTest extends TestCase
{
    use RefreshDatabase;

    private Service $mairieDakar;

    private Service $mairieThies;

    private Service $tribunal;

    private Procedure $extrait;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mairieDakar = Service::create(['nom' => 'Mairie de Dakar-Plateau', 'type' => 'mairie', 'region' => 'Dakar', 'commune' => 'Dakar-Plateau', 'latitude' => 14.6681, 'longitude' => -17.4372]);
        $this->mairieThies = Service::create(['nom' => 'Mairie de Thiès', 'type' => 'mairie', 'region' => 'Thiès', 'commune' => 'Thiès', 'latitude' => 14.7887, 'longitude' => -16.9260]);
        $this->tribunal = Service::create(['nom' => 'Tribunal de Dakar', 'type' => 'tribunal', 'region' => 'Dakar', 'commune' => 'Dakar-Plateau']);

        $categorie = Categorie::create(['nom' => 'État civil', 'slug' => 'etat-civil']);
        $this->extrait = new Procedure([
            'titre' => "Extrait d'acte de naissance", 'slug' => 'extrait-naissance', 'resume' => 'r',
            'categorie_id' => $categorie->id, 'service_id' => $this->mairieDakar->id,
            'regle_competence' => RegleCompetence::LieuNaissance,
        ]);
        $this->extrait->statut = 'publiee';
        $this->extrait->save();
        $this->extrait->services()->syncWithoutDetaching([$this->mairieThies->id]);
        $this->extrait->pieces()->create(['libelle' => "Pièce d'identité", 'obligatoire' => true]);
    }

    public function test_rf021_chaque_administration_indique_les_demarches_qu_elle_traite(): void
    {
        $services = collect($this->getJson('/api/services')->assertOk()->json('data.services'))->keyBy('nom');

        $this->assertSame(["Extrait d'acte de naissance"], array_column($services['Mairie de Thiès']['demarches'], 'titre'));
        $this->assertSame([], $services['Tribunal de Dakar']['demarches']);
    }

    public function test_rf021_la_recherche_par_demarche_ne_renvoie_que_les_administrations_habilitees(): void
    {
        $this->getJson('/api/services?demarche=extrait-naissance')
            ->assertOk()
            ->assertJsonCount(2, 'data.services')
            ->assertJsonMissing(['nom' => 'Tribunal de Dakar'])
            ->assertJsonPath('data.competence.valeur', 'lieu_naissance')
            ->assertJsonPath('data.competence.depend_du_territoire', true)
            ->assertJsonPath('data.competence.demarche.slug', 'extrait-naissance');
    }

    public function test_rf021_la_fiche_d_une_demarche_donne_la_regle_et_les_administrations_habilitees(): void
    {
        $this->getJson('/api/procedures/extrait-naissance')
            ->assertOk()
            ->assertJsonPath('data.competence.valeur', 'lieu_naissance')
            ->assertJsonCount(2, 'data.services');
    }

    public function test_le_service_de_reference_est_toujours_habilite(): void
    {
        $this->assertTrue($this->extrait->services->contains($this->mairieDakar));
    }

    public function test_rf006_le_citoyen_doit_choisir_l_administration_quand_plusieurs_sont_habilitees(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/dossiers', ['procedure' => 'extrait-naissance'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('service_id');

        $this->assertSame(0, Dossier::count());
    }

    public function test_rf006_le_dossier_est_adresse_a_l_administration_choisie(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/dossiers', ['procedure' => 'extrait-naissance', 'service_id' => $this->mairieThies->id])
            ->assertCreated()
            ->assertJsonPath('data.service.nom', 'Mairie de Thiès');
    }

    public function test_rf006_une_administration_non_habilitee_est_refusee(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/dossiers', ['procedure' => 'extrait-naissance', 'service_id' => $this->tribunal->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('service_id');
    }

    public function test_rg006_seul_l_agent_de_l_administration_choisie_voit_le_dossier(): void
    {
        $citoyen = User::factory()->create();
        Sanctum::actingAs($citoyen);
        $id = $this->postJson('/api/dossiers', ['procedure' => 'extrait-naissance', 'service_id' => $this->mairieThies->id, 'motif' => 'Concours'])->json('data.id');
        Dossier::find($id)->forceFill(['statut' => 'soumis', 'soumis_at' => now()])->save();

        $agentDakar = User::factory()->agent()->create();
        $agentDakar->forceFill(['service_id' => $this->mairieDakar->id])->save();
        Sanctum::actingAs($agentDakar);
        $this->getJson("/api/dossiers/{$id}")->assertForbidden();

        $agentThies = User::factory()->agent()->create();
        $agentThies->forceFill(['service_id' => $this->mairieThies->id])->save();
        Sanctum::actingAs($agentThies);
        $this->getJson("/api/dossiers/{$id}")->assertOk();
    }

    public function test_rf017_l_admin_definit_la_regle_et_les_administrations_habilitees(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->putJson("/api/admin/procedures/{$this->extrait->id}", [
            'titre' => $this->extrait->titre,
            'categorie_id' => $this->extrait->categorie_id,
            'service_id' => $this->mairieDakar->id,
            'resume' => 'Résumé',
            'regle_competence' => 'nationale',
            'service_ids' => [$this->tribunal->id],
        ])->assertOk()->assertJsonPath('data.competence.valeur', 'nationale');

        // Le service de référence reste habilité, la mairie de Thiès est retirée.
        $this->assertEqualsCanonicalizing(
            [$this->mairieDakar->id, $this->tribunal->id],
            $this->extrait->services()->pluck('services.id')->all()
        );
    }
}
