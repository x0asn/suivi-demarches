import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const CENTRE_SENEGAL = [14.5, -15.5]

function icone(selectionne) {
  const couleur = selectionne ? '#d4a12f' : '#154e38'
  const taille = selectionne ? 40 : 32
  return L.divIcon({
    className: '',
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille],
    popupAnchor: [0, -taille + 4],
    html: `<svg viewBox="0 0 32 32" width="${taille}" height="${taille}" style="filter: drop-shadow(0 4px 6px rgb(8 36 26 / .35))">
      <path d="M16 1C9.4 1 4 6.2 4 12.7 4 21.5 16 31 16 31s12-9.5 12-18.3C28 6.2 22.6 1 16 1z" fill="${couleur}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="12.5" r="4.5" fill="#fff"/></svg>`,
  })
}

function echapper(texte = '') {
  return String(texte).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

/** Carte des points d'accueil (M08). Les tuiles OpenStreetMap nécessitent une connexion internet. */
export default function CarteServices({ services, selection, onSelection }) {
  const conteneur = useRef(null)
  const carte = useRef(null)
  const marqueurs = useRef(new Map())
  const [horsLigne, setHorsLigne] = useState(false)

  // Création de la carte (une seule fois).
  useEffect(() => {
    const instance = L.map(conteneur.current, { zoomControl: true, scrollWheelZoom: false }).setView(CENTRE_SENEGAL, 7)
    const tuiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(instance)
    let erreurs = 0
    tuiles.on('tileerror', () => {
      erreurs += 1
      if (erreurs > 3) setHorsLigne(true)
    })
    carte.current = instance
    return () => {
      instance.remove()
      carte.current = null
    }
  }, [])

  // Marqueurs à chaque changement de la liste.
  useEffect(() => {
    const instance = carte.current
    if (!instance) return
    marqueurs.current.forEach((m) => m.remove())
    marqueurs.current.clear()

    const points = services.filter((s) => s.latitude && s.longitude)
    points.forEach((s) => {
      const m = L.marker([s.latitude, s.longitude], { icon: icone(false), title: s.nom })
        .addTo(instance)
        .bindPopup(
          `<div style="font-family:inherit;min-width:180px"><p style="margin:0;font-weight:600;color:#0f172a">${echapper(s.nom)}</p>
           <p style="margin:2px 0 0;color:#64748b;font-size:12px">${echapper(s.type_libelle)} · ${echapper(s.commune ?? '')}</p>
           ${s.horaires ? `<p style="margin:6px 0 0;font-size:12px;color:#334155">${echapper(s.horaires)}</p>` : ''}</div>`,
        )
      m.on('click', () => onSelection?.(s.id))
      marqueurs.current.set(s.id, m)
    })

    if (points.length > 0) {
      instance.fitBounds(L.latLngBounds(points.map((s) => [s.latitude, s.longitude])), { padding: [40, 40], maxZoom: 12 })
    }
    // onSelection est volontairement exclu : la liste des marqueurs ne dépend que des services.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services])

  // Mise en évidence du service sélectionné.
  useEffect(() => {
    marqueurs.current.forEach((m, id) => {
      m.setIcon(icone(id === selection))
      m.setZIndexOffset(id === selection ? 1000 : 0)
    })
    const m = marqueurs.current.get(selection)
    if (m && carte.current) {
      carte.current.flyTo(m.getLatLng(), Math.max(carte.current.getZoom(), 13), { duration: 0.8 })
      m.openPopup()
    }
  }, [selection, services])

  return (
    <div className="relative size-full">
      <div ref={conteneur} className="size-full" role="region" aria-label="Carte des services administratifs" />
      {horsLigne && (
        <div className="absolute inset-x-4 top-4 z-[500] flex items-center gap-2 rounded-xl bg-white/95 p-3 text-sm text-slate-700 shadow-flottant ring-1 ring-slate-200">
          <WifiOff className="size-4 shrink-0 text-or-600" aria-hidden />
          Le fond de carte nécessite une connexion internet. Les adresses restent consultables dans la liste.
        </div>
      )}
    </div>
  )
}
