<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Journal;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Module M01 — Authentification (RF-001, RF-002).
 */
class AuthController extends Controller
{
    /** RF-001 : inscription d'un citoyen. Le rôle est toujours « citoyen ». */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = new User($request->validated());
        $user->role = Role::Citoyen;
        $user->derniere_connexion_at = now();
        $user->save();

        Journal::enregistrer('compte.inscription', $user, acteur: $user);

        return $this->succes([
            'user' => new UserResource($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], 'Votre compte a été créé avec succès.', 201);
    }

    /** RF-002 : connexion. Message générique en cas d'échec (§19). */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            Journal::enregistrer('connexion.echec', $user, ['email' => $request->email], 'echec', $user);

            return $this->erreur('Adresse e-mail ou mot de passe incorrect.', 401);
        }

        // RG-009
        if (! $user->actif) {
            Journal::enregistrer('connexion.refusee_compte_inactif', $user, resultat: 'echec', acteur: $user);

            return $this->erreur('Votre compte est désactivé. Contactez l\'administration.', 403);
        }

        $user->forceFill(['derniere_connexion_at' => now()])->save();
        Journal::enregistrer('connexion.succes', $user, acteur: $user);

        return $this->succes([
            'user' => new UserResource($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], 'Connexion réussie.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        Journal::enregistrer('deconnexion', $request->user());

        return $this->succes(null, 'Vous êtes déconnecté.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->succes(new UserResource($request->user()->load('service')));
    }

    /**
     * Récupération d'accès : envoie un lien de réinitialisation.
     * La réponse est identique que l'adresse existe ou non (pas de fuite d'information).
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return $this->succes(null, 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d\'être envoyé.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $statut = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                // Toutes les sessions ouvertes sont fermées par sécurité.
                $user->tokens()->delete();
                Journal::enregistrer('mot_de_passe.reinitialise', $user, acteur: $user);
                event(new PasswordReset($user));
            }
        );

        if ($statut !== Password::PASSWORD_RESET) {
            return $this->erreur('Ce lien de réinitialisation est invalide ou a expiré.', 422);
        }

        return $this->succes(null, 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.');
    }
}
