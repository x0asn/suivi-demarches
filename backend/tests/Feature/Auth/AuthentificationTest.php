<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Module M01 — RF-001, RF-002, RG-001, RG-009, RF-022.
 */
class AuthentificationTest extends TestCase
{
    use RefreshDatabase;

    private array $inscription = [
        'prenom' => 'Aida',
        'nom' => 'Ndoye',
        'email' => 'Aida.Ndoye@exemple.sn',
        'telephone' => '+221 77 123 45 67',
        'region' => 'Thiès',
        'commune' => 'Mbour',
        'password' => 'MotDePasse1',
        'password_confirmation' => 'MotDePasse1',
    ];

    public function test_rf001_un_citoyen_peut_creer_un_compte(): void
    {
        $response = $this->postJson('/api/auth/register', $this->inscription);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'aida.ndoye@exemple.sn')
            ->assertJsonPath('data.user.role', 'citoyen')
            ->assertJsonPath('data.user.region', 'Thiès')
            ->assertJsonStructure(['data' => ['token']]);

        $this->assertDatabaseHas('users', ['email' => 'aida.ndoye@exemple.sn', 'role' => 'citoyen']);
        $this->assertDatabaseHas('journal_actions', ['action' => 'compte.inscription']);
    }

    public function test_rf001_l_inscription_ne_permet_pas_de_choisir_son_role(): void
    {
        $this->postJson('/api/auth/register', $this->inscription + ['role' => 'admin'])->assertCreated();

        $this->assertSame(Role::Citoyen, User::first()->role);
    }

    public function test_rg001_l_email_est_unique(): void
    {
        User::factory()->create(['email' => 'aida.ndoye@exemple.sn']);

        $this->postJson('/api/auth/register', $this->inscription)
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.email.0', 'Un compte existe déjà avec cette adresse e-mail.');
    }

    public function test_rf001_les_champs_obligatoires_sont_valides_en_francais(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['prenom', 'nom', 'email', 'password'])
            ->assertJsonPath('errors.prenom.0', 'Le champ prénom est obligatoire.');
    }

    public function test_rf001_la_region_du_senegal_est_obligatoire(): void
    {
        $sansRegion = $this->inscription;
        unset($sansRegion['region']);
        $this->postJson('/api/auth/register', $sansRegion)
            ->assertStatus(422)
            ->assertJsonPath('errors.region.0', 'Le champ région est obligatoire.');

        $this->postJson('/api/auth/register', array_merge($this->inscription, ['region' => 'Paris']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('region');
    }

    public function test_rf001_le_mot_de_passe_doit_etre_robuste(): void
    {
        $this->postJson('/api/auth/register', array_merge($this->inscription, [
            'password' => 'court', 'password_confirmation' => 'court',
        ]))->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_rf002_connexion_reussie_renvoie_un_jeton(): void
    {
        $user = User::factory()->create(['email' => 'fatou@exemple.sn']);

        $this->postJson('/api/auth/login', ['email' => 'FATOU@exemple.sn', 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonStructure(['data' => ['token']]);

        $this->assertNotNull($user->fresh()->derniere_connexion_at);
        $this->assertDatabaseHas('journal_actions', ['action' => 'connexion.succes', 'user_id' => $user->id]);
    }

    public function test_rf002_message_generique_si_identifiants_invalides(): void
    {
        User::factory()->create(['email' => 'fatou@exemple.sn']);

        $mauvaisMotDePasse = $this->postJson('/api/auth/login', ['email' => 'fatou@exemple.sn', 'password' => 'faux']);
        $emailInconnu = $this->postJson('/api/auth/login', ['email' => 'inconnu@exemple.sn', 'password' => 'faux']);

        $mauvaisMotDePasse->assertStatus(401);
        $emailInconnu->assertStatus(401);
        // Même message dans les deux cas : on ne révèle pas si le compte existe (§19).
        $this->assertSame($mauvaisMotDePasse->json('message'), $emailInconnu->json('message'));
        $this->assertDatabaseHas('journal_actions', ['action' => 'connexion.echec', 'resultat' => 'echec']);
    }

    public function test_rg009_un_compte_desactive_ne_peut_pas_se_connecter(): void
    {
        User::factory()->inactif()->create(['email' => 'off@exemple.sn']);

        $this->postJson('/api/auth/login', ['email' => 'off@exemple.sn', 'password' => 'password'])
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_rg009_un_jeton_existant_est_refuse_apres_desactivation(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;
        $user->forceFill(['actif' => false])->save();

        $this->withToken($token)->getJson('/api/auth/me')->assertForbidden();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_rf002_deconnexion_invalide_le_jeton(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_une_route_protegee_exige_une_authentification(): void
    {
        $this->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Vous devez être connecté pour accéder à cette ressource.');
    }

    public function test_recuperation_d_acces_par_email(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'oubli@exemple.sn']);
        $user->createToken('ancienne-session');

        $this->postJson('/api/auth/forgot-password', ['email' => 'oubli@exemple.sn'])->assertOk();

        $jeton = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$jeton) {
            $jeton = $notification->token;

            return true;
        });

        $this->postJson('/api/auth/reset-password', [
            'token' => $jeton,
            'email' => 'oubli@exemple.sn',
            'password' => 'NouveauMdp1',
            'password_confirmation' => 'NouveauMdp1',
        ])->assertOk();

        $this->postJson('/api/auth/login', ['email' => 'oubli@exemple.sn', 'password' => 'NouveauMdp1'])->assertOk();
        // Les anciennes sessions ont été fermées ; seule la nouvelle connexion existe.
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_recuperation_d_acces_ne_revele_pas_si_le_compte_existe(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'personne@exemple.sn'])
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}
