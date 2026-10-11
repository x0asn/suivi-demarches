export const ROLES = {
  citoyen: { libelle: 'Citoyen', couleur: 'bg-brand-50 text-brand-800 ring-brand-200' },
  agent: { libelle: 'Agent', couleur: 'bg-sky-50 text-sky-800 ring-sky-200' },
  admin: { libelle: 'Administrateur', couleur: 'bg-or-50 text-or-700 ring-or-200' },
  responsable: { libelle: 'Responsable', couleur: 'bg-violet-50 text-violet-800 ring-violet-200' },
}

export const LISTE_ROLES = Object.entries(ROLES).map(([valeur, r]) => ({ valeur, ...r }))
