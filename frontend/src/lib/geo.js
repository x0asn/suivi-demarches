/** Géolocalisation (M08) : distances et itinéraires, calculés dans le navigateur du citoyen. */

const RAYON_TERRE_KM = 6371

/** Distance à vol d'oiseau entre deux points GPS (formule de Haversine), en kilomètres. */
export function distanceKm(a, b) {
  const rad = (degres) => (degres * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(h))
}

/** « ≈ 850 m », « ≈ 2,4 km », « ≈ 72 km » : la distance reste approximative (vol d'oiseau). */
export function libelleDistance(km) {
  if (km == null) return null
  if (km < 1) return `≈ ${Math.max(50, Math.round(km * 20) * 50)} m`
  const valeur = km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)
  return `≈ ${valeur} km`
}

/** Ajoute la distance à chaque service localisé et trie du plus proche au plus éloigné. */
export function trierParDistance(services, position) {
  if (!position) return services
  return services
    .map((s) => ({ ...s, distance: s.latitude && s.longitude ? distanceKm(position, s) : null }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
}

/**
 * Lien d'itinéraire vers un service. Il ouvre Google Maps (ou l'application de navigation
 * du téléphone) ; sans position connue, Google Maps part de la position de l'appareil.
 */
export function lienItineraire(service, position) {
  const params = new URLSearchParams({ api: '1', destination: `${service.latitude},${service.longitude}` })
  if (position) params.set('origin', `${position.latitude},${position.longitude}`)
  return `https://www.google.com/maps/dir/?${params}`
}
