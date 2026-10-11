<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
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
        // Le lien de réinitialisation pointe vers l'application React, pas vers Laravel.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.frontend_url').'/reinitialiser-mot-de-passe?token='.$token.'&email='.urlencode($user->email);
        });
    }
}
