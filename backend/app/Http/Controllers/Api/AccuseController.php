<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dossier;
use App\Services\Journal;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\Output\QRGdImagePNG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accusé de réception d'une demande (RF-007) : document PDF remis au citoyen après la
 * soumission. Son QR code ouvre le suivi du dossier sans connexion.
 */
class AccuseController extends Controller
{
    public function telecharger(Dossier $dossier): Response|JsonResponse
    {
        $this->authorize('view', $dossier);

        if (! $dossier->soumis_at) {
            return $this->erreur('L’accusé de réception est disponible une fois la demande soumise.', 422);
        }

        $dossier->load(['procedure', 'service', 'citoyen', 'documents.piece']);

        $pdf = Pdf::loadView('pdf.accuse', [
            'dossier' => $dossier,
            'lienSuivi' => $dossier->lienSuivi(),
            'qrCode' => $this->qrCode($dossier->lienSuivi()),
        ])->setPaper('a4');

        Journal::enregistrer('dossier.accuse_telecharge', $dossier, ['reference' => $dossier->reference]);

        return $pdf->download("accuse-reception-{$dossier->reference}.pdf");
    }

    /** Image PNG du QR code, intégrée au PDF (aucun service externe n'est appelé). */
    private function qrCode(string $contenu): string
    {
        return (new QRCode(new QROptions([
            'outputInterface' => QRGdImagePNG::class,
            'scale' => 6,
            'quietzoneSize' => 2,
            'outputBase64' => true,
        ])))->render($contenu);
    }
}
