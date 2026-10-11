<?php

use App\Http\Controllers\Api\AccuseController;
use App\Http\Controllers\Api\Admin\JournalController;
use App\Http\Controllers\Api\Admin\ModeleNotificationController;
use App\Http\Controllers\Api\Admin\ProcedureController as AdminProcedureController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DossierController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ObservationController;
use App\Http\Controllers\Api\ProcedureController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReclamationController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\StatistiqueController;
use App\Http\Controllers\Api\SuiviController;
use App\Http\Controllers\Api\TraitementController;
use App\Support\Regions;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API — Suivi Démarches
|--------------------------------------------------------------------------
| Toutes les routes sont préfixées par /api.
*/

// ---- M01 Authentification : routes publiques (limitées contre la force brute) ----
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// ---- M02 Catalogue et M08 Services : consultation publique ----
Route::get('procedures', [ProcedureController::class, 'index']);
Route::get('procedures/{slug}', [ProcedureController::class, 'show']);
Route::get('categories', [ProcedureController::class, 'categories']);
Route::get('regions', fn () => response()->json(['success' => true, 'message' => 'OK', 'data' => Regions::LISTE]));
Route::get('services', [ServiceController::class, 'index']);
Route::get('services/{service}', [ServiceController::class, 'show']);

// ---- Suivi d'un dossier sans compte : référence + code de suivi (limité contre les essais répétés) ----
Route::get('suivi', [SuiviController::class, 'show'])->middleware('throttle:12,1');

// ---- Assistant IA : ouvert à tous, limité pour maîtriser le coût ----
Route::post('assistant', [AssistantController::class, 'repondre'])->middleware('throttle:20,1');

// ---- Routes authentifiées ----
Route::middleware(['auth:sanctum', 'actif'])->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::patch('profile', [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'updatePassword']);

    // ---- M03 Dossiers (les droits fins sont vérifiés par DossierPolicy) ----
    Route::get('dossiers/resume', [DossierController::class, 'resume']);
    Route::apiResource('dossiers', DossierController::class);
    Route::get('dossiers/{dossier}/accuse', [AccuseController::class, 'telecharger']);
    Route::post('dossiers/{dossier}/soumettre', [DossierController::class, 'soumettre']);
    Route::patch('dossiers/{dossier}/status', [DossierController::class, 'changerStatut']);
    Route::post('dossiers/{dossier}/observations', [ObservationController::class, 'store']);

    // ---- M04 Documents ----
    Route::post('dossiers/{dossier}/documents', [DocumentController::class, 'store'])->middleware('throttle:30,1');
    Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('documents/{document}/fichier', [DocumentController::class, 'telecharger']);
    Route::patch('documents/{document}/verification', [DocumentController::class, 'verifier']);

    // ---- M05 Traitement (agents ; lecture pour admin et responsable) ----
    Route::prefix('traitement')->middleware('role:agent,admin,responsable')->group(function () {
        Route::get('dossiers', [TraitementController::class, 'index']);
        Route::get('resume', [TraitementController::class, 'resume']);
    });

    // ---- M07 Réclamations ----
    Route::get('reclamations/options', [ReclamationController::class, 'options']);
    Route::apiResource('reclamations', ReclamationController::class)->except('destroy');

    // ---- M09 Statistiques ----
    Route::get('statistics', [StatistiqueController::class, 'index'])->middleware('role:admin,responsable');

    // ---- M06 Notifications ----
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/apercu', [NotificationController::class, 'apercu']);
    Route::patch('notifications/tout-lire', [NotificationController::class, 'toutesLues']);
    Route::patch('notifications/{id}/lire', [NotificationController::class, 'marquerLue']);

    // ---- M10 Administration ----
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class)->except('destroy');
        Route::get('journal', [JournalController::class, 'index']);

        Route::apiResource('procedures', AdminProcedureController::class)->except('destroy');
        Route::patch('procedures/{procedure}/statut', [AdminProcedureController::class, 'changerStatut']);
        Route::apiResource('services', AdminServiceController::class)->only(['index', 'store', 'update']);
        Route::get('modeles-notification', [ModeleNotificationController::class, 'index']);
        Route::put('modeles-notification/{modele}', [ModeleNotificationController::class, 'update']);
    });
});
