import { ApiError, BASE_URL, jeton } from './api'

/**
 * Pose une question à l'assistant et reçoit la réponse au fil de l'eau.
 *
 * Le serveur répond par une suite d'événements (text/event-stream) :
 *   { type: 'texte', texte }  → un morceau de la réponse, à ajouter à l'affichage
 *   { type: 'fin', mode }     → réponse terminée ; mode = 'ia' ou 'secours' (réponse guidée sans IA)
 *   { type: 'erreur', message }
 *
 * @param {{ role: 'user' | 'assistant', content: string }[]} messages
 * @param {{ surTexte: (morceau: string) => void, signal?: AbortSignal }} options
 * @returns {Promise<'ia' | 'secours'>}
 */
export async function demanderAssistant(messages, { surTexte, signal }) {
  const headers = { Accept: 'text/event-stream', 'Content-Type': 'application/json' }
  const token = jeton.lire()
  if (token) headers.Authorization = `Bearer ${token}`

  let reponse
  try {
    reponse = await fetch(`${BASE_URL}/assistant`, { method: 'POST', headers, body: JSON.stringify({ messages }), signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('Impossible de joindre l’assistant. Vérifiez votre connexion.', 0)
  }

  if (!reponse.ok || !reponse.body) {
    const donnees = await reponse.json().catch(() => null)
    throw new ApiError(
      reponse.status === 429
        ? 'Vous posez beaucoup de questions ! Patientez une minute avant de continuer.'
        : donnees?.message ?? 'L’assistant est momentanément indisponible.',
      reponse.status,
      donnees?.errors ?? {},
    )
  }

  const lecteur = reponse.body.getReader()
  const decodeur = new TextDecoder()
  let tampon = ''
  let mode = 'ia'

  for (;;) {
    const { done, value } = await lecteur.read()
    if (done) break
    tampon += decodeur.decode(value, { stream: true })

    // Les événements sont séparés par une ligne vide ; le dernier peut être incomplet.
    const evenements = tampon.split('\n\n')
    tampon = evenements.pop()
    for (const brut of evenements) {
      const ligne = brut.split('\n').find((l) => l.startsWith('data: '))
      if (!ligne) continue
      const evenement = JSON.parse(ligne.slice(6))
      if (evenement.type === 'texte') surTexte(evenement.texte)
      else if (evenement.type === 'fin') mode = evenement.mode
      else if (evenement.type === 'erreur') throw new ApiError(evenement.message, 500)
    }
  }

  return mode
}
