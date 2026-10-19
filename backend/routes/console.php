<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tâches planifiées (serveur réel : une ligne cron lance `php artisan schedule:run` chaque minute).
Schedule::command('sanctum:prune-expired --hours=24')->daily();
