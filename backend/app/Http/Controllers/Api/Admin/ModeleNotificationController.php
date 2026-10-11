<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ModeleNotificationRequest;
use App\Models\ModeleNotification;
use App\Services\Journal;
use Illuminate\Http\JsonResponse;

/**
 * RF-020 : l'administrateur configure le texte et l'activation des notifications.
 */
class ModeleNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->succes(ModeleNotification::orderBy('id')->get());
    }

    public function update(ModeleNotificationRequest $request, ModeleNotification $modele): JsonResponse
    {
        $modele->update($request->validated());

        Journal::enregistrer('admin.notification.modele_modifie', $modele, ['evenement' => $modele->evenement]);

        return $this->succes($modele, 'Le modèle de notification a été mis à jour.');
    }
}
