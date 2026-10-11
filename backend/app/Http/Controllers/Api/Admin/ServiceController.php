<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Module M10 — Référentiel des services administratifs.
 */
class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = Service::withCount(['procedures', 'agents'])->orderBy('region')->orderBy('nom')->get();

        return $this->succes(ServiceResource::collection($services)->resolve());
    }

    public function store(Request $request): JsonResponse
    {
        $service = Service::create($this->valider($request));
        Journal::enregistrer('admin.service.cree', $service, ['nom' => $service->nom]);

        return $this->succes(new ServiceResource($service), 'Le service a été créé.', 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $service->update($this->valider($request));
        Journal::enregistrer('admin.service.modifie', $service, ['nom' => $service->nom]);

        return $this->succes(new ServiceResource($service), 'Le service a été mis à jour.');
    }

    private function valider(Request $request): array
    {
        return $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(array_keys(Service::TYPES))],
            'adresse' => ['nullable', 'string', 'max:255'],
            'commune' => ['nullable', 'string', 'max:100'],
            'region' => ['nullable', 'string', 'max:100'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'horaires' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'actif' => ['boolean'],
        ]);
    }
}
