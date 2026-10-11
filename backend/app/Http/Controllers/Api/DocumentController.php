<?php

namespace App\Http\Controllers\Api;

use App\Enums\StatutDocument;
use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Requests\Documents\VerifierDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\Dossier;
use App\Services\Journal;
use App\Services\Notifieur;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Module M04 — Pièces justificatives (RF-008, RF-014).
 */
class DocumentController extends Controller
{
    /** RF-008 : le fichier respecte les règles de format et de taille. */
    public function store(StoreDocumentRequest $request, Dossier $dossier): JsonResponse
    {
        $pieceId = (int) $request->piece_requise_id;

        if ($dossier->documents()->where('piece_requise_id', $pieceId)->where('statut', StatutDocument::Accepte->value)->exists()) {
            return $this->erreur('Cette pièce a déjà été acceptée par l’administration.', 422);
        }

        // Le nouveau fichier remplace les versions précédentes non acceptées de la même pièce.
        $dossier->documents()->where('piece_requise_id', $pieceId)->get()->each->delete();

        $fichier = $request->file('fichier');
        $document = new Document([
            'piece_requise_id' => $pieceId,
            'nom_original' => mb_substr($fichier->getClientOriginalName(), 0, 255),
            // Nom de fichier aléatoire et non prévisible (§15.2), hors du dossier public.
            'chemin' => $fichier->store("dossiers/{$dossier->id}", Document::DISQUE),
            'mime' => $fichier->getMimeType(),
            'taille' => $fichier->getSize(),
        ]);
        $document->statut = StatutDocument::EnAttente;
        $dossier->documents()->save($document);

        Journal::enregistrer('document.depose', $dossier, ['piece' => $document->piece?->libelle, 'fichier' => $document->nom_original]);

        return $this->succes(new DocumentResource($document), 'Pièce ajoutée à votre dossier.', 201);
    }

    public function destroy(Document $document): JsonResponse
    {
        $this->authorize('update', $document->dossier);

        if ($document->statut === StatutDocument::Accepte) {
            return $this->erreur('Une pièce acceptée ne peut plus être supprimée.', 422);
        }

        Journal::enregistrer('document.supprime', $document->dossier, ['fichier' => $document->nom_original]);
        $document->delete();

        return $this->succes(null, 'La pièce a été retirée.');
    }

    /** Téléchargement autorisé uniquement aux personnes habilitées à voir le dossier. */
    public function telecharger(Document $document): StreamedResponse
    {
        $this->authorize('view', $document->dossier);
        abort_unless(Storage::disk(Document::DISQUE)->exists($document->chemin), 404);

        return Storage::disk(Document::DISQUE)->response($document->chemin, $document->nom_original, [
            'Content-Type' => $document->mime,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** RF-014 : acceptée, refusée ou à corriger (RG-007 : motif obligatoire si non acceptée). */
    public function verifier(VerifierDocumentRequest $request, Document $document): JsonResponse
    {
        $dossier = $document->dossier;

        if (! in_array($dossier->statut, [StatutDossier::EnVerification, StatutDossier::EnTraitement], true)) {
            return $this->erreur('Prenez d’abord le dossier en charge (statut « En vérification ») pour contrôler les pièces.', 422);
        }

        $document->statut = StatutDocument::from($request->statut);
        $document->motif = $document->statut === StatutDocument::Accepte ? null : $request->motif;
        $document->verifie_par = $request->user()->id;
        $document->verifie_at = now();
        $document->save();

        Journal::enregistrer('document.verifie', $dossier, [
            'piece' => $document->piece?->libelle,
            'decision' => $document->statut->value,
        ]);

        $dossier->loadMissing('citoyen');
        Notifieur::envoyer("document.{$document->statut->value}", $dossier->citoyen, [
            'reference' => $dossier->reference,
            'piece' => $document->piece?->libelle ?? $document->nom_original,
            'commentaire' => $document->motif,
        ], "/espace/dossiers/{$dossier->id}", ['dossier_id' => $dossier->id, 'reference' => $dossier->reference]);

        return $this->succes(new DocumentResource($document->load('verificateur')), match ($document->statut) {
            StatutDocument::Accepte => 'Pièce acceptée.',
            StatutDocument::Refuse => 'Pièce refusée : le citoyen a été informé du motif.',
            default => 'Correction demandée : le citoyen a été informé.',
        });
    }
}
