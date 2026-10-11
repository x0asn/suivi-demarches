<?php

namespace Tests\Unit;

use App\Enums\StatutDossier;
use PHPUnit\Framework\TestCase;

/**
 * Règles du cycle de vie d'un dossier (cahier des charges §12), vérifiées sans base de données.
 */
class StatutDossierTest extends TestCase
{
    public function test_rf015_le_parcours_nominal_est_autorise(): void
    {
        $this->assertTrue(StatutDossier::Brouillon->peutAller(StatutDossier::Soumis, 'citoyen'));
        $this->assertTrue(StatutDossier::Soumis->peutAller(StatutDossier::EnVerification, 'agent'));
        $this->assertTrue(StatutDossier::EnVerification->peutAller(StatutDossier::EnTraitement, 'agent'));
        $this->assertTrue(StatutDossier::EnTraitement->peutAller(StatutDossier::Valide, 'agent'));
        $this->assertTrue(StatutDossier::Valide->peutAller(StatutDossier::PretARetirer, 'agent'));
        $this->assertTrue(StatutDossier::PretARetirer->peutAller(StatutDossier::Termine, 'agent'));
    }

    public function test_valider_une_demande_ne_suffit_pas_a_la_terminer(): void
    {
        // Le document doit d'abord être préparé (prêt à retirer), puis remis.
        $this->assertFalse(StatutDossier::Valide->peutAller(StatutDossier::Termine, 'agent'));
        $this->assertSame([StatutDossier::PretARetirer->value => 'agent'], StatutDossier::Valide->transitions());
        $this->assertFalse(StatutDossier::EnTraitement->peutAller(StatutDossier::PretARetirer, 'agent'));
    }

    public function test_rf015_une_etape_ne_peut_pas_etre_sautee(): void
    {
        $this->assertFalse(StatutDossier::Brouillon->peutAller(StatutDossier::Valide, 'agent'));
        $this->assertFalse(StatutDossier::Soumis->peutAller(StatutDossier::Termine, 'agent'));
        $this->assertFalse(StatutDossier::EnVerification->peutAller(StatutDossier::Valide, 'agent'));
    }

    public function test_rf015_chaque_transition_est_reservee_a_son_acteur(): void
    {
        $this->assertFalse(StatutDossier::Brouillon->peutAller(StatutDossier::Soumis, 'agent'));
        $this->assertFalse(StatutDossier::Soumis->peutAller(StatutDossier::EnVerification, 'citoyen'));
        $this->assertFalse(StatutDossier::EnTraitement->peutAller(StatutDossier::Valide, 'citoyen'));
    }

    public function test_la_correction_demandee_revient_au_citoyen_puis_a_l_administration(): void
    {
        $this->assertTrue(StatutDossier::EnVerification->peutAller(StatutDossier::CorrectionDemandee, 'agent'));
        $this->assertTrue(StatutDossier::CorrectionDemandee->peutAller(StatutDossier::Soumis, 'citoyen'));
        $this->assertTrue(StatutDossier::CorrectionDemandee->modifiableParCitoyen());
        $this->assertFalse(StatutDossier::Soumis->modifiableParCitoyen());
    }

    public function test_un_dossier_rejete_ne_peut_qu_etre_cloture(): void
    {
        $this->assertSame([StatutDossier::Cloture->value => 'agent'], StatutDossier::Rejete->transitions());
    }

    public function test_les_statuts_finaux_n_ont_plus_de_transition(): void
    {
        foreach ([StatutDossier::Termine, StatutDossier::Cloture] as $statut) {
            $this->assertTrue($statut->estFinal());
            $this->assertSame([], $statut->transitions());
        }
    }

    public function test_rg007_rejet_et_correction_exigent_un_commentaire(): void
    {
        $this->assertTrue(StatutDossier::Rejete->exigeCommentaire());
        $this->assertTrue(StatutDossier::CorrectionDemandee->exigeCommentaire());
        $this->assertFalse(StatutDossier::Valide->exigeCommentaire());
    }

    public function test_toute_transition_mene_a_un_statut_existant(): void
    {
        foreach (StatutDossier::cases() as $statut) {
            foreach (array_keys($statut->transitions()) as $cible) {
                $this->assertContains($cible, StatutDossier::valeurs());
            }
        }
    }
}
