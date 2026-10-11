<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RF-003 : gestion du profil.
 */
class ProfilTest extends TestCase
{
    use RefreshDatabase;

    public function test_rf003_un_utilisateur_modifie_son_profil(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', ['telephone' => '+221 78 000 00 00', 'prenom' => 'Sokhna'])
            ->assertOk()
            ->assertJsonPath('data.prenom', 'Sokhna');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'telephone' => '+221 78 000 00 00']);
        $this->assertDatabaseHas('journal_actions', ['action' => 'profil.modifie', 'user_id' => $user->id]);
    }

    public function test_rf003_le_profil_ne_permet_pas_de_changer_son_role(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson('/api/profile', ['role' => 'admin', 'actif' => false])->assertOk();

        $this->assertSame('citoyen', $user->fresh()->role->value);
        $this->assertTrue($user->fresh()->actif);
    }

    public function test_changement_de_mot_de_passe_exige_l_ancien(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->putJson('/api/profile/password', [
            'current_password' => 'mauvais',
            'password' => 'NouveauMdp1',
            'password_confirmation' => 'NouveauMdp1',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->withToken($token)->putJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'NouveauMdp1',
            'password_confirmation' => 'NouveauMdp1',
        ])->assertOk();

        $this->assertTrue(Hash::check('NouveauMdp1', $user->fresh()->password));
    }
}
