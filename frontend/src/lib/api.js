/**
 * Client HTTP unique vers l'API Laravel.
 * Toutes les réponses suivent le format { success, message, data, meta?, errors? }.
 */

export const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
const CLE_JETON = 'sd_jeton'

export const jeton = {
  lire: () => {
    try {
      return localStorage.getItem(CLE_JETON)
    } catch {
      return null
    }
  },
  ecrire: (valeur) => {
    try {
      localStorage.setItem(CLE_JETON, valeur)
    } catch {
      /* stockage indisponible : la session durera le temps de l'onglet */
    }
  },
  effacer: () => {
    try {
      localStorage.removeItem(CLE_JETON)
    } catch {
      /* rien à faire */
    }
  },
}

export class ApiError extends Error {
  constructor(message, status = 0, errors = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }

  /** Premier message d'erreur pour un champ de formulaire. */
  champ(nom) {
    return this.errors?.[nom]?.[0]
  }
}

export async function api(chemin, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(BASE_URL + chemin, window.location.origin)
  Object.entries(params ?? {}).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== '') url.searchParams.set(cle, valeur)
  })

  const headers = { Accept: 'application/json' }
  const token = jeton.lire()
  if (token) headers.Authorization = `Bearer ${token}`

  const estFormulaire = body instanceof FormData
  if (body && !estFormulaire) headers['Content-Type'] = 'application/json'

  let reponse
  try {
    reponse = await fetch(url, {
      method,
      headers,
      body: body ? (estFormulaire ? body : JSON.stringify(body)) : undefined,
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez votre connexion : l'action n'a pas été confirmée.",
      0,
    )
  }

  const donnees = await reponse.json().catch(() => null)

  if (reponse.status === 401 && token) {
    jeton.effacer()
    window.dispatchEvent(new Event('sd:session-expiree'))
  }

  if (!reponse.ok || donnees?.success === false) {
    throw new ApiError(
      donnees?.message ?? 'Une erreur inattendue est survenue. Réessayez dans quelques instants.',
      reponse.status,
      donnees?.errors ?? {},
    )
  }

  return donnees
}

/**
 * Envoi d'un fichier avec suivi de progression (XMLHttpRequest : fetch ne la fournit pas).
 * @param {(pourcentage: number) => void} surProgression
 */
export function televerser(chemin, formulaire, surProgression) {
  return new Promise((resoudre, rejeter) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', BASE_URL + chemin)
    xhr.setRequestHeader('Accept', 'application/json')
    const token = jeton.lire()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => e.lengthComputable && surProgression?.(Math.round((e.loaded / e.total) * 100))
    xhr.onerror = () => rejeter(new ApiError("Le fichier n'a pas pu être envoyé. Vérifiez votre connexion et réessayez.", 0))
    xhr.onload = () => {
      let donnees = null
      try {
        donnees = JSON.parse(xhr.responseText)
      } catch {
        /* réponse non JSON (ex. fichier trop lourd pour le serveur) */
      }
      if (xhr.status >= 200 && xhr.status < 300 && donnees?.success !== false) return resoudre(donnees)
      if (xhr.status === 413) return rejeter(new ApiError('Le fichier est trop volumineux : 5 Mo maximum.', 413))
      rejeter(new ApiError(donnees?.message ?? "Le fichier n'a pas pu être envoyé.", xhr.status, donnees?.errors ?? {}))
    }
    xhr.send(formulaire)
  })
}

/** URL d'un fichier protégé (documents) : à ouvrir via fetch avec le jeton. */
export async function telecharger(chemin, nomFichier) {
  const token = jeton.lire()
  const reponse = await fetch(BASE_URL + chemin, {
    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
  })
  if (!reponse.ok) throw new ApiError("Le fichier n'a pas pu être téléchargé.", reponse.status)
  const blob = await reponse.blob()
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(blob)
  lien.download = nomFichier
  lien.click()
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000)
}
