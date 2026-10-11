import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, jeton } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null)
  const [chargement, setChargement] = useState(() => Boolean(jeton.lire()))

  // Au démarrage : si un jeton existe, on récupère le profil.
  // Seul un refus explicite du serveur (401) ferme la session ; un incident réseau est réessayé.
  useEffect(() => {
    if (!jeton.lire()) return
    const controleur = new AbortController()

    const charger = async (tentative = 1) => {
      try {
        const r = await api('/auth/me', { signal: controleur.signal })
        setUtilisateur(r.data)
        setChargement(false)
      } catch (e) {
        if (e.name === 'AbortError') return
        if (e.status === 401 || e.status === 403) {
          jeton.effacer()
          setChargement(false)
        } else if (tentative < 4) {
          setTimeout(() => !controleur.signal.aborted && charger(tentative + 1), 400 * tentative)
        } else {
          setChargement(false)
        }
      }
    }

    charger()
    return () => controleur.abort()
  }, [])

  // Si l'API répond 401 (jeton expiré ou révoqué), on déconnecte localement.
  useEffect(() => {
    const surExpiration = () => setUtilisateur(null)
    window.addEventListener('sd:session-expiree', surExpiration)
    return () => window.removeEventListener('sd:session-expiree', surExpiration)
  }, [])

  const ouvrirSession = useCallback((reponse) => {
    jeton.ecrire(reponse.data.token)
    setUtilisateur(reponse.data.user)
    return reponse.data.user
  }, [])

  const connexion = useCallback(
    async (email, password) => ouvrirSession(await api('/auth/login', { method: 'POST', body: { email, password } })),
    [ouvrirSession],
  )

  const inscription = useCallback(
    async (champs) => ouvrirSession(await api('/auth/register', { method: 'POST', body: champs })),
    [ouvrirSession],
  )

  const deconnexion = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      /* même si le serveur ne répond pas, on ferme la session localement */
    }
    jeton.effacer()
    setUtilisateur(null)
  }, [])

  const valeur = useMemo(
    () => ({ utilisateur, setUtilisateur, chargement, connexion, inscription, deconnexion }),
    [utilisateur, chargement, connexion, inscription, deconnexion],
  )

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
