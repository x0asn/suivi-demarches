<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcedureRequest;
use App\Http\Resources\ProcedureResource;
use App\Models\Procedure;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * RF-017 / UC-07 : l'administrateur crée, modifie, publie ou désactive une procédure.
 */
class ProcedureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'statut' => ['nullable', Rule::in(Procedure::STATUTS)],
            'categorie' => ['nullable', 'integer'],
        ]);

        $procedures = Procedure::with(['categorie', 'service'])
            ->withCount('pieces')
            ->recherche($request->q)
            ->when($request->statut, fn ($q, $s) => $q->where('statut', $s))
            ->when($request->categorie, fn ($q, $c) => $q->where('categorie_id', $c))
            ->latest('updated_at')
            ->paginate(15);

        return $this->succes(ProcedureResource::collection($procedures));
    }

    public function show(Procedure $procedure): JsonResponse
    {
        return $this->succes(new ProcedureResource($procedure->load(['categorie', 'service', 'pieces', 'etapes'])));
    }

    public function store(ProcedureRequest $request): JsonResponse
    {
        $procedure = DB::transaction(function () use ($request) {
            $procedure = new Procedure($request->safe()->except(['pieces', 'etapes']));
            $procedure->slug = $this->slugUnique($request->titre);
            $procedure->statut = 'brouillon';
            $procedure->save();
            $this->synchroniser($procedure, $request);

            return $procedure;
        });

        Journal::enregistrer('admin.procedure.creee', $procedure, ['titre' => $procedure->titre]);

        return $this->succes(
            new ProcedureResource($procedure->load(['categorie', 'service', 'pieces', 'etapes'])),
            'La procédure a été créée en brouillon.',
            201
        );
    }

    public function update(ProcedureRequest $request, Procedure $procedure): JsonResponse
    {
        DB::transaction(function () use ($request, $procedure) {
            $procedure->fill($request->safe()->except(['pieces', 'etapes']));
            if ($procedure->isDirty('titre')) {
                $procedure->slug = $this->slugUnique($procedure->titre, $procedure->id);
            }
            $procedure->save();
            $this->synchroniser($procedure, $request);
            $procedure->touch();
        });

        Journal::enregistrer('admin.procedure.modifiee', $procedure, ['titre' => $procedure->titre]);

        return $this->succes(
            new ProcedureResource($procedure->load(['categorie', 'service', 'pieces', 'etapes'])),
            'La procédure a été mise à jour.'
        );
    }

    /** Publier, repasser en brouillon ou désactiver. */
    public function changerStatut(Request $request, Procedure $procedure): JsonResponse
    {
        $request->validate(['statut' => ['required', Rule::in(Procedure::STATUTS)]]);

        if ($request->statut === 'publiee' && $procedure->pieces()->doesntExist()) {
            return $this->erreur('Ajoutez au moins une pièce justificative avant de publier cette procédure.', 422);
        }

        $ancien = $procedure->statut;
        $procedure->statut = $request->statut;
        if ($request->statut === 'publiee' && ! $procedure->publiee_at) {
            $procedure->publiee_at = now();
        }
        $procedure->save();

        Journal::enregistrer('admin.procedure.statut', $procedure, ['avant' => ['statut' => $ancien], 'apres' => ['statut' => $procedure->statut]]);

        $messages = [
            'publiee' => 'La procédure est publiée et visible par les citoyens.',
            'brouillon' => 'La procédure est repassée en brouillon.',
            'desactivee' => 'La procédure est désactivée : elle n\'est plus proposée aux citoyens.',
        ];

        return $this->succes(new ProcedureResource($procedure->load(['categorie', 'service'])), $messages[$procedure->statut]);
    }

    /** Les pièces et étapes sont remplacées dans l'ordre reçu. */
    private function synchroniser(Procedure $procedure, ProcedureRequest $request): void
    {
        if ($request->has('pieces')) {
            $procedure->pieces()->delete();
            foreach (array_values($request->input('pieces', [])) as $i => $piece) {
                $procedure->pieces()->create([
                    'libelle' => $piece['libelle'],
                    'description' => $piece['description'] ?? null,
                    'obligatoire' => $piece['obligatoire'] ?? true,
                    'ordre' => $i,
                ]);
            }
        }

        if ($request->has('etapes')) {
            $procedure->etapes()->delete();
            foreach (array_values($request->input('etapes', [])) as $i => $etape) {
                $procedure->etapes()->create([
                    'titre' => $etape['titre'],
                    'description' => $etape['description'] ?? null,
                    'ordre' => $i,
                ]);
            }
        }
    }

    private function slugUnique(string $titre, ?int $ignorer = null): string
    {
        $base = Str::slug($titre);
        $slug = $base;
        $i = 2;
        while (Procedure::where('slug', $slug)->when($ignorer, fn ($q) => $q->where('id', '!=', $ignorer))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
