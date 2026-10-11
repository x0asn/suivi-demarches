<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\JournalAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Consultation du journal d'audit (RF-022, module M10).
 */
class JournalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'action' => ['nullable', 'string', 'max:100'],
            'user_id' => ['nullable', 'integer'],
            'resultat' => ['nullable', 'in:succes,echec'],
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date'],
        ]);

        $journal = JournalAction::with('user:id,prenom,nom,email,role')
            ->when($request->action, fn ($q, $a) => $q->where('action', 'like', "{$a}%"))
            ->when($request->user_id, fn ($q, $id) => $q->where('user_id', $id))
            ->when($request->resultat, fn ($q, $r) => $q->where('resultat', $r))
            ->when($request->du, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->au, fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest('created_at')
            ->latest('id')
            ->paginate(25);

        return $this->succes($journal);
    }
}
