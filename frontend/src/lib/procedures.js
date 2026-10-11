/** Statuts des procédures (référentiel administrable, RF-017). */
export const STATUTS_PROCEDURE = {
  brouillon: { libelle: 'Brouillon', classe: 'bg-slate-100 text-slate-700 ring-slate-200', point: 'bg-slate-400' },
  publiee: { libelle: 'Publiée', classe: 'bg-brand-50 text-brand-800 ring-brand-200', point: 'bg-brand-500' },
  desactivee: { libelle: 'Désactivée', classe: 'bg-red-50 text-red-700 ring-red-200', point: 'bg-red-500' },
}

/** Règles de compétence des administrations (M08), dans l'ordre proposé à l'administrateur. */
export const REGLES_COMPETENCE = [
  { valeur: 'nationale', libelle: 'Toute administration habilitée', aide: 'Le citoyen peut s’adresser à la plus proche.' },
  { valeur: 'lieu_residence', libelle: 'Lieu de résidence', aide: 'Seule l’administration de la commune de résidence est compétente.' },
  { valeur: 'lieu_naissance', libelle: 'Lieu de naissance', aide: 'Seule l’administration du lieu où la naissance a été déclarée est compétente.' },
  { valeur: 'lieu_bien', libelle: 'Lieu du bien', aide: 'Seule l’administration dont dépend le terrain ou le bien est compétente.' },
]
