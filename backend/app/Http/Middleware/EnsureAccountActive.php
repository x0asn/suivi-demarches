<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RG-009 : un compte désactivé perd immédiatement l'accès,
 * même s'il possède encore un jeton valide.
 */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->actif) {
            $user->currentAccessToken()?->delete();

            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé. Contactez l\'administration.',
            ], 403);
        }

        return $next($request);
    }
}
