<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($proxys = config('app.trusted_proxies')) {
            TrustProxies::at($proxys === '*' ? '*' : array_map('trim', explode(',', $proxys)));
        }

        // Site en ligne en HTTPS : toutes les adresses générées (notification de paiement, liens) le sont aussi.
        if ($this->app->isProduction() && str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        // Le lien de réinitialisation pointe vers l'application React, pas vers Laravel.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.frontend_url').'/reinitialiser-mot-de-passe?token='.$token.'&email='.urlencode($user->email);
        });
    }
}
