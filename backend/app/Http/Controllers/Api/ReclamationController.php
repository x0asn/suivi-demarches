<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReclamationResource;
use App\Models\Dossier;
use App\Models\Reclamation;
use App\Models\User;
use App\Services\Journal;
use App\Services\Notifieur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Module M07 — Réclamations : création, suivi, traitement et clôture (RF-012, UC-09).
 */
class ReclamationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'statut' => ['nullable', Rule::in(array_keys(Reclamation::STATUTS))],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $reclamations = Reclamation::visiblesPar($request->user())
            ->with(['citoyen', 'traitant', 'dossier.procedure'])
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->q, fn ($q, $t) => $q->where(fn ($q) => $q
                ->where('reference', 'like', "%{$t}%")
                ->orWhere('sujet', 'like', "%{$t}%")))
            ->orderByRaw("case when statut in ('ouverte', 'en_cours') then 0 else 1 end")
            ->latest()
            ->paginate(10);

        return $this->succes(ReclamationResource::collection($reclamations));
    }

    public function options(Request $request): JsonResponse
    {
        return $this->succes([
            'motifs' => Reclamation::MOTIFS,
            'statuts' => Reclamation::STATUTS,
            'dossiers' => $request->user()->role === Role::Citoyen
                ? Dossier::where('citoyen_id', $request->user()->id)
                    ->where('statut', '!=', 'brouillon')
                    ->with('procedure:id,titre')
                    ->latest()
                    ->get()
                    ->map(fn ($d) => ['id' => $d->id, 'reference' => $d->reference, 'procedure' => $d->procedure->titre])
                : [],
        ]);
    }

    /** RF-012 : une réclamation est créée avec une référence et un statut. */
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === Role::Citoyen, 403);

        $donnees = $request->validate([
            'motif' => ['required', Rule::in(array_keys(Reclamation::MOTIFS))],
            'sujet' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:20', 'max:3000'],
            'dossier_id' => [
                'nullable', 'integer',
                Rule::exists('dossiers', 'id')->where('citoyen_id', $request->user()->id),
            ],
        ], [
            'description.min' => 'Décrivez votre réclamation en quelques phrases (20 caractères minimum).',
        ], ['motif' => 'motif', 'sujet' => 'sujet', 'description' => 'description', 'dossier_id' => 'dossier']);

        $reclamation = new Reclamation($donnees);
        $reclamation->citoyen_id = $request->user()->id;
        $reclamation->statut = 'ouverte';
        $reclamation->save();
        $reclamation->refresh()->load(['citoyen', 'dossier.procedure']);

        Journal::enregistrer('reclamation.creee', $reclamation, ['motif' => $reclamation->motif]);

        // Les administrateurs et, si la réclamation porte sur un dossier, les agents du service sont informés.
        $destinataires = User::where('actif', true)
            ->where(fn ($q) => $q->where('role', Role::Admin->value)
                ->when($reclamation->dossier, fn ($q) => $q->orWhere(fn ($q) => $q
                    ->where('role', Role::Agent->value)
                    ->where('service_id', $reclamation->dossier->service_id))))
            ->get();
        Notifieur::envoyer('admin.reclamation_nouvelle', $destinataires, [
            'reference' => $reclamation->reference,
            'citoyen' => $reclamation->citoyen->nom_complet,
        ], '/espace/reclamations', ['reference' => $reclamation->reference]);

        return $this->succes(new ReclamationResource($reclamation), "Votre réclamation {$reclamation->reference} a été enregistrée.", 201);
    }

    public function show(Reclamation $reclamation): JsonResponse
    {
        $this->authorize('view', $reclamation);

        return $this->succes(new ReclamationResource($reclamation->load(['citoyen', 'traitant', 'dossier.procedure'])));
    }

    /** Traitement : prise en charge, réponse et clôture. */
    public function update(Request $request, Reclamation $reclamation): JsonResponse
    {
        $this->authorize('traiter', $reclamation);

        if ($reclamation->estClose()) {
            return $this->erreur('Cette réclamation est déjà close.', 422);
        }

        $request->validate([
            'statut' => ['required', Rule::in(['en_cours', 'resolue', 'rejetee'])],
            'reponse' => ['nullable', 'string', 'max:3000', Rule::requiredIf(in_array($request->statut, ['resolue', 'rejetee'], true))],
        ], ['reponse.required' => 'Rédigez la réponse qui sera adressée au citoyen.'], ['reponse' => 'réponse']);

        $ancien = $reclamation->statut;
        $reclamation->statut = $request->statut;
        if ($request->filled('reponse')) {
            $reclamation->reponse = $request->reponse;
        }
        $reclamation->traitee_par = $request->user()->id;
        if ($reclamation->estClose()) {
            $reclamation->traitee_at = now();
        }
        $reclamation->save();

        Journal::enregistrer('reclamation.traitee', $reclamation, ['avant' => ['statut' => $ancien], 'apres' => ['statut' => $reclamation->statut]]);

        if ($reclamation->estClose()) {
            Notifieur::envoyer('reclamation.reponse', $reclamation->citoyen, ['reference' => $reclamation->reference], '/espace/reclamations', ['reference' => $reclamation->reference]);
        }

        return $this->succes(
            new ReclamationResource($reclamation->load(['citoyen', 'traitant', 'dossier.procedure'])),
            $reclamation->estClose() ? 'Réponse envoyée : le citoyen a été notifié.' : 'Réclamation prise en charge.'
        );
    }
}
