<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module M02 (procédures) et M08 (services) : référentiels administratifs.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Points administratifs : mairies, tribunaux, directions ministérielles…
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type', 50)->index(); // mairie, tribunal, ministere, prefecture, police, agence
            $table->string('adresse')->nullable();
            $table->string('commune', 100)->nullable();
            $table->string('region', 100)->nullable()->index();
            $table->string('telephone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('horaires')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('slug', 120)->unique();
            $table->string('description')->nullable();
            $table->string('icone', 50)->default('folder');
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('procedures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categorie_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('titre');
            $table->string('slug')->unique();
            $table->string('resume', 500);
            $table->text('description')->nullable();
            $table->text('conditions')->nullable();
            $table->string('public_concerne')->nullable();
            $table->unsignedSmallInteger('delai_jours')->nullable();
            $table->string('cout', 100)->nullable();
            // brouillon | publiee | desactivee (RF-017)
            $table->string('statut', 20)->default('brouillon')->index();
            $table->timestamp('publiee_at')->nullable();
            $table->timestamps();
        });

        Schema::create('pieces_requises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procedure_id')->constrained()->cascadeOnDelete();
            $table->string('libelle');
            $table->string('description')->nullable();
            $table->boolean('obligatoire')->default(true);
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('etapes_procedure', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procedure_id')->constrained()->cascadeOnDelete();
            $table->string('titre');
            $table->string('description')->nullable();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });

        // RG-006 : le périmètre d'un agent est le service auquel il est rattaché.
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->after('role')->constrained('services')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('service_id');
        });
        Schema::dropIfExists('etapes_procedure');
        Schema::dropIfExists('pieces_requises');
        Schema::dropIfExists('procedures');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('services');
    }
};
