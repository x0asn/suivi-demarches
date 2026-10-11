<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * RF-018 / UC-10 : gestion des utilisateurs et des rôles par l'administrateur.
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'role' => ['nullable', Rule::enum(Role::class)],
            'actif' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $users = User::query()
            ->with('service')
            ->when($request->role, fn ($q, $role) => $q->where('role', $role))
            ->when($request->filled('actif'), fn ($q) => $q->where('actif', $request->boolean('actif')))
            ->when($request->q, function ($q, $terme) {
                $q->where(fn ($q) => $q
                    ->where('nom', 'like', "%{$terme}%")
                    ->orWhere('prenom', 'like', "%{$terme}%")
                    ->orWhere('email', 'like', "%{$terme}%"));
            })
            ->latest()
            ->paginate(15);

        return $this->succes(UserResource::collection($users));
    }

    public function show(User $user): JsonResponse
    {
        return $this->succes(new UserResource($user->load('service')));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = new User($request->safe()->except(['role', 'service_id']));
        $user->role = Role::from($request->role);
        $user->service_id = $request->service_id;
        $user->save();
        $user->load('service');

        Journal::enregistrer('admin.utilisateur.cree', $user, ['role' => $user->role->value]);

        return $this->succes(new UserResource($user), 'Le compte a été créé.', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $estSoiMeme = $request->user()->is($user);

        // Un administrateur ne peut pas se retirer ses propres droits ni se désactiver.
        if ($estSoiMeme && ($request->has('role') && $request->role !== Role::Admin->value || $request->has('actif') && ! $request->boolean('actif'))) {
            return $this->erreur('Vous ne pouvez pas modifier votre propre rôle ni désactiver votre propre compte.', 422);
        }

        $user->fill($request->safe()->only(['prenom', 'nom', 'telephone']));
        if ($request->has('role')) {
            $user->role = Role::from($request->role);
        }
        if ($request->has('actif')) {
            $user->actif = $request->boolean('actif');
        }
        if ($request->has('service_id')) {
            $user->service_id = $request->service_id;
        }

        $avant = array_intersect_key($user->getOriginal(), $user->getDirty());
        $apres = $user->getDirty();
        $user->save();

        if ($apres) {
            if (array_key_exists('actif', $apres) && ! $user->actif) {
                $user->tokens()->delete(); // déconnexion immédiate (RG-009)
            }
            Journal::enregistrer('admin.utilisateur.modifie', $user, [
                'avant' => array_map(fn ($v) => $v instanceof Role ? $v->value : $v, $avant),
                'apres' => array_map(fn ($v) => $v instanceof Role ? $v->value : $v, $apres),
            ]);
        }

        return $this->succes(new UserResource($user->load('service')), 'Le compte a été mis à jour.');
    }
}
