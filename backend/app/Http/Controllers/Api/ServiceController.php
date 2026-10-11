<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Module M08 — Recherche de services (RF-021) : par nom, commune, région ou type.
 */
class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(array_keys(Service::TYPES))],
            'region' => ['nullable', 'string', 'max:100'],
        ]);

        $services = Service::where('actif', true)
            ->withCount(['procedures' => fn ($q) => $q->publiees()])
            ->when($request->q, fn ($q, $t) => $q->where(fn ($q) => $q
                ->where('nom', 'like', "%{$t}%")
                ->orWhere('commune', 'like', "%{$t}%")
                ->orWhere('adresse', 'like', "%{$t}%")))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->region, fn ($q, $r) => $q->where('region', $r))
            ->orderBy('region')
            ->orderBy('nom')
            ->get();

        return $this->succes([
            'services' => ServiceResource::collection($services)->resolve(),
            'regions' => Service::where('actif', true)->whereNotNull('region')->distinct()->orderBy('region')->pluck('region'),
            'types' => Service::TYPES,
        ]);
    }

    public function show(Service $service): JsonResponse
    {
        abort_unless($service->actif, 404);
        $service->load(['procedures' => fn ($q) => $q->publiees()->with('categorie')->orderBy('titre')]);

        return $this->succes(new ServiceResource($service));
    }
}
