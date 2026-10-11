<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Localisation du citoyen : région (obligatoire à l'inscription) et commune. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('region', 50)->nullable()->after('telephone')->index();
            $table->string('commune', 100)->nullable()->after('region');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['region', 'commune']);
        });
    }
};
