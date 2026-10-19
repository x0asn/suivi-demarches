<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dossiers\ChangerStatutRequest;
use App\Http\Requests\Dossiers\RemiseRequest;
use App\Http\Requests\Dossiers\StoreDossierRequest;
use App\Http\Requests\Dossiers\UpdateDossierRequest;
use App\Http\Resources\DossierResource;
use App\Models\Dossier;
use App\Models\Paiement;
use App\Models\Procedure;
use App\Services\Journal;
use App\Services\PayDunya;
use App\Services\Workflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

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
            // Documents prêts, que le citoyen doit venir retirer.
            'a_retirer' => $somme(['pret_a_retirer']),
            'aboutis' => $somme(['valide', 'termine']),
            'rejetes' => $somme(['rejete', 'cloture']),
            'recents' => DossierResource::collection($recents)->resolve(),
        ]);
    }

    /** RF-006 : création d'un dossier (brouillon) pour une procédure publiée. */
    public function store(StoreDossierRequest $request): JsonResponse
    {
        $donnees = $request->validated();

        $procedure = Procedure::publiees()->where('slug', $donnees['procedure'])->first();
        if (! $procedure) {
            return $this->erreur('Cette procédure n’est pas disponible en ligne.', 422, ['procedure' => ['Procédure introuvable ou non publiée.']]);
        }

        // M08 : le dossier est adressé à une administration habilitée à traiter cette démarche.
        $habilites = $procedure->services()->where('actif', true)->pluck('services.id');
        $serviceId = $donnees['service_id'] ?? ($habilites->count() === 1 ? $habilites->first() : null);
        if ($habilites->isNotEmpty() && ! $habilites->contains($serviceId)) {
            return $this->erreur('Choisissez l’administration compétente pour votre demande.', 422, [
                'service_id' => [$serviceId
                    ? 'Cette administration n’est pas habilitée à traiter cette démarche.'
                    : 'Indiquez à quelle administration vous adressez votre demande.'],
            ]);
        }
        $serviceId ??= $procedure->service_id;

        $dossier = DB::transaction(function () use ($request, $procedure, $donnees, $serviceId) {
            $dossier = new Dossier(['motif' => $donnees['motif'] ?? null, 'precisions' => $donnees['precisions'] ?? null]);
            $dossier->procedure_id = $procedure->id;
            $dossier->service_id = $serviceId;
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

    public function update(UpdateDossierRequest $request, Dossier $dossier): JsonResponse
    {
        $dossier->update($request->validated());

        return $this->succes(new DossierResource($this->charger($dossier)), 'Vos informations ont été enregistrées.');
    }

    public function destroy(Dossier $dossier): JsonResponse
    {
        $this->authorize('delete', $dossier);

        // Un paiement encore « en attente » a peut-être abouti : on le fait confirmer avant de supprimer.
        foreach ($dossier->paiements()->where('statut', Paiement::EN_ATTENTE)->whereNotNull('reference_prestataire')->get() as $paiement) {
            if (PayDunya::configure()) {
                try {
                    $etat = PayDunya::consulter($paiement->reference_prestataire);
                    PaiementController::actualiser($paiement, $etat['statut'], $etat['recu']);
                } catch (Throwable) {
                    return $this->erreur('Un paiement de ce dossier n’a pas encore pu être vérifié. Réessayez dans quelques minutes.', 409);
                }
            }
        }
        if ($dossier->estPaye()) {
            return $this->erreur('Les frais de ce dossier ont été payés : il ne peut pas être supprimé. Vous pouvez l’envoyer à l’administration.', 409);
        }

        Journal::enregistrer('dossier.brouillon_supprime', $dossier, ['reference' => $dossier->reference]);
        DB::transaction(function () use ($dossier) {
            // Tentatives sans argent versé (annulées, échouées, abandonnées) : rien à conserver.
            $dossier->paiements()->delete();
            $dossier->documents->each->delete();
            $dossier->delete();
        });

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
    public function changerStatut(ChangerStatutRequest $request, Dossier $dossier): JsonResponse
    {
        $cible = StatutDossier::from($request->statut);
        Workflow::changerStatut($dossier, $cible, $request->user(), $request->commentaire);

        return $this->succes(new DossierResource($this->charger($dossier)), "Le dossier est maintenant « {$cible->libelle()} ».");
    }

    /** Remise du document : l'agent saisit le code de retrait présenté par le citoyen. */
    public function remettre(RemiseRequest $request, Dossier $dossier): JsonResponse
    {
        Workflow::remettre($dossier, $request->user(), $request->code_retrait);

        return $this->succes(new DossierResource($this->charger($dossier)), 'Remise enregistrée : le dossier est terminé.');
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
            'paiements',
        ]);
    }
}
