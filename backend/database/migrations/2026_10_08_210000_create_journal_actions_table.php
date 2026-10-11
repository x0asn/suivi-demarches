<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Journal d'audit (RF-022, RG-010, RNF-003) : qui a fait quoi, sur quel objet, quand, avec quel résultat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 100)->index();
            $table->string('objet_type', 100)->nullable();
            $table->unsignedBigInteger('objet_id')->nullable();
            $table->string('resultat', 20)->default('succes');
            $table->json('details')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['objet_type', 'objet_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_actions');
    }
};
