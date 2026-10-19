<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Paiement des frais d'une démarche (timbre, frais de dossier) par Wave ou Orange Money.
 * Le paiement passe par un prestataire agréé (PayDunya) : c'est lui qui confirme qu'il a abouti.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procedures', function (Blueprint $table) {
            // Montant en francs CFA payé au dépôt ; 0 = démarche gratuite.
            $table->unsignedInteger('frais')->default(0)->after('cout');
        });

        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dossier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('montant');
            // wave | orange_money
            $table->string('operateur', 30);
            // en_attente | paye | annule | echec
            $table->string('statut', 20)->default('en_attente')->index();
            // Jeton de la facture chez le prestataire : sert à vérifier le paiement auprès de lui.
            $table->string('reference_prestataire', 100)->nullable()->unique();
            $table->string('url_paiement', 500)->nullable();
            $table->string('url_recu', 500)->nullable();
            // test | live : un paiement de test ne vaut jamais paiement réel.
            $table->string('mode', 10);
            $table->timestamp('paye_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
        Schema::table('procedures', function (Blueprint $table) {
            $table->dropColumn('frais');
        });
    }
};
