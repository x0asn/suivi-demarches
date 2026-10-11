<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RF-018 (utilisateurs et rôles), RF-022 / RG-010 (journalisation), RNF-001 (contrôle d'accès).
 */
class GestionUtilisateursTest extends TestCase
{
    use RefreshDatabase;

    public function test_rnf001_seul_l_administrateur_accede_a_la_gestion_des_utilisateurs(): void
    {
        foreach (['citoyen', 'agent', 'responsable'] as $role) {
            Sanctum::actingAs(User::factory()->state(['role' => $role])->create());

            $this->getJson('/api/admin/users')
                ->assertForbidden()
                ->assertJsonPath('message', 'Vous n\'avez pas les droits nécessaires pour cette action.');
        }

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/admin/users')->assertOk()->assertJsonStructure(['data', 'meta' => ['total']]);
    }

    public function test_rf018_l_admin_cree_un_compte_agent(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/users', [
            'prenom' => 'Moustapha',
            'nom' => 'Gueye',
            'email' => 'm.gueye@mairie.sn',
            'role' => 'agent',
            'password' => 'Agent2026',
        ])->assertCreated()->assertJsonPath('data.role', 'agent');

        $this->assertDatabaseHas('users', ['email' => 'm.gueye@mairie.sn', 'role' => 'agent']);
        $this->assertDatabaseHas('journal_actions', ['action' => 'admin.utilisateur.cree']);
    }

    public function test_rf018_l_admin_change_un_role_et_l_action_est_journalisee(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $user = User::factory()->create();

        $this->patchJson("/api/admin/users/{$user->id}", ['role' => 'agent'])->assertOk();

        $this->assertSame('agent', $user->fresh()->role->value);
        $journal = \App\Models\JournalAction::where('action', 'admin.utilisateur.modifie')->first();
        $this->assertSame(['role' => 'citoyen'], $journal->details['avant']);
        $this->assertSame(['role' => 'agent'], $journal->details['apres']);
    }

    public function test_rg009_desactiver_un_compte_ferme_ses_sessions(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $user = User::factory()->create();
        $user->createToken('web');

        $this->patchJson("/api/admin/users/{$user->id}", ['actif' => false])->assertOk();

        $this->assertFalse($user->fresh()->actif);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_un_admin_ne_peut_pas_se_desactiver_lui_meme(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/users/{$admin->id}", ['actif' => false])->assertStatus(422);
        $this->patchJson("/api/admin/users/{$admin->id}", ['role' => 'citoyen'])->assertStatus(422);

        $this->assertTrue($admin->fresh()->actif);
    }

    public function test_rf022_l_admin_consulte_le_journal(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $this->postJson('/api/auth/login', ['email' => 'x@exemple.sn', 'password' => 'faux']);

        $this->getJson('/api/admin/journal?resultat=echec')
            ->assertOk()
            ->assertJsonPath('data.0.action', 'connexion.echec');
    }

    public function test_un_utilisateur_inexistant_renvoie_404_propre(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/admin/users/999999')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'La ressource demandée est introuvable.');
    }
}
