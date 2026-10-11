<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modules M03 (dossiers), M04 (documents), M05 (traitement) et M06 (modèles de notification).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dossiers', function (Blueprint $table) {
            $table->id();
            // RG-002 : référence unique, ex. DEM-2026-00042
            $table->string('reference', 30)->nullable()->unique();
            // RG-003 : un dossier est associé à une seule procédure
            $table->foreignId('procedure_id')->constrained()->restrictOnDelete();
            $table->foreignId('citoyen_id')->constrained('users')->cascadeOnDelete();
            // RG-006 : périmètre de traitement (copié de la procédure à la création)
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('statut', 30)->default('brouillon')->index();
            $table->text('motif')->nullable();
            $table->text('precisions')->nullable();
            $table->text('motif_decision')->nullable();
            $table->timestamp('soumis_at')->nullable()->index();
            $table->timestamp('decision_at')->nullable();
            $table->timestamp('cloture_at')->nullable();
            $table->timestamps();
        });

        // RG-005 : historique des changements de statut
        Schema::create('historique_statuts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dossier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ancien_statut', 30)->nullable();
            $table->string('nouveau_statut', 30);
            $table->text('commentaire')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // M04 : pièces justificatives
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dossier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('piece_requise_id')->nullable()->constrained('pieces_requises')->nullOnDelete();
            $table->string('nom_original');
            $table->string('chemin');
            $table->string('mime', 100);
            $table->unsignedInteger('taille');
            // en_attente | accepte | refuse | a_corriger (RF-014)
            $table->string('statut', 20)->default('en_attente');
            $table->text('motif')->nullable();
            $table->foreignId('verifie_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verifie_at')->nullable();
            $table->timestamps();
        });

        // RF-016 : observations et échanges liés au dossier
        Schema::create('observations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dossier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('contenu');
            // Note interne : visible uniquement par l'administration
            $table->boolean('interne')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });

        // RF-020 : modèles de notification configurables par l'administrateur
        Schema::create('modeles_notification', function (Blueprint $table) {
            $table->id();
            $table->string('evenement', 60)->unique();
            $table->string('libelle');
            $table->string('titre');
            $table->text('message');
            $table->boolean('actif')->default(true);
            $table->boolean('email')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modeles_notification');
        Schema::dropIfExists('observations');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('historique_statuts');
        Schema::dropIfExists('dossiers');
    }
};
