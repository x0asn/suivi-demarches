<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Models\Dossier;
use App\Models\Reclamation;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Module M09 — Statistiques et indicateurs de pilotage (RF-019, UC-08).
 * RG-012 : tous les chiffres sont calculés à partir des données enregistrées, sans valeur saisie à la main.
 */
class StatistiqueController extends Controller
{
    private const EN_COURS = ['soumis', 'en_verification', 'en_traitement', 'correction_demandee'];

    private const FAVORABLES = ['valide', 'pret_a_retirer', 'termine'];

    private const DEFAVORABLES = ['rejete', 'cloture'];

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date', 'after_or_equal:du'],
            'service' => ['nullable', 'integer'],
            'statut' => ['nullable', Rule::in(StatutDossier::valeurs())],
        ], [], ['du' => 'date de début', 'au' => 'date de fin']);

        $au = $request->filled('au') ? Carbon::parse($request->au)->endOfDay() : now()->endOfDay();
        $du = $request->filled('du') ? Carbon::parse($request->du)->startOfDay() : (clone $au)->subMonthsNoOverflow(6)->startOfMonth();

        // Dossiers déposés dans la période (hors brouillons)
        $dossiers = Dossier::query()
            ->with(['procedure:id,titre,delai_jours,categorie_id', 'procedure.categorie:id,nom', 'service:id,nom', 'citoyen:id,region'])
            ->whereNotNull('soumis_at')
            ->whereBetween('soumis_at', [$du, $au])
            ->when($request->service, fn ($q, $s) => $q->where('service_id', $s))
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->get(['id', 'procedure_id', 'service_id', 'citoyen_id', 'statut', 'soumis_at', 'decision_at', 'cloture_at']);

        $statut = fn (Dossier $d) => $d->statut->value;
        $decides = $dossiers->filter(fn ($d) => $d->decision_at !== null);
        $favorables = $dossiers->filter(fn ($d) => in_array($statut($d), self::FAVORABLES, true));
        $defavorables = $dossiers->filter(fn ($d) => in_array($statut($d), self::DEFAVORABLES, true));
        $delai = fn ($collection) => $collection->filter(fn ($d) => $d->decision_at)->avg(fn ($d) => $d->soumis_at->diffInHours($d->decision_at) / 24);
        $enRetard = $dossiers->filter(fn (Dossier $d) => $d->estEnRetard());
        $tauxValidation = ($favorables->count() + $defavorables->count()) > 0
            ? round(100 * $favorables->count() / ($favorables->count() + $defavorables->count()), 1)
            : null;

        // Respect du délai indicatif : décisions rendues dans le délai annoncé
        $dansLeDelai = $decides->filter(fn ($d) => $d->procedure?->delai_jours === null
            || $d->soumis_at->diffInHours($d->decision_at) / 24 <= $d->procedure->delai_jours);

        return $this->succes([
            'periode' => ['du' => $du->toDateString(), 'au' => $au->toDateString()],
            'indicateurs' => [
                'deposes' => $dossiers->count(),
                'en_cours' => $dossiers->filter(fn ($d) => in_array($statut($d), self::EN_COURS, true))->count(),
                'decisions' => $decides->count(),
                'favorables' => $favorables->count(),
                'defavorables' => $defavorables->count(),
                'taux_validation' => $tauxValidation,
                'delai_moyen_jours' => $decides->isNotEmpty() ? round($delai($decides), 1) : null,
                'respect_delai' => $decides->isNotEmpty() ? round(100 * $dansLeDelai->count() / $decides->count(), 1) : null,
                'en_retard' => $enRetard->count(),
                'citoyens' => $dossiers->pluck('citoyen_id')->unique()->count(),
                'reclamations_ouvertes' => Reclamation::whereIn('statut', ['ouverte', 'en_cours'])->count(),
            ],
            'par_statut' => collect(StatutDossier::cases())
                ->reject(fn ($s) => $s === StatutDossier::Brouillon)
                ->map(fn ($s) => [
                    'statut' => $s->value,
                    'libelle' => $s->libelle(),
                    'total' => $dossiers->filter(fn ($d) => $d->statut === $s)->count(),
                ])->values(),
            'evolution' => $this->evolution($dossiers, $du, $au),
            'par_procedure' => $dossiers->groupBy('procedure_id')->map(fn ($groupe) => [
                'procedure' => $groupe->first()->procedure?->titre,
                'categorie' => $groupe->first()->procedure?->categorie?->nom,
                'total' => $groupe->count(),
                'delai_moyen_jours' => ($v = $delai($groupe)) !== null ? round($v, 1) : null,
                'delai_indicatif' => $groupe->first()->procedure?->delai_jours,
                'favorables' => $groupe->filter(fn ($d) => in_array($statut($d), self::FAVORABLES, true))->count(),
            ])->sortByDesc('total')->values(),
            'par_service' => $dossiers->groupBy('service_id')->map(fn ($groupe) => [
                'service' => $groupe->first()->service?->nom ?? 'Non attribué',
                'total' => $groupe->count(),
                'en_cours' => $groupe->filter(fn ($d) => in_array($statut($d), self::EN_COURS, true))->count(),
                'en_retard' => $groupe->filter(fn ($d) => $d->estEnRetard())->count(),
                'delai_moyen_jours' => ($v = $delai($groupe)) !== null ? round($v, 1) : null,
            ])->sortByDesc('total')->values(),
            // Origine géographique des demandes, d'après la région déclarée par le citoyen
            'par_region' => $dossiers->groupBy(fn ($d) => $d->citoyen?->region ?? 'Non renseignée')
                ->map(fn ($groupe, $region) => ['region' => $region, 'total' => $groupe->count()])
                ->sortByDesc('total')->values(),
            'services' => Service::orderBy('nom')->get(['id', 'nom']),
        ]);
    }

    /** Dépôts et décisions par mois sur la période. */
    private function evolution($dossiers, Carbon $du, Carbon $au): array
    {
        $mois = [];
        $curseur = (clone $du)->startOfMonth();
        while ($curseur <= $au) {
            $cle = $curseur->format('Y-m');
            $mois[$cle] = [
                'mois' => $cle,
                'libelle' => ucfirst($curseur->locale('fr')->translatedFormat('M Y')),
                'deposes' => 0,
                'favorables' => 0,
                'defavorables' => 0,
            ];
            $curseur->addMonthNoOverflow();
        }

        foreach ($dossiers as $d) {
            $cle = $d->soumis_at->format('Y-m');
            if (isset($mois[$cle])) {
                $mois[$cle]['deposes']++;
            }
            if ($d->decision_at && isset($mois[$d->decision_at->format('Y-m')])) {
                $type = in_array($d->statut->value, self::DEFAVORABLES, true) ? 'defavorables' : 'favorables';
                $mois[$d->decision_at->format('Y-m')][$type]++;
            }
        }

        return array_values($mois);
    }
}
