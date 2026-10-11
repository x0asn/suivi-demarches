<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModeleNotification;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RF-020 : l'administrateur configure le texte et l'activation des notifications.
 */
class ModeleNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->succes(ModeleNotification::orderBy('id')->get());
    }

    public function update(Request $request, ModeleNotification $modele): JsonResponse
    {
        $modele->update($request->validate([
            'titre' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
            'actif' => ['required', 'boolean'],
            'email' => ['required', 'boolean'],
        ]));

        Journal::enregistrer('admin.notification.modele_modifie', $modele, ['evenement' => $modele->evenement]);

        return $this->succes($modele, 'Le modèle de notification a été mis à jour.');
    }
}
