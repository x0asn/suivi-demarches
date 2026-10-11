<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Http\Resources\DossierResource;
use App\Models\Dossier;
use App\Models\Procedure;
use App\Services\Journal;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Module M03 — Dossiers du citoyen (RF-006, RF-007, RF-009, RF-011) et consultation d'un dossier autorisé.
 */
class DossierController extends Controller
{
    /** RF-011 : liste personnelle, filtrable par statut. */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'statut' => ['nullable', Rule::in([...StatutDossier::valeurs(), 'en_cours', 'termines'])],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $dossiers = Dossier::visiblesPar($request->user())
            ->with(['procedure.categorie', 'service'])
            ->withCount('documents')
            ->when($request->statut === 'en_cours', fn ($q) => $q->whereNotIn('statut', ['termine', 'cloture', 'valide', 'rejete']))
            ->when($request->statut === 'termines', fn ($q) => $q->whereIn('statut', ['termine', 'cloture', 'valide', 'rejete']))
            ->when($request->statut && ! in_array($request->statut, ['en_cours', 'termines']), fn ($q) => $q->where('statut', $request->statut))
            ->when($request->q, fn ($q, $t) => $q->where(fn ($q) => $q
                ->where('reference', 'like', "%{$t}%")
                ->orWhereHas('procedure', fn ($p) => $p->where('titre', 'like', "%{$t}%"))))
            ->latest('updated_at')
            ->paginate(10);

        return $this->succes(DossierResource::collection($dossiers));
    }

    /** Compteurs pour le tableau de bord citoyen. */
    public function resume(Request $request): JsonResponse
    {
        $parStatut = Dossier::where('citoyen_id', $request->user()->id)
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $somme = fn (array $statuts) => collect($statuts)->sum(fn ($s) => $parStatut[$s] ?? 0);

        $recents = Dossier::where('citoyen_id', $request->user()->id)
            ->with(['procedure.categorie', 'historique'])
            ->latest('updated_at')
            ->limit(4)
            ->get();

        return $this->succes([
            'total' => $parStatut->sum(),
            'brouillons' => $somme(['brouillon']),
            'en_cours' => $somme(['soumis', 'en_verification', 'en_traitement']),
            'action_requise' => $somme(['correction_demandee']),
            'aboutis' => $somme(['valide', 'termine']),
            'rejetes' => $somme(['rejete', 'cloture']),
            'recents' => DossierResource::collection($recents)->resolve(),
        ]);
    }

    /** RF-006 : création d'un dossier (brouillon) pour une procédure publiée. */
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === Role::Citoyen, 403);

        $donnees = $request->validate([
            'procedure' => ['required', 'string'],
            'motif' => ['nullable', 'string', 'max:2000'],
            'precisions' => ['nullable', 'string', 'max:2000'],
        ], [], ['procedure' => 'procédure', 'motif' => 'objet de la demande']);

        $procedure = Procedure::publiees()->where('slug', $donnees['procedure'])->first();
        if (! $procedure) {
            return $this->erreur('Cette procédure n’est pas disponible en ligne.', 422, ['procedure' => ['Procédure introuvable ou non publiée.']]);
        }

        $dossier = DB::transaction(function () use ($request, $procedure, $donnees) {
            $dossier = new Dossier(['motif' => $donnees['motif'] ?? null, 'precisions' => $donnees['precisions'] ?? null]);
            $dossier->procedure_id = $procedure->id;
            $dossier->service_id = $procedure->service_id;
            $dossier->citoyen_id = $request->user()->id;
            $dossier->statut = StatutDossier::Brouillon;
            $dossier->save();

            $dossier->historique()->create([
                'user_id' => $request->user()->id,
                'ancien_statut' => null,
                'nouveau_statut' => StatutDossier::Brouillon->value,
            ]);

            return $dossier;
        });

        Journal::enregistrer('dossier.cree', $dossier, ['procedure' => $procedure->titre]);

        return $this->succes(
            new DossierResource($this->charger($dossier)),
            "Votre dossier {$dossier->reference} a été créé. Ajoutez vos pièces puis soumettez-le.",
            201
        );
    }

    /** RF-009 : statut courant, historique, pièces et échanges. */
    public function show(Request $request, Dossier $dossier): JsonResponse
    {
        $this->authorize('view', $dossier);

        return $this->succes(new DossierResource($this->charger($dossier)));
    }

    public function update(Request $request, Dossier $dossier): JsonResponse
    {
        $this->authorize('update', $dossier);

        $dossier->update($request->validate([
            'motif' => ['nullable', 'string', 'max:2000'],
            'precisions' => ['nullable', 'string', 'max:2000'],
        ], [], ['motif' => 'objet de la demande']));

        return $this->succes(new DossierResource($this->charger($dossier)), 'Vos informations ont été enregistrées.');
    }

    public function destroy(Dossier $dossier): JsonResponse
    {
        $this->authorize('delete', $dossier);

        Journal::enregistrer('dossier.brouillon_supprime', $dossier, ['reference' => $dossier->reference]);
        $dossier->documents->each->delete();
        $dossier->delete();

        return $this->succes(null, 'Le brouillon a été supprimé.');
    }

    /** RF-007 : soumission (horodatée) — ou nouvelle soumission après correction. */
    public function soumettre(Request $request, Dossier $dossier): JsonResponse
    {
        $this->authorize('update', $dossier);

        $correction = $dossier->statut === StatutDossier::CorrectionDemandee;
        Workflow::changerStatut($dossier, StatutDossier::Soumis, $request->user(), $correction ? 'Dossier complété par le citoyen.' : null);

        return $this->succes(
            new DossierResource($this->charger($dossier)),
            $correction
                ? 'Merci ! Votre dossier corrigé a été retransmis à l’agent.'
                : "Votre demande {$dossier->reference} a été transmise à l’administration."
        );
    }

    /** RF-015 : changement de statut par un agent habilité. */
    public function changerStatut(Request $request, Dossier $dossier): JsonResponse
    {
        $this->authorize('traiter', $dossier);

        $request->validate([
            'statut' => ['required', Rule::in(StatutDossier::valeurs())],
            'commentaire' => ['nullable', 'string', 'max:2000'],
        ]);

        $cible = StatutDossier::from($request->statut);
        Workflow::changerStatut($dossier, $cible, $request->user(), $request->commentaire);

        return $this->succes(new DossierResource($this->charger($dossier)), "Le dossier est maintenant « {$cible->libelle()} ».");
    }

    private function charger(Dossier $dossier): Dossier
    {
        return $dossier->fresh()->load([
            'procedure.categorie',
            'procedure.pieces',
            'service',
            'citoyen',
            'agent',
            'documents.verificateur',
            'historique.user',
            'observations.user',
        ]);
    }
}
