<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;

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

    public function store(ServiceRequest $request): JsonResponse
    {
        $service = Service::create($request->validated());
        Journal::enregistrer('admin.service.cree', $service, ['nom' => $service->nom]);

        return $this->succes(new ServiceResource($service), 'Le service a été créé.', 201);
    }

    public function update(ServiceRequest $request, Service $service): JsonResponse
    {
        $service->update($request->validated());
        Journal::enregistrer('admin.service.modifie', $service, ['nom' => $service->nom]);

        return $this->succes(new ServiceResource($service), 'Le service a été mis à jour.');
    }
}
