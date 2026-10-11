/** Statuts des dossiers (§12) : libellés, couleurs et explications pour le citoyen. */
export const STATUTS_DOSSIER = {
  brouillon: {
    libelle: 'Brouillon',
    classe: 'bg-slate-100 text-slate-700 ring-slate-200',
    point: 'bg-slate-400',
    citoyen: 'Votre dossier n’est pas encore transmis. Complétez-le puis soumettez-le.',
  },
  soumis: {
    libelle: 'Soumis',
    classe: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    point: 'bg-indigo-500',
    citoyen: 'Votre demande a été transmise. Elle sera prise en charge par un agent.',
  },
  en_verification: {
    libelle: 'En vérification',
    classe: 'bg-amber-50 text-amber-800 ring-amber-200',
    point: 'bg-amber-500',
    citoyen: 'Un agent contrôle vos informations et vos pièces justificatives.',
  },
  correction_demandee: {
    libelle: 'Correction demandée',
    classe: 'bg-orange-50 text-orange-800 ring-orange-200',
    point: 'bg-orange-500',
    citoyen: 'Une action de votre part est nécessaire. Consultez le message de l’agent.',
  },
  en_traitement: {
    libelle: 'En traitement',
    classe: 'bg-sky-50 text-sky-800 ring-sky-200',
    point: 'bg-sky-500',
    citoyen: 'Votre dossier est complet et recevable. Il est en cours d’instruction.',
  },
  valide: {
    libelle: 'Validé',
    classe: 'bg-brand-50 text-brand-800 ring-brand-200',
    point: 'bg-brand-500',
    citoyen: 'Décision favorable. Le service finalise la délivrance.',
  },
  rejete: {
    libelle: 'Rejeté',
    classe: 'bg-red-50 text-red-700 ring-red-200',
    point: 'bg-red-500',
    citoyen: 'Votre demande n’a pas pu aboutir. Le motif est indiqué ci-dessous.',
  },
  termine: {
    libelle: 'Terminé',
    classe: 'bg-brand-800 text-white ring-brand-800',
    point: 'bg-or-300',
    citoyen: 'La démarche est achevée.',
  },
  cloture: {
    libelle: 'Clôturé',
    classe: 'bg-slate-700 text-white ring-slate-700',
    point: 'bg-slate-300',
    citoyen: 'Le dossier est clôturé.',
  },
}

export const STATUTS_DOCUMENT = {
  en_attente: { libelle: 'En attente', classe: 'bg-slate-100 text-slate-700 ring-slate-200', point: 'bg-slate-400' },
  accepte: { libelle: 'Acceptée', classe: 'bg-brand-50 text-brand-800 ring-brand-200', point: 'bg-brand-500' },
  refuse: { libelle: 'Refusée', classe: 'bg-red-50 text-red-700 ring-red-200', point: 'bg-red-500' },
  a_corriger: { libelle: 'À corriger', classe: 'bg-orange-50 text-orange-800 ring-orange-200', point: 'bg-orange-500' },
}

/** Libellés des actions de l'agent, par statut cible. */
export const ACTIONS_AGENT = {
  en_verification: { libelle: 'Prendre en charge', description: 'Le dossier passe en vérification et vous en devenez le responsable.', variante: 'primaire' },
  en_traitement: { libelle: 'Déclarer recevable', description: 'Les pièces sont conformes : le dossier entre en instruction.', variante: 'primaire' },
  correction_demandee: { libelle: 'Demander une correction', description: 'Le citoyen sera invité à compléter son dossier.', variante: 'secondaire', commentaire: true },
  valide: { libelle: 'Valider', description: 'Décision favorable : le citoyen sera informé.', variante: 'primaire' },
  rejete: { libelle: 'Rejeter', description: 'Décision défavorable : le motif sera communiqué au citoyen.', variante: 'danger-doux', commentaire: true },
  termine: { libelle: 'Marquer comme terminé', description: 'La démarche est achevée (document délivré).', variante: 'primaire' },
  cloture: { libelle: 'Clôturer', description: 'Le dossier rejeté est archivé.', variante: 'secondaire' },
}

/** Étapes de la frise d'avancement présentée au citoyen. */
export function etapesFrise(statut) {
  const rejet = ['rejete', 'cloture'].includes(statut)
  const etapes = [
    { cle: 'soumis', libelle: 'Soumis' },
    { cle: 'en_verification', libelle: 'Vérification' },
    { cle: 'en_traitement', libelle: 'Traitement' },
    { cle: rejet ? 'rejete' : 'valide', libelle: 'Décision' },
    { cle: rejet ? 'cloture' : 'termine', libelle: rejet ? 'Clôture' : 'Terminé' },
  ]
  const rang = {
    brouillon: -1,
    soumis: 0,
    en_verification: 1,
    correction_demandee: 1,
    en_traitement: 2,
    valide: 3,
    rejete: 3,
    termine: 4,
    cloture: 4,
  }[statut]

  return etapes.map((e, i) => ({
    ...e,
    etat: i < rang || (i === rang && ['termine', 'cloture'].includes(statut)) ? 'fait' : i === rang ? 'actuel' : 'avenir',
    alerte: i === rang && (statut === 'correction_demandee' || statut === 'rejete'),
  }))
}
