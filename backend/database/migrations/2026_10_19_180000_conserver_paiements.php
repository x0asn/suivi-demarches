<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un paiement est une trace comptable : il ne disparaît jamais avec son dossier.
 * La base refuse désormais la suppression d'un dossier qui a des paiements.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropForeign(['dossier_id']);
            $table->foreign('dossier_id')->references('id')->on('dossiers')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropForeign(['dossier_id']);
            $table->foreign('dossier_id')->references('id')->on('dossiers')->cascadeOnDelete();
        });
    }
};
