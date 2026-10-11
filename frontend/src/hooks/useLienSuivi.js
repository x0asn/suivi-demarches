import { useAuth } from '../context/AuthContext'

/**
 * Destination du lien « Suivre mon dossier » selon la personne connectée :
 * citoyen → ses dossiers ; autre rôle → son espace ; visiteur → connexion, puis son espace.
 */
export function useLienSuivi() {
  const { utilisateur } = useAuth()
  if (!utilisateur) return { vers: '/connexion', state: { depuis: '/espace' } }
  return { vers: utilisateur.role === 'citoyen' ? '/espace/dossiers' : '/espace', state: undefined }
}
