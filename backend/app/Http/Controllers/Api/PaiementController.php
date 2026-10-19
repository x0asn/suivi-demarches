<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dossiers\DemarrerPaiementRequest;
use App\Models\Dossier;
use App\Models\Paiement;
use App\Services\Journal;
use App\Services\Notifieur;
use App\Services\PayDunya;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Paiement des frais d'une démarche par Wave ou Orange Money, via PayDunya.
 *
 * 1. Le citoyen choisit son opérateur et donne son numéro : on crée la facture chez PayDunya, puis
 *    (compte live) on demande à PayDunya d'ouvrir directement Wave ou Orange Money sur son téléphone.
 * 2. Il paie sur son téléphone, puis revient sur l'application : on demande à PayDunya si c'est payé.
 * 3. PayDunya prévient aussi lui-même le serveur (notification), une fois l'application en ligne.
 */
class PaiementController extends Controller
{
    public function demarrer(DemarrerPaiementRequest $request, Dossier $dossier): JsonResponse
    {
        $dossier->loadMissing('procedure');
        $montant = (int) $dossier->procedure->frais;

        if ($montant <= 0) {
            return $this->erreur('Cette démarche est gratuite : aucun paiement n’est nécessaire.', 422);
        }
        if ($dossier->estPaye()) {
            return $this->erreur('Les frais de ce dossier sont déjà réglés.', 422);
        }
        if (! PayDunya::configure()) {
            return $this->erreur('Le paiement en ligne n’est pas encore activé sur cette plateforme. Réglez les frais au guichet de la mairie.', 503);
        }

        $paiement = new Paiement(['montant' => $montant, 'operateur' => $request->operateur]);
        $paiement->dossier_id = $dossier->id;
        $paiement->user_id = $request->user()->id;
        $paiement->statut = Paiement::EN_ATTENTE;
        $paiement->mode = PayDunya::mode();
        $paiement->save();

        $retour = config('app.frontend_url')."/espace/dossiers/{$dossier->id}?paiement={$paiement->id}";
        try {
            [$jeton, $url] = PayDunya::creerFacture(
                $paiement,
                "{$dossier->procedure->titre} — dossier {$dossier->reference}",
                $retour,
                $retour.'&annule=1',
                url('/api/paiements/notification'),
            );
        } catch (Throwable $e) {
            $paiement->statut = Paiement::ECHEC;
            $paiement->save();
            Log::warning('Paiement : création refusée par PayDunya.', ['paiement' => $paiement->id, 'erreur' => $e->getMessage()]);

            return $this->erreur('Le service de paiement ne répond pas pour le moment. Réessayez dans quelques minutes.', 502);
        }

        // Paiement direct : le citoyen n'a que son numéro à donner. En cas de refus, la page de PayDunya prend le relais.
        $direct = null;
        try {
            $direct = PayDunya::payerDirect($paiement, $jeton, $request->telephone, $request->user());
        } catch (Throwable $e) {
            Log::warning('Paiement : paiement direct refusé, passage par la page PayDunya.', ['paiement' => $paiement->id, 'erreur' => $e->getMessage()]);
        }

        $paiement->reference_prestataire = $jeton;
        $paiement->url_paiement = $direct['url'] ?? $url;
        $paiement->save();

        Journal::enregistrer('paiement.demarre', $dossier, ['montant' => $montant, 'operateur' => $paiement->operateur, 'mode' => $paiement->mode, 'direct' => $direct !== null]);

        return $this->succes([
            'paiement' => $paiement->versTableau(),
            'url_paiement' => $paiement->url_paiement,
            'url_application' => $direct['application'] ?? null,
            'direct' => $direct !== null,
        ], 'Redirection vers le paiement…', 201);
    }

    /** Au retour du citoyen : on demande à PayDunya où en est le paiement. */
    public function verifier(Request $request, Paiement $paiement): JsonResponse
    {
        $this->authorize('view', $paiement->dossier);

        if ($paiement->statut === Paiement::EN_ATTENTE && $paiement->reference_prestataire && PayDunya::configure()) {
            try {
                $etat = PayDunya::consulter($paiement->reference_prestataire);
                self::actualiser($paiement, $etat['statut'], $etat['recu']);
            } catch (Throwable $e) {
                Log::warning('Paiement : vérification impossible auprès de PayDunya.', ['paiement' => $paiement->id, 'erreur' => $e->getMessage()]);
            }
        }

        return $this->succes($paiement->fresh()->versTableau(), Paiement::LIBELLES[$paiement->fresh()->statut]);
    }

    /**
     * Avis envoyé par PayDunya après un paiement. Il n'est cru qu'après deux contrôles :
     * sa signature, puis une nouvelle demande à PayDunya sur l'état réel de la facture.
     */
    public function notification(Request $request): JsonResponse
    {
        $donnees = $request->input('data', []);
        if (! is_array($donnees) || ! PayDunya::avisAuthentique($donnees['hash'] ?? null)) {
            Log::warning('Paiement : avis de PayDunya rejeté (signature invalide).');

            return response()->json(['success' => false], 403);
        }

        $paiement = Paiement::where('reference_prestataire', $donnees['invoice']['token'] ?? '')->first();
        if ($paiement && $paiement->statut === Paiement::EN_ATTENTE) {
            $etat = PayDunya::consulter($paiement->reference_prestataire);
            self::actualiser($paiement, $etat['statut'], $etat['recu']);
        }

        return response()->json(['success' => true]);
    }

    /** Enregistre le nouvel état ; un paiement confirmé est journalisé et le citoyen est prévenu. */
    public static function actualiser(Paiement $paiement, string $statut, ?string $recu = null): void
    {
        if ($statut === $paiement->statut || $paiement->statut === Paiement::PAYE) {
            return;
        }

        $paiement->statut = $statut;
        if ($statut === Paiement::PAYE) {
            $paiement->paye_at = now();
            $paiement->url_recu = $recu;
        }
        $paiement->save();

        $dossier = $paiement->dossier()->with(['procedure', 'citoyen'])->first();
        Journal::enregistrer("paiement.{$statut}", $dossier, [
            'montant' => $paiement->montant,
            'operateur' => $paiement->operateur,
            'mode' => $paiement->mode,
        ], $statut === Paiement::PAYE ? 'succes' : 'echec', $paiement->user);

        if ($statut === Paiement::PAYE) {
            Notifieur::envoyer('paiement.paye', $dossier->citoyen, [
                'reference' => $dossier->reference,
                'procedure' => $dossier->procedure->titre,
                'montant' => number_format($paiement->montant, 0, ',', ' '),
                'operateur' => Paiement::OPERATEURS[$paiement->operateur]['libelle'] ?? $paiement->operateur,
            ], "/espace/dossiers/{$dossier->id}", ['dossier_id' => $dossier->id, 'reference' => $dossier->reference]);
        }
    }
}
