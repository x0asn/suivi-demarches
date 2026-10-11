import { Baby, Briefcase, Building2, Folder, GraduationCap, IdCard, Landmark, Scale, Shield, Store } from 'lucide-react'

/** Icônes des catégories (le nom est stocké en base). */
export const ICONES_CATEGORIES = {
  baby: Baby,
  scale: Scale,
  'id-card': IdCard,
  building: Building2,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  folder: Folder,
}

export const iconeCategorie = (nom) => ICONES_CATEGORIES[nom] ?? Folder

/** Icônes des types de services. */
export const ICONES_SERVICES = {
  mairie: Landmark,
  tribunal: Scale,
  ministere: Building2,
  prefecture: Landmark,
  police: Shield,
  agence: Store,
}

export const iconeService = (type) => ICONES_SERVICES[type] ?? Building2

export function libelleDelai(jours) {
  if (jours === null || jours === undefined) return 'Variable'
  if (jours === 0) return 'Immédiat'
  if (jours === 1) return '1 jour'
  if (jours < 7) return `${jours} jours`
  if (jours % 7 === 0 && jours <= 28) return `${jours / 7} semaine${jours > 7 ? 's' : ''}`
  if (jours >= 30 && jours % 30 === 0) return `${jours / 30} mois`
  return `${jours} jours`
}
