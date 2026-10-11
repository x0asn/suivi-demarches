<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dossiers\StoreObservationRequest;
use App\Models\Dossier;
use App\Models\User;
use App\Services\Journal;
use App\Services\Notifieur;
use Illuminate\Http\JsonResponse;

/**
 * RF-016 : observations horodatées liées au dossier, et échanges avec le citoyen.
 */
class ObservationController extends Controller
{
    public function store(StoreObservationRequest $request, Dossier $dossier): JsonResponse
    {
        $donnees = $request->validated();

        $user = $request->user();
        $interne = $user->role === Role::Agent && $request->boolean('interne');

        $observation = $dossier->observations()->create([
            'user_id' => $user->id,
            'contenu' => trim($donnees['contenu']),
            'interne' => $interne,
        ]);

        Journal::enregistrer('dossier.observation', $dossier, ['interne' => $interne]);

        $variables = ['reference' => $dossier->reference, 'citoyen' => $dossier->citoyen->nom_complet];
        $contexte = ['dossier_id' => $dossier->id, 'reference' => $dossier->reference];

        if ($user->role === Role::Agent && ! $interne) {
            Notifieur::envoyer('observation.agent', $dossier->citoyen, $variables, "/espace/dossiers/{$dossier->id}", $contexte);
        } elseif ($user->role === Role::Citoyen) {
            $destinataires = $dossier->agent
                ? collect([$dossier->agent])
                : User::where('role', Role::Agent->value)->where('service_id', $dossier->service_id)->where('actif', true)->get();
            Notifieur::envoyer('agent.observation_citoyen', $destinataires, $variables, "/espace/traitement/{$dossier->id}", $contexte);
        }

        return $this->succes([
            'id' => $observation->id,
            'contenu' => $observation->contenu,
            'interne' => $observation->interne,
            'auteur' => ['id' => $user->id, 'nom_complet' => $user->nom_complet, 'role' => $user->role->value],
            'created_at' => $observation->created_at->toIso8601String(),
        ], $interne ? 'Note interne enregistrée.' : 'Message envoyé.', 201);
    }
}
