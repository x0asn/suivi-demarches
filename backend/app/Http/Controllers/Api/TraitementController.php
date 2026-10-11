<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Http\Resources\DossierResource;
use App\Models\Dossier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Module M05 — File de travail des agents (RF-013).
 * L'agent ne voit que les dossiers de son périmètre (RG-006) ; l'administrateur et le
 * responsable ont une vue en lecture sur l'ensemble des dossiers soumis.
 */
class TraitementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'statut' => ['nullable', Rule::in([...StatutDossier::valeurs(), 'a_traiter', 'tous'])],
            'q' => ['nullable', 'string', 'max:100'],
            'procedure' => ['nullable', 'integer'],
            'retard' => ['nullable', 'boolean'],
            'mes_dossiers' => ['nullable', 'boolean'],
        ]);

        $aTraiter = [StatutDossier::Soumis->value, StatutDossier::EnVerification->value, StatutDossier::EnTraitement->value];
        $statut = $request->statut ?: 'a_traiter';

        $dossiers = Dossier::visiblesPar($request->user())
            ->with(['procedure.categorie', 'citoyen', 'agent', 'service'])
            ->withCount([
                'documents',
                'documents as documents_a_verifier_count' => fn ($q) => $q->where('statut', 'en_attente'),
            ])
            ->when($statut === 'a_traiter', fn ($q) => $q->whereIn('statut', $aTraiter))
            ->when(! in_array($statut, ['a_traiter', 'tous']), fn ($q) => $q->where('statut', $statut))
            ->when($request->q, fn ($q, $t) => $q->where(fn ($q) => $q
                ->where('reference', 'like', "%{$t}%")
                ->orWhereHas('citoyen', fn ($c) => $c->where('nom', 'like', "%{$t}%")->orWhere('prenom', 'like', "%{$t}%"))
                ->orWhereHas('procedure', fn ($p) => $p->where('titre', 'like', "%{$t}%"))))
            ->when($request->procedure, fn ($q, $p) => $q->where('procedure_id', $p))
            ->when($request->boolean('mes_dossiers'), fn ($q) => $q->where('agent_id', $request->user()->id))
            ->when($request->boolean('retard'), fn ($q) => $q
                ->whereIn('statut', $aTraiter)
                ->whereHas('procedure', fn ($p) => $p->whereNotNull('delai_jours')
                    ->whereRaw('dossiers.soumis_at < '.$this->dateMoinsDelai())))
            // Les plus anciens d'abord : premier arrivé, premier servi.
            ->orderByRaw('soumis_at is null, soumis_at asc')
            ->paginate(15);

        return $this->succes(DossierResource::collection($dossiers));
    }

    /** Compteurs de la file de travail. */
    public function resume(Request $request): JsonResponse
    {
        $base = fn () => Dossier::visiblesPar($request->user());

        $parStatut = $base()->select('statut', DB::raw('count(*) as total'))->groupBy('statut')->pluck('total', 'statut');

        $enRetard = $base()
            ->whereIn('statut', ['soumis', 'en_verification', 'en_traitement'])
            ->with('procedure')
            ->get()
            ->filter->estEnRetard()
            ->count();

        return $this->succes([
            'par_statut' => $parStatut,
            'nouveaux' => $parStatut['soumis'] ?? 0,
            'en_verification' => $parStatut['en_verification'] ?? 0,
            'en_traitement' => $parStatut['en_traitement'] ?? 0,
            'en_attente_citoyen' => $parStatut['correction_demandee'] ?? 0,
            'en_retard' => $enRetard,
            'mes_dossiers' => $base()->where('agent_id', $request->user()->id)
                ->whereIn('statut', ['soumis', 'en_verification', 'en_traitement'])->count(),
            'traites_ce_mois' => $base()->whereIn('statut', ['valide', 'pret_a_retirer', 'rejete', 'termine', 'cloture'])
                ->where('decision_at', '>=', now()->startOfMonth())->count(),
        ]);
    }

    /** Expression SQL « maintenant moins le délai de la procédure », compatible MySQL et SQLite. */
    private function dateMoinsDelai(): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "datetime('now', '-' || procedures.delai_jours || ' days')"
            : 'DATE_SUB(NOW(), INTERVAL procedures.delai_jours DAY)';
    }
}
