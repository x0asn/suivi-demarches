import { COULEURS_SENEGAL } from '../../lib/senegal'
import { cx } from '../../lib/utils'

/** Petit drapeau du Sénégal en SVG (les drapeaux emoji ne s'affichent pas sous Windows). */
export function DrapeauSenegal({ className }) {
  return (
    <svg viewBox="0 0 30 20" className={cx('shrink-0 overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10', className)} aria-hidden>
      <rect width="10" height="20" fill={COULEURS_SENEGAL.vert} />
      <rect x="10" width="10" height="20" fill={COULEURS_SENEGAL.or} />
      <rect x="20" width="10" height="20" fill={COULEURS_SENEGAL.rouge} />
      <polygon
        fill={COULEURS_SENEGAL.vert}
        points="15,6.2 15.98,9.18 19.12,9.18 16.57,11.02 17.55,14 15,12.16 12.45,14 13.43,11.02 10.88,9.18 14.02,9.18"
      />
    </svg>
  )
}

/** L'étoile verte du drapeau, utilisée comme petit signe distinctif dans les titres. */
export function EtoileSenegal({ className, couleur = COULEURS_SENEGAL.vert }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('shrink-0', className)} aria-hidden>
      <polygon fill={couleur} points="12,1.5 14.47,9.1 22.46,9.1 15.99,13.8 18.47,21.4 12,16.7 5.53,21.4 8.01,13.8 1.54,9.1 9.53,9.1" />
    </svg>
  )
}

/** Trois traits aux couleurs nationales autour de l'étoile : sépare un titre de son contenu. */
export function FiletSenegal({ className }) {
  return (
    <div className={cx('flex items-center justify-center gap-2', className)} aria-hidden>
      <span className="h-0.5 w-8 rounded-full" style={{ background: COULEURS_SENEGAL.vert }} />
      <span className="h-0.5 w-8 rounded-full" style={{ background: COULEURS_SENEGAL.or }} />
      <EtoileSenegal className="size-3.5" />
      <span className="h-0.5 w-8 rounded-full" style={{ background: COULEURS_SENEGAL.or }} />
      <span className="h-0.5 w-8 rounded-full" style={{ background: COULEURS_SENEGAL.rouge }} />
    </div>
  )
}

/**
 * Bande décorative inspirée des frises des pagnes wax : une suite de triangles aux couleurs
 * du drapeau et de l'or. Le dessin est défini dans index.css (.bande-wax).
 */
export function BandeWax({ className }) {
  return <div className={cx('bande-wax w-full', className)} aria-hidden />
}

/**
 * Silhouette de baobab, l'arbre emblème du Sénégal. Purement décorative :
 * elle prend la couleur du texte de son conteneur (currentColor).
 */
export function Baobab({ className }) {
  return (
    <svg viewBox="0 0 200 224" className={cx('shrink-0', className)} fill="currentColor" aria-hidden>
      {/* Tronc épais, évasé à la base */}
      <path d="M74 224 C82 196 86 164 82 122 L118 122 C114 164 118 196 126 224 Z" />
      {/* Branches */}
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path strokeWidth="11" d="M90 128 Q68 106 44 100" />
        <path strokeWidth="10" d="M95 126 Q84 92 70 72" />
        <path strokeWidth="11" d="M100 126 Q100 88 100 62" />
        <path strokeWidth="10" d="M105 126 Q116 92 130 72" />
        <path strokeWidth="11" d="M110 128 Q132 106 156 100" />
        <path strokeWidth="6" d="M44 100 Q34 92 28 80" />
        <path strokeWidth="6" d="M70 72 Q62 58 60 46" />
        <path strokeWidth="6" d="M130 72 Q138 58 140 46" />
        <path strokeWidth="6" d="M156 100 Q166 92 172 80" />
        <path strokeWidth="5" d="M100 62 Q92 50 86 40" />
        <path strokeWidth="5" d="M100 62 Q108 50 114 40" />
      </g>
      {/* Feuillage clairsemé, en bouquets au bout des branches */}
      <circle cx="26" cy="74" r="14" />
      <circle cx="46" cy="90" r="11" />
      <circle cx="58" cy="40" r="15" />
      <circle cx="74" cy="60" r="11" />
      <circle cx="86" cy="32" r="13" />
      <circle cx="100" cy="48" r="13" />
      <circle cx="114" cy="32" r="13" />
      <circle cx="126" cy="60" r="11" />
      <circle cx="142" cy="40" r="15" />
      <circle cx="154" cy="90" r="11" />
      <circle cx="174" cy="74" r="14" />
    </svg>
  )
}

/** Fin liseré aux couleurs nationales. */
export function LisereSenegal({ className }) {
  return (
    <div className={cx('flex h-1 w-full', className)} aria-hidden>
      <span className="flex-1" style={{ background: COULEURS_SENEGAL.vert }} />
      <span className="flex-1" style={{ background: COULEURS_SENEGAL.or }} />
      <span className="flex-1" style={{ background: COULEURS_SENEGAL.rouge }} />
    </div>
  )
}
