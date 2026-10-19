<?php

namespace App\Http\Resources;

use App\Enums\Role;
use App\Enums\StatutDossier;
use App\Models\Dossier;
use App\Models\Paiement;
use App\Models\User;
use App\Services\PayDunya;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Dossier */
class DossierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $estAdministration = $user && $user->role !== Role::Citoyen;

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            // Réservé au citoyen propriétaire : permet le suivi sans compte.
            'code_suivi' => $user && $user->id === $this->citoyen_id ? $this->code_suivi : null,
            // Code de retrait : montré au seul citoyen, tant que le document l'attend. L'agent ne le voit jamais.
            'code_retrait' => $user && $user->id === $this->citoyen_id && $this->statut === StatutDossier::PretARetirer ? $this->code_retrait : null,
            'pret_at' => $this->pret_at?->toIso8601String(),
            // Paiement des frais (Wave, Orange Money) : montant dû et dernier paiement.
            'frais' => $this->whenLoaded('procedure', fn () => (int) $this->procedure->frais),
            'paiement' => $this->whenLoaded('paiements', fn () => ($this->paiements->firstWhere('statut', Paiement::PAYE) ?? $this->paiements->first())?->versTableau()),
            'paiement_en_ligne' => PayDunya::configure(),
            'paiement_mode' => PayDunya::mode(),
            'retire_at' => $this->retire_at?->toIso8601String(),
            'statut' => $this->statut->value,
            'statut_libelle' => $this->statut->libelle(),
            'motif' => $this->motif,
            'precisions' => $this->precisions,
            'motif_decision' => $this->motif_decision,
            'soumis_at' => $this->soumis_at?->toIso8601String(),
            'decision_at' => $this->decision_at?->toIso8601String(),
            'cloture_at' => $this->cloture_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'jours_depuis_soumission' => $this->joursDepuisSoumission(),
            'en_retard' => $this->whenLoaded('procedure', fn () => $this->estEnRetard()),

            'procedure' => $this->whenLoaded('procedure', fn () => [
                'id' => $this->procedure->id,
                'titre' => $this->procedure->titre,
                'slug' => $this->procedure->slug,
                'delai_jours' => $this->procedure->delai_jours,
                'categorie' => $this->procedure->relationLoaded('categorie') ? [
                    'nom' => $this->procedure->categorie->nom,
                    'icone' => $this->procedure->categorie->icone,
                ] : null,
                'pieces' => $this->procedure->relationLoaded('pieces') ? $this->procedure->pieces->map(fn ($p) => [
                    'id' => $p->id,
                    'libelle' => $p->libelle,
                    'description' => $p->description,
                    'obligatoire' => $p->obligatoire,
                ]) : null,
            ]),
            'service' => $this->whenLoaded('service', fn () => $this->service ? [
                'id' => $this->service->id,
                'nom' => $this->service->nom,
                'adresse' => $this->service->adresse,
                'commune' => $this->service->commune,
                'horaires' => $this->service->horaires,
                'telephone' => $this->service->telephone,
                'latitude' => $this->service->latitude,
                'longitude' => $this->service->longitude,
            ] : null),
            'citoyen' => $this->whenLoaded('citoyen', fn () => [
                'id' => $this->citoyen->id,
                'nom_complet' => $this->citoyen->nom_complet,
                'prenom' => $this->citoyen->prenom,
                'nom' => $this->citoyen->nom,
                'email' => $estAdministration ? $this->citoyen->email : null,
                'telephone' => $estAdministration ? $this->citoyen->telephone : null,
                'region' => $estAdministration ? $this->citoyen->region : null,
                'commune' => $estAdministration ? $this->citoyen->commune : null,
            ]),
            // Démonstration uniquement (jamais en production) : comptes agents qui reçoivent ce dossier,
            // pour savoir avec quel compte se connecter. Envoyé sur la page du dossier, pas dans les listes.
            'agents_demo' => $this->when(
                ! app()->isProduction() && $this->service_id && $this->relationLoaded('historique'),
                fn () => User::where('service_id', $this->service_id)->where('role', Role::Agent)->where('actif', true)->pluck('email'),
            ),
            'agent' => $this->whenLoaded('agent', fn () => $this->agent ? [
                'id' => $this->agent->id,
                'nom_complet' => $this->agent->nom_complet,
            ] : null),

            'documents' => DocumentResource::collection($this->whenLoaded('documents')),
            'documents_count' => $this->whenCounted('documents'),
            'documents_a_verifier_count' => $this->whenCounted('documents_a_verifier'),
            'documents_a_verifier' => $this->whenLoaded('documents', fn () => $this->documentsAVerifier()),
            'pieces_manquantes' => $this->whenLoaded('documents', fn () => $this->piecesManquantes()->pluck('id')),

            'historique' => $this->whenLoaded('historique', fn () => $this->historique->map(fn ($h) => [
                'id' => $h->id,
                'ancien_statut' => $h->ancien_statut?->value,
                'nouveau_statut' => $h->nouveau_statut->value,
                'nouveau_statut_libelle' => $h->nouveau_statut->libelle(),
                'commentaire' => $h->commentaire,
                'auteur' => $h->user ? ['nom_complet' => $h->user->nom_complet, 'role' => $h->user->role->value] : null,
                'created_at' => $h->created_at->toIso8601String(),
            ])),

            'observations' => $this->whenLoaded('observations', fn () => $this->observations
                ->when(! $estAdministration, fn ($c) => $c->where('interne', false))
                ->values()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'contenu' => $o->contenu,
                    'interne' => $o->interne,
                    'auteur' => $o->user ? [
                        'id' => $o->user->id,
                        'nom_complet' => $o->user->nom_complet,
                        'role' => $o->user->role->value,
                    ] : null,
                    'created_at' => $o->created_at->toIso8601String(),
                ])),

            'permissions' => $user ? [
                'modifier' => $user->can('update', $this->resource),
                'supprimer' => $user->can('delete', $this->resource),
                'traiter' => $user->can('traiter', $this->resource),
                'commenter' => $user->can('commenter', $this->resource),
                'transitions' => $user->can('traiter', $this->resource)
                    ? array_keys(array_filter($this->statut->transitions(), fn ($a) => $a === 'agent'))
                    : [],
            ] : null,
        ];
    }
}
