<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Module M08 : compétence des administrations.
 * Une démarche peut être traitée par plusieurs administrations (procedure_service),
 * et une règle indique laquelle est compétente pour un citoyen donné.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procedures', function (Blueprint $table) {
            // nationale | lieu_residence | lieu_naissance | lieu_bien (App\Enums\RegleCompetence)
            $table->string('regle_competence', 30)->default('nationale')->after('service_id');
        });

        Schema::create('procedure_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procedure_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->unique(['procedure_id', 'service_id']);
        });

        // Le service déjà rattaché à chaque procédure devient sa première administration habilitée.
        $liens = DB::table('procedures')->whereNotNull('service_id')->get(['id', 'service_id'])
            ->map(fn ($p) => ['procedure_id' => $p->id, 'service_id' => $p->service_id])
            ->all();
        if ($liens) {
            DB::table('procedure_service')->insert($liens);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('procedure_service');
        Schema::table('procedures', function (Blueprint $table) {
            $table->dropColumn('regle_competence');
        });
    }
};
