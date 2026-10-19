<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paiement des frais de démarche (Wave, Orange Money)
    |--------------------------------------------------------------------------
    |
    | Les paiements passent par PayDunya, prestataire de paiement sénégalais qui
    | relie l'application à Wave et à Orange Money. Les clés se trouvent dans
    | l'espace PayDunya (rubrique « Intégrez notre API ») et se placent dans .env.
    |
    | PAYDUNYA_MODE=test : clés de test, argent fictif (développement, soutenance).
    | PAYDUNYA_MODE=live : clés réelles, vrais francs CFA (mise en service).
    | Le code est le même dans les deux cas ; seules les clés changent.
    |
    | Sans clés, le paiement est indiqué comme indisponible : l'application ne
    | fait jamais semblant d'encaisser.
    |
    */

    'mode' => env('PAYDUNYA_MODE', 'test'),

    'cles' => [
        'master' => env('PAYDUNYA_MASTER_KEY'),
        'privee' => env('PAYDUNYA_PRIVATE_KEY'),
        'jeton' => env('PAYDUNYA_TOKEN'),
    ],

    'url' => [
        'test' => 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/',
        'live' => 'https://app.paydunya.com/api/v1/checkout-invoice/',
    ],

    // Paiement direct (« SoftPay ») : le citoyen donne seulement son numéro et valide sur son
    // téléphone, sans passer par la page de PayDunya. Proposé par PayDunya en mode live uniquement.
    'url_direct' => 'https://app.paydunya.com/api/v1/softpay/',

    // Nom affiché au citoyen sur la page de paiement.
    'boutique' => env('PAYDUNYA_BOUTIQUE', 'Suivi Démarches'),

];
