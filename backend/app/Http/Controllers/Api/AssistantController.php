<?php

namespace App\Http\Controllers\Api;

use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\RateLimitException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Assistant\QuestionRequest;
use App\Services\Assistant;
use App\Services\AssistantSecours;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

/**
 * Assistant de la plateforme : la réponse est envoyée au fil de l'eau (text/event-stream),
 * pour que le citoyen la voie s'écrire dès les premiers mots.
 *
 * Événements envoyés : { type: 'texte', texte } · { type: 'fin', mode: 'ia' | 'secours' } · { type: 'erreur', message }
 */
class AssistantController extends Controller
{
    public function repondre(QuestionRequest $request): StreamedResponse
    {
        $messages = $request->discussion();
        // La route est publique : la personne n'est connue que si elle a envoyé son jeton.
        $user = auth('sanctum')->user();

        return response()->stream(function () use ($messages, $user) {
            $mode = 'ia';
            $ecrit = false;
            $echec = false;

            try {
                if (Assistant::disponible()) {
                    foreach (Assistant::repondre($messages, $user) as $morceau) {
                        $this->envoyer(['type' => 'texte', 'texte' => $morceau]);
                        $ecrit = true;
                    }
                }
            } catch (AuthenticationException $e) {
                $echec = true;
                Log::error('Assistant : clé d’API refusée. Vérifiez ANTHROPIC_API_KEY dans le fichier .env.');
            } catch (RateLimitException $e) {
                $echec = true;
                Log::warning('Assistant : limite de requêtes atteinte chez le fournisseur.');
            } catch (APIStatusException $e) {
                $echec = true;
                Log::error("Assistant : erreur de l’API ({$e->type?->value}).", ['message' => $e->getMessage()]);
            } catch (Throwable $e) {
                // Pas d'internet, délai dépassé… : l'assistant reste utilisable en mode guidé.
                $echec = true;
                Log::warning('Assistant : IA injoignable.', ['message' => $e->getMessage()]);
            }

            if (! $ecrit) {
                // IA non configurée, injoignable ou sans réponse : réponse guidée à partir du catalogue.
                $mode = 'secours';
                $question = end($messages)['content'];
                $this->envoyer(['type' => 'texte', 'texte' => AssistantSecours::repondre($question, $user, array_slice($messages, 0, -1))]);
            }

            if ($ecrit && $echec) {
                $this->envoyer(['type' => 'texte', 'texte' => "\n\nLa réponse a été interrompue. Reposez votre question dans un instant."]);
            }

            $this->envoyer(['type' => 'fin', 'mode' => $mode]);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /** Envoie un événement au navigateur sans attendre la fin de la réponse. */
    private function envoyer(array $evenement): void
    {
        echo 'data: '.json_encode($evenement, JSON_UNESCAPED_UNICODE)."\n\n";
        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }
}
