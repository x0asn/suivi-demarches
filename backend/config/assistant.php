<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Assistant IA (aide aux citoyens)
    |--------------------------------------------------------------------------
    |
    | L'assistant répond aux questions des citoyens à partir du catalogue des
    | procédures. Sans clé d'API, il bascule sur des réponses guidées sans IA
    | (App\Services\AssistantSecours) : la plateforme reste utilisable hors ligne.
    |
    | La clé se crée sur https://console.anthropic.com et se place dans le fichier
    | .env (ANTHROPIC_API_KEY). Elle ne doit jamais être versionnée.
    |
    */

    'cle' => env('ANTHROPIC_API_KEY'),

    'modele' => env('ASSISTANT_MODELE', 'claude-opus-5-5'),

    // Niveau de réflexion : « low » donne les réponses les plus rapides, suffisant pour de l'orientation.
    'effort' => env('ASSISTANT_EFFORT', 'low'),

    // Plafond de longueur d'une réponse (réflexion comprise).
    'max_tokens' => (int) env('ASSISTANT_MAX_TOKENS', 8000),

    // Nombre de messages de la discussion renvoyés à l'IA à chaque question.
    'historique_max' => 20,

];
