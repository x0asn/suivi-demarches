import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

/**
 * Charge une liste paginée de l'API avec filtres.
 * Les changements de filtres sont temporisés pour ne pas surcharger le serveur pendant la frappe.
 */
export function useListe(chemin, filtresInitiaux = {}) {
  const [filtres, setFiltres] = useState({ page: 1, ...filtresInitiaux })
  const [donnees, setDonnees] = useState([])
  const [meta, setMeta] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [version, setVersion] = useState(0)
  const premier = useRef(true)

  useEffect(() => {
    const controleur = new AbortController()
    const delai = premier.current ? 0 : 250
    premier.current = false
    const minuteur = setTimeout(() => {
      api(chemin, { params: filtres, signal: controleur.signal })
        .then((r) => {
          setDonnees(r.data)
          setMeta(r.meta ?? null)
          setErreur(null)
        })
        .catch((e) => e.name !== 'AbortError' && setErreur(e))
        .finally(() => !controleur.signal.aborted && setChargement(false))
    }, delai)
    return () => {
      clearTimeout(minuteur)
      controleur.abort()
    }
  }, [chemin, filtres, version])

  const filtrer = useCallback((changements) => {
    setChargement(true)
    setFiltres((f) => ({ ...f, page: 1, ...changements }))
  }, [])

  const allerPage = useCallback((page) => {
    setChargement(true)
    setFiltres((f) => ({ ...f, page }))
  }, [])

  const recharger = useCallback(() => {
    setChargement(true)
    setVersion((v) => v + 1)
  }, [])

  return { donnees, setDonnees, meta, chargement, erreur, filtres, filtrer, allerPage, recharger }
}
