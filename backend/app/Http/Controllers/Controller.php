<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class Controller
{
    use AuthorizesRequests;

    /**
     * Format de réponse unique de l'API (cahier des charges §16.1) :
     * { success, message, data, meta? }  — meta n'apparaît que pour les listes paginées.
     */
    protected function succes(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        $corps = ['success' => true, 'message' => $message];

        $paginateur = match (true) {
            $data instanceof LengthAwarePaginator => $data,
            $data instanceof ResourceCollection && $data->resource instanceof LengthAwarePaginator => $data->resource,
            default => null,
        };

        if ($paginateur) {
            $corps['data'] = $data instanceof ResourceCollection
                ? $data->collection->map->resolve()->all()
                : $paginateur->items();
            $corps['meta'] = [
                'page' => $paginateur->currentPage(),
                'par_page' => $paginateur->perPage(),
                'total' => $paginateur->total(),
                'derniere_page' => $paginateur->lastPage(),
            ];
        } else {
            $corps['data'] = $data instanceof JsonResource ? $data->resolve() : $data;
        }

        return response()->json($corps, $status);
    }

    protected function erreur(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'errors' => $errors ?: null,
        ], fn ($v) => $v !== null), $status);
    }
}
