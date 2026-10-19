import { useCallback, useState } from 'react'

const MESSAGES = {
  refusee: 'Vous avez refusé l’accès à votre position. Vous pouvez l’autoriser dans les réglages de votre navigateur, ou chercher par région.',
  indisponible: 'Votre position n’a pas pu être déterminée. Vérifiez que la localisation de votre appareil est activée.',
  delai: 'La localisation prend trop de temps. Réessayez, de préférence à l’extérieur ou près d’une fenêtre.',
  non_supportee: 'Votre navigateur ne permet pas la géolocalisation. Vous pouvez chercher par région.',
  non_securisee: 'Le téléphone ne donne sa position qu’à un site sécurisé (adresse en https), ce qui sera le cas une fois la plateforme en ligne. En attendant, choisissez votre région.',
}

/**
 * Position GPS du citoyen (M08). Elle n'est demandée qu'après un clic explicite,
 * reste dans le navigateur et n'est jamais envoyée au serveur.
 *
 * etat : 'inactive' | 'recherche' | 'active' | 'refusee' | 'indisponible' | 'delai' | 'non_supportee' | 'non_securisee'
 */
export function usePosition() {
  const [etat, setEtat] = useState('inactive')
  const [position, setPosition] = useState(null)

  const localiser = useCallback(() => {
    // Les navigateurs refusent la position sur une adresse http (démonstration sur le wifi).
    if (!window.isSecureContext) {
      setEtat('non_securisee')
      return
    }
    if (!('geolocation' in navigator)) {
      setEtat('non_supportee')
      return
    }
    setEtat('recherche')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude, precision: coords.accuracy })
        setEtat('active')
      },
      (erreur) => {
        setPosition(null)
        setEtat(erreur.code === erreur.PERMISSION_DENIED ? 'refusee' : erreur.code === erreur.TIMEOUT ? 'delai' : 'indisponible')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }, [])

  const oublier = useCallback(() => {
    setPosition(null)
    setEtat('inactive')
  }, [])

  return { etat, position, message: MESSAGES[etat] ?? null, localiser, oublier }
}
