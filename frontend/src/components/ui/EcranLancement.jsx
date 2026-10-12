import { useEffect, useState } from 'react'
import { COULEURS_SENEGAL } from '../../lib/senegal'
import { cx } from '../../lib/utils'
import { BandeWax, Baobab } from './Senegal'

/** L'écran d'ouverture ne se montre qu'une fois par visite (jusqu'à la fermeture de l'onglet). */
const CLE = 'sd:lancement'
const DUREE_LOGO = 2500
const DUREE_RIDEAU = 650

function dejaVu() {
  try {
    return sessionStorage.getItem(CLE) === '1'
  } catch {
    return true
  }
}

/** Délai d'une animation, pour enchaîner les éléments du logo. */
const apres = (ms) => ({ animationDelay: `${ms}ms` })
/** Un élément du logo grandit à partir de son propre centre. */
const depuisSonCentre = { transformBox: 'fill-box', transformOrigin: 'center' }

/**
 * Écran d'ouverture, comme sur une application de téléphone : la courbe du logo se trace,
 * ses points s'allument un à un, le nom apparaît, puis le rideau se lève sur la page.
 * Un clic ou une touche le passe. Il n'apparaît pas si la personne a demandé à réduire les animations.
 */
export default function EcranLancement() {
  const [etat, setEtat] = useState(() => {
    if (dejaVu() || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'termine'
    return 'logo'
  })

  useEffect(() => {
    if (etat === 'termine') return
    try {
      sessionStorage.setItem(CLE, '1')
    } catch {
      /* stockage indisponible : l'écran reviendra simplement à la prochaine page */
    }
    const lever = () => setEtat((e) => (e === 'logo' ? 'rideau' : e))
    const minuteur = setTimeout(lever, DUREE_LOGO)
    window.addEventListener('keydown', lever)
    window.addEventListener('pointerdown', lever)
    return () => {
      clearTimeout(minuteur)
      window.removeEventListener('keydown', lever)
      window.removeEventListener('pointerdown', lever)
    }
  }, [etat])

  useEffect(() => {
    if (etat !== 'rideau') return
    const minuteur = setTimeout(() => setEtat('termine'), DUREE_RIDEAU)
    return () => clearTimeout(minuteur)
  }, [etat])

  if (etat === 'termine') return null

  return (
    <div
      className={cx('fixed inset-0 z-[3000] flex flex-col items-center justify-center overflow-hidden bg-brand-900 text-white', etat === 'rideau' && 'animate-rideau')}
      role="status"
      aria-label="Ouverture de Suivi Démarches"
    >
      <div className="motif-senegal absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(29_122_82_/_0.55),transparent_62%)]" aria-hidden />
      <Baobab className="absolute -bottom-2 left-1/2 h-64 -translate-x-1/2 text-white opacity-[0.06] sm:h-80" />
      <BandeWax className="absolute inset-x-0 bottom-0" />
      <BandeWax className="absolute inset-x-0 top-0" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <svg viewBox="0 0 64 64" className="size-28 drop-shadow-[0_18px_40px_rgb(0_0_0_/_0.35)] sm:size-32" aria-hidden>
          <rect width="64" height="64" rx="16" fill="#ffffff" className="animate-eclot" style={depuisSonCentre} />
          {/* La courbe se trace du premier au dernier point. */}
          <path
            d="M17 44 L28 33 L36 39 L47 24"
            pathLength="1"
            fill="none"
            stroke="#154e38"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            className="animate-trace"
            style={apres(550)}
          />
          <circle cx="17" cy="44" r="4.5" fill="#d4a12f" className="animate-eclot" style={{ ...depuisSonCentre, ...apres(450) }} />
          <circle cx="28" cy="33" r="4" fill="#154e38" className="animate-eclot" style={{ ...depuisSonCentre, ...apres(800) }} />
          <circle cx="36" cy="39" r="4" fill="#154e38" className="animate-eclot" style={{ ...depuisSonCentre, ...apres(1030) }} />
          <circle cx="47" cy="24" r="5.5" fill="#d4a12f" className="animate-eclot" style={{ ...depuisSonCentre, ...apres(1380) }} />
          <circle cx="47" cy="24" r="5.5" fill="none" stroke="#d4a12f" strokeWidth="2" className="animate-halo" style={{ ...depuisSonCentre, ...apres(1500), opacity: 0 }} />
        </svg>

        <p className="mt-7 animate-monte font-display text-4xl font-semibold tracking-tight sm:text-5xl" style={apres(1250)}>Suivi Démarches</p>
        <p className="mt-2 animate-monte text-xs font-medium uppercase tracking-[0.32em] text-brand-200" style={apres(1450)}>Guichet numérique</p>

        <div className="mt-6 flex h-1 w-40 origin-center animate-deploie overflow-hidden rounded-full" style={apres(1600)} aria-hidden>
          <span className="flex-1" style={{ background: COULEURS_SENEGAL.vert }} />
          <span className="flex-1" style={{ background: COULEURS_SENEGAL.or }} />
          <span className="flex-1" style={{ background: COULEURS_SENEGAL.rouge }} />
        </div>
        <p className="mt-5 animate-monte text-sm text-brand-100" style={apres(1800)}>
          <span className="font-semibold text-or-300">Dalal ak jàmm</span> · Bienvenue
        </p>
      </div>
    </div>
  )
}
