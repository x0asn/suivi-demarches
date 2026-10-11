<?php

use Illuminate\Support\Facades\Route;

// Le backend ne sert que l'API (routes/api.php) : l'interface est l'application React du dossier frontend/.
Route::get('/', fn () => response()->json([
    'application' => config('app.name'),
    'api' => url('/api'),
]));
