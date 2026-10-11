<?php

use App\Models\Dossier;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Suivi d'un dossier sans compte : la référence étant prévisible (DEM-2026-00042),
 * un code de suivi aléatoire est exigé en plus pour consulter l'avancement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->string('code_suivi', 12)->nullable()->after('reference');
        });

        // Les dossiers existants reçoivent eux aussi un code.
        DB::table('dossiers')->whereNull('code_suivi')->orderBy('id')->pluck('id')
            ->each(fn ($id) => DB::table('dossiers')->where('id', $id)->update(['code_suivi' => Dossier::nouveauCodeSuivi()]));
    }

    public function down(): void
    {
        Schema::table('dossiers', function (Blueprint $table) {
            $table->dropColumn('code_suivi');
        });
    }
};
