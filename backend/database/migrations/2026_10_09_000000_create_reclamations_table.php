<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module M07 — Réclamations (RF-012, UC-09).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reclamations', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->nullable()->unique();
            $table->foreignId('citoyen_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('dossier_id')->nullable()->constrained()->nullOnDelete();
            // retard | decision | piece | accueil | technique | autre
            $table->string('motif', 30);
            $table->string('sujet');
            $table->text('description');
            // ouverte | en_cours | resolue | rejetee
            $table->string('statut', 20)->default('ouverte')->index();
            $table->text('reponse')->nullable();
            $table->foreignId('traitee_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('traitee_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reclamations');
    }
};
