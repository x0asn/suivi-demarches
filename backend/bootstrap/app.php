<?php

use App\Http\Middleware\EnsureAccountActive;
use App\Http\Middleware\EnsureRole;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
            'actif' => EnsureAccountActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Toutes les erreurs de l'API sont renvoyées au même format JSON (§16.1, §19),
        // sans jamais exposer de détail technique au citoyen.
        $json = fn (string $message, int $status, array $errors = []) => response()->json(
            array_filter(['success' => false, 'message' => $message, 'errors' => $errors ?: null], fn ($v) => $v !== null),
            $status
        );

        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        $exceptions->render(function (ValidationException $e, Request $request) use ($json) {
            if ($request->is('api/*')) {
                return $json('Certains champs sont invalides. Merci de les corriger.', 422, $e->errors());
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($json) {
            if ($request->is('api/*')) {
                return $json('Vous devez être connecté pour accéder à cette ressource.', 401);
            }
        });

        // Couvre aussi les modèles introuvables (404), les refus d'autorisation (403)
        // et la limitation de tentatives (429), que Laravel convertit en HttpException.
        $exceptions->render(function (HttpException $e, Request $request) use ($json) {
            if ($request->is('api/*')) {
                $message = match ($e->getStatusCode()) {
                    403 => 'Vous n\'avez pas les droits nécessaires pour cette action.',
                    404 => 'La ressource demandée est introuvable.',
                    429 => 'Trop de tentatives. Merci de patienter une minute avant de réessayer.',
                    default => $e->getMessage() ?: 'La requête n\'a pas pu aboutir.',
                };

                return $json($message, $e->getStatusCode());
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) use ($json) {
            if ($request->is('api/*') && ! config('app.debug')) {
                return $json('Une erreur inattendue est survenue. Réessayez dans quelques instants.', 500);
            }
        });
    })->create();
