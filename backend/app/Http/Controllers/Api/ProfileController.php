<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;

/**
 * RF-003 : gestion du profil par l'utilisateur connecté.
 */
class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $modifie = array_keys($user->getDirty());
        $user->save();

        if ($modifie) {
            Journal::enregistrer('profil.modifie', $user, ['champs' => $modifie]);
        }

        return $this->succes(new UserResource($user), 'Votre profil a été mis à jour.');
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->password = $request->password;
        $user->save();

        // Les autres sessions sont fermées, la session courante est conservée.
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
        Journal::enregistrer('mot_de_passe.modifie', $user);

        return $this->succes(null, 'Votre mot de passe a été modifié.');
    }
}
