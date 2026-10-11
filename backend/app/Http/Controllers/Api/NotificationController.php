<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

/**
 * Module M06 — Notifications de l'utilisateur connecté (RF-010).
 */
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()
            ->when($request->boolean('non_lues'), fn ($q) => $q->whereNull('read_at'))
            ->paginate(15);

        $notifications->setCollection($notifications->getCollection()->map(fn (DatabaseNotification $n) => $this->format($n)));

        return $this->succes($notifications);
    }

    /** Pour la cloche de l'en-tête : nombre de non lues et 5 dernières. */
    public function apercu(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->succes([
            'non_lues' => $user->unreadNotifications()->count(),
            'dernieres' => $user->notifications()->limit(6)->get()->map(fn ($n) => $this->format($n)),
        ]);
    }

    public function marquerLue(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->succes($this->format($notification));
    }

    public function toutesLues(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->succes(null, 'Toutes les notifications ont été marquées comme lues.');
    }

    private function format(DatabaseNotification $n): array
    {
        return [
            'id' => $n->id,
            'evenement' => $n->data['evenement'] ?? null,
            'titre' => $n->data['titre'] ?? '',
            'message' => $n->data['message'] ?? '',
            'lien' => $n->data['lien'] ?? null,
            'reference' => $n->data['reference'] ?? null,
            'statut' => $n->data['statut'] ?? null,
            'lue' => $n->read_at !== null,
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }
}
