<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Procedure;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Module M08 — Administrations à proximité (RF-021).
 *
 * Recherche par nom, commune, région ou type, et surtout par démarche : seules les
 * administrations habilitées à traiter la démarche choisie sont alors renvoyées, avec la
 * règle qui désigne celle qui est compétente. La position GPS du citoyen n'est jamais
 * envoyée au serveur : les distances sont calculées dans son navigateur.
 */
class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(array_keys(Service::TYPES))],
            'region' => ['nullable', 'string', 'max:100'],
            'demarche' => ['nullable', 'string', 'max:255'],
        ]);

        $demarche = $request->demarche
            ? Procedure::publiees()->where('slug', $request->demarche)->first()
            : null;

        $services = Service::where('actif', true)
            ->with(['procedures' => fn ($q) => $q->publiees()->orderBy('titre')])
            ->withCount(['procedures' => fn ($q) => $q->publiees()])
            ->when($demarche, fn ($q) => $q->whereHas('procedures', fn ($p) => $p->whereKey($demarche->id)))
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
            // Démarches proposées dans le sélecteur « Quelle démarche voulez-vous faire ? ».
            'demarches' => Procedure::publiees()->has('services')->orderBy('titre')->get(['titre', 'slug']),
            'competence' => $demarche ? [
                'demarche' => ['titre' => $demarche->titre, 'slug' => $demarche->slug],
                ...$demarche->regle_competence->versTableau(),
            ] : null,
        ]);
    }

    public function show(Service $service): JsonResponse
    {
        abort_unless($service->actif, 404);
        $service->load(['procedures' => fn ($q) => $q->publiees()->orderBy('titre')]);

        return $this->succes(new ServiceResource($service));
    }
}
