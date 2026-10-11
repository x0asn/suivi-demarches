import { useAuth } from '../context/AuthContext'

/**
 * Destination du lien « Suivre mon dossier » selon la personne connectée :
 * citoyen → ses dossiers ; autre rôle → son espace ; visiteur → suivi sans compte (référence + code).
 */
export function useLienSuivi() {
  const { utilisateur } = useAuth()
  if (!utilisateur) return { vers: '/suivi', state: undefined }
  return { vers: utilisateur.role === 'citoyen' ? '/espace/dossiers' : '/espace', state: undefined }
}
