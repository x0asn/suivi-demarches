<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategorieResource;
use App\Http\Resources\ProcedureResource;
use App\Models\Categorie;
use App\Models\Procedure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Module M02 — Catalogue public des procédures (RF-004, RF-005).
 * Seules les procédures publiées sont visibles.
 */
class ProcedureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'categorie' => ['nullable', 'string', 'max:120'],
            'service' => ['nullable', 'integer'],
            'par_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'tri' => ['nullable', 'in:titre,populaires'],
        ]);

        $procedures = Procedure::publiees()
            ->with(['categorie', 'service'])
            ->withCount('pieces')
            ->recherche($request->q)
            ->when($request->categorie, fn ($q, $slug) => $q->whereHas('categorie', fn ($c) => $c->where('slug', $slug)))
            ->when($request->service, fn ($q, $id) => $q->where('service_id', $id))
            // « Les plus demandées » : classement réel selon le nombre de dossiers déposés (hors brouillons).
            ->when($request->tri === 'populaires', fn ($q) => $q
                ->withCount(['dossiers' => fn ($d) => $d->whereNotNull('soumis_at')])
                ->orderByDesc('dossiers_count'))
            ->orderBy('titre')
            ->paginate($request->integer('par_page', 12));

        return $this->succes(ProcedureResource::collection($procedures));
    }

    public function show(string $slug): JsonResponse
    {
        $procedure = Procedure::publiees()
            ->with(['categorie', 'service', 'pieces', 'etapes'])
            ->where('slug', $slug)
            ->firstOrFail();

        return $this->succes(new ProcedureResource($procedure));
    }

    public function categories(): JsonResponse
    {
        $categories = Categorie::withCount(['procedures' => fn ($q) => $q->publiees()])
            ->orderBy('ordre')
            ->get();

        return $this->succes(CategorieResource::collection($categories)->resolve());
    }
}
