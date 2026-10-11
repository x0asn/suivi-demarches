import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { libelleDistance } from '../../lib/geo'

const CENTRE_SENEGAL = [14.5, -15.5]

function icone(selectionne, recommande) {
  const couleur = selectionne ? '#d4a12f' : recommande ? '#1d7a52' : '#154e38'
  const taille = selectionne ? 40 : 32
  return L.divIcon({
    className: '',
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille],
    popupAnchor: [0, -taille + 4],
    html: `<svg viewBox="0 0 32 32" width="${taille}" height="${taille}" style="filter: drop-shadow(0 4px 6px rgb(8 36 26 / .35))">
      <path d="M16 1C9.4 1 4 6.2 4 12.7 4 21.5 16 31 16 31s12-9.5 12-18.3C28 6.2 22.6 1 16 1z" fill="${couleur}" stroke="#fff" stroke-width="2"/>
      ${recommande && !selectionne
        ? '<path d="M11 12.5l3.5 3.5 6.5-7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<circle cx="16" cy="12.5" r="4.5" fill="#fff"/>'}</svg>`,
  })
}

/** Point bleu « Vous êtes ici ». */
const ICONE_POSITION = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgb(37 99 235 / .25), 0 2px 6px rgb(15 23 42 / .4)"></span>`,
})

function echapper(texte = '') {
  return String(texte).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

/**
 * Carte des administrations (M08). Affiche la position du citoyen lorsqu'il l'a autorisée,
 * et un trait vers l'administration sélectionnée. Les tuiles OpenStreetMap nécessitent
 * une connexion internet.
 */
export default function CarteServices({ services, selection, onSelection, position = null, recommande = null }) {
  const conteneur = useRef(null)
  const carte = useRef(null)
  const marqueurs = useRef(new Map())
  const couchePosition = useRef(null)
  const trait = useRef(null)
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

  // Marqueurs et cadrage, à chaque changement de la liste ou de la position.
  useEffect(() => {
    const instance = carte.current
    if (!instance) return
    marqueurs.current.forEach((m) => m.remove())
    marqueurs.current.clear()
    couchePosition.current?.remove()
    couchePosition.current = null

    const points = services.filter((s) => s.latitude && s.longitude)
    points.forEach((s) => {
      const distance = libelleDistance(s.distance)
      const m = L.marker([s.latitude, s.longitude], { icon: icone(false, s.id === recommande), title: s.nom })
        .addTo(instance)
        .bindPopup(
          `<div style="font-family:inherit;min-width:180px"><p style="margin:0;font-weight:600;color:#0f172a">${echapper(s.nom)}</p>
           <p style="margin:2px 0 0;color:#64748b;font-size:12px">${echapper(s.type_libelle)} · ${echapper(s.commune ?? '')}${distance ? ` · ${distance}` : ''}</p>
           ${s.horaires ? `<p style="margin:6px 0 0;font-size:12px;color:#334155">${echapper(s.horaires)}</p>` : ''}</div>`,
        )
      m.on('click', () => onSelection?.(s.id))
      marqueurs.current.set(s.id, m)
    })

    if (position) {
      couchePosition.current = L.layerGroup([
        L.circle([position.latitude, position.longitude], {
          radius: Math.min(position.precision ?? 0, 2000),
          color: '#2563eb',
          weight: 1,
          fillOpacity: 0.08,
          interactive: false,
        }),
        L.marker([position.latitude, position.longitude], { icon: ICONE_POSITION, zIndexOffset: 2000, title: 'Vous êtes ici' }).bindPopup(
          '<p style="margin:0;font-weight:600;color:#0f172a">Vous êtes ici</p>',
        ),
      ]).addTo(instance)
    }

    if (position && points.length > 0) {
      // Avec la position : on cadre sur le citoyen et les administrations les plus proches.
      const proches = [...points].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, 4)
      instance.fitBounds(
        L.latLngBounds([[position.latitude, position.longitude], ...proches.map((s) => [s.latitude, s.longitude])]),
        { padding: [50, 50], maxZoom: 14 },
      )
    } else if (position) {
      instance.setView([position.latitude, position.longitude], 12)
    } else if (points.length > 0) {
      instance.fitBounds(L.latLngBounds(points.map((s) => [s.latitude, s.longitude])), { padding: [40, 40], maxZoom: 12 })
    }
    // onSelection est volontairement exclu : les marqueurs ne dépendent que des services et de la position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, position, recommande])

  // Mise en évidence du service sélectionné, relié à la position du citoyen.
  useEffect(() => {
    const instance = carte.current
    marqueurs.current.forEach((m, id) => {
      m.setIcon(icone(id === selection, id === recommande))
      m.setZIndexOffset(id === selection ? 1000 : 0)
    })
    trait.current?.remove()
    trait.current = null

    const m = marqueurs.current.get(selection)
    if (!m || !instance) return
    if (position) {
      const depart = [position.latitude, position.longitude]
      trait.current = L.polyline([depart, m.getLatLng()], { color: '#2563eb', weight: 3, opacity: 0.7, dashArray: '6 8', interactive: false }).addTo(instance)
      instance.flyToBounds(L.latLngBounds([depart, m.getLatLng()]), { padding: [60, 60], maxZoom: 15, duration: 0.8 })
    } else {
      instance.flyTo(m.getLatLng(), Math.max(instance.getZoom(), 13), { duration: 0.8 })
    }
    m.openPopup()
  }, [selection, services, position, recommande])

  return (
    <div className="relative size-full">
      <div ref={conteneur} className="size-full" role="region" aria-label="Carte des administrations" />
      {horsLigne && (
        <div className="absolute inset-x-4 top-4 z-[500] flex items-center gap-2 rounded-xl bg-white/95 p-3 text-sm text-slate-700 shadow-flottant ring-1 ring-slate-200">
          <WifiOff className="size-4 shrink-0 text-or-600" aria-hidden />
          Le fond de carte nécessite une connexion internet. Les adresses restent consultables dans la liste.
        </div>
      )}
    </div>
  )
}
