<?php

namespace App\Services;

use App\Models\Paiement;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Échanges avec PayDunya, prestataire qui relie l'application à Wave et à Orange Money
 * (API « Checkout Invoice » : https://developers.paydunya.com/doc/EN/http_json).
 *
 * 1. creerFacture() : PayDunya renvoie l'adresse de la page où le citoyen paie.
 * 2. consulter()    : on demande à PayDunya si la facture a bien été payée.
 * Seule la réponse de PayDunya fait foi : jamais ce que le navigateur du citoyen affirme.
 */
class PayDunya
{
    public static function configure(): bool
    {
        return filled(config('paiement.cles.master'))
            && filled(config('paiement.cles.privee'))
            && filled(config('paiement.cles.jeton'));
    }

    public static function mode(): string
    {
        return config('paiement.mode') === 'live' ? 'live' : 'test';
    }

    /**
     * Crée la facture et renvoie [jeton, adresse de paiement].
     *
     * @return array{0: string, 1: string}
     */
    public static function creerFacture(Paiement $paiement, string $description, string $retour, string $annulation, string $notification): array
    {
        $reponse = self::client()->post('create', [
            'invoice' => [
                'total_amount' => $paiement->montant,
                'description' => $description,
                // Le citoyen ne voit que l'opérateur qu'il a choisi.
                'channels' => [Paiement::OPERATEURS[$paiement->operateur]['canal']],
            ],
            'store' => ['name' => config('paiement.boutique')],
            'actions' => [
                'return_url' => $retour,
                'cancel_url' => $annulation,
                'callback_url' => $notification,
            ],
            'custom_data' => ['paiement_id' => $paiement->id, 'dossier_id' => $paiement->dossier_id],
        ]);

        $donnees = $reponse->json() ?? [];
        if (! $reponse->successful() || ($donnees['response_code'] ?? null) !== '00' || empty($donnees['token'])) {
            throw new RuntimeException('PayDunya a refusé la création du paiement : '.($donnees['response_text'] ?? $reponse->status()));
        }

        return [$donnees['token'], $donnees['response_text']];
    }

    /**
     * Paiement direct (SoftPay, mode live) : à partir du seul numéro du citoyen, PayDunya renvoie
     * le lien qui ouvre Wave ou Orange Money sur son téléphone, où il valide avec son code secret.
     * Renvoie null en mode test : PayDunya ne propose ce raccourci qu'avec un compte activé.
     *
     * @return array{url: string, application: ?string}|null
     */
    public static function payerDirect(Paiement $paiement, string $jeton, string $telephone, User $client): ?array
    {
        if (self::mode() !== 'live') {
            return null;
        }

        $champs = $paiement->operateur === 'wave'
            ? [
                'wave_senegal_fullName' => $client->nom_complet,
                'wave_senegal_email' => $client->email,
                'wave_senegal_phone' => $telephone,
                'wave_senegal_payment_token' => $jeton,
            ]
            : [
                'customer_name' => $client->nom_complet,
                'customer_email' => $client->email,
                'phone_number' => $telephone,
                'invoice_token' => $jeton,
            ];

        $reponse = self::client()->baseUrl(config('paiement.url_direct'))
            ->post(Paiement::OPERATEURS[$paiement->operateur]['direct'], $champs);
        $donnees = $reponse->json() ?? [];
        if (! $reponse->successful() || ($donnees['success'] ?? false) !== true || empty($donnees['url'])) {
            throw new RuntimeException('PayDunya a refusé le paiement direct : '.($donnees['message'] ?? $reponse->status()));
        }

        return [
            'url' => $donnees['url'],
            // Orange Money : lien qui ouvre directement l'application Max it sur le téléphone.
            'application' => $donnees['other_url']['maxit_url'] ?? $donnees['other_url']['om_url'] ?? null,
        ];
    }

    /** Numéro mobile sénégalais ramené à 9 chiffres (77 123 45 67, +221 77…, 00221 77…). */
    public static function numero(string $saisie): string
    {
        $chiffres = preg_replace('/\D/', '', $saisie);

        return preg_replace('/^(00)?221(?=\d{9}$)/', '', $chiffres);
    }

    /**
     * État d'une facture chez PayDunya.
     *
     * @return array{statut: string, recu: ?string}
     */
    public static function consulter(string $jeton): array
    {
        $donnees = self::client()->get('confirm/'.rawurlencode($jeton))->json() ?? [];

        return [
            'statut' => self::statut($donnees['status'] ?? null),
            'recu' => $donnees['receipt_url'] ?? null,
        ];
    }

    /**
     * L'avis envoyé par PayDunya à l'adresse de notification est authentique si son « hash »
     * est l'empreinte SHA-512 de la clé principale (connue seulement de PayDunya et de nous).
     */
    public static function avisAuthentique(?string $hash): bool
    {
        $master = (string) config('paiement.cles.master');

        return $master !== '' && is_string($hash) && hash_equals(hash('sha512', $master), $hash);
    }

    /** Traduit les états de PayDunya (completed, pending, cancelled, failed) dans ceux de l'application. */
    public static function statut(?string $statut): string
    {
        return match (strtolower((string) $statut)) {
            'completed' => Paiement::PAYE,
            'cancelled', 'canceled' => Paiement::ANNULE,
            'failed' => Paiement::ECHEC,
            default => Paiement::EN_ATTENTE,
        };
    }

    private static function client()
    {
        return Http::baseUrl(config('paiement.url.'.self::mode()))
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->withHeaders([
                'PAYDUNYA-MASTER-KEY' => (string) config('paiement.cles.master'),
                'PAYDUNYA-PRIVATE-KEY' => (string) config('paiement.cles.privee'),
                'PAYDUNYA-TOKEN' => (string) config('paiement.cles.jeton'),
            ]);
    }
}
