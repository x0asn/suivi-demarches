import { useMemo, useRef, useState } from 'react'
import { cx, nombre } from '../../lib/utils'

/*
 * Graphiques SVG faits main, sans dépendance :
 * traits fins (2px), extrémités arrondies de 4px, grille discrète, info-bulle au survol,
 * légende toujours présente pour plusieurs séries, texte jamais coloré par la série.
 * Palette validée (vert #1d7a52 / or #d4a12f) : l'or étant sous 3:1, une vue tableau est toujours proposée.
 */

const ENCRE = { primaire: '#0f172a', secondaire: '#475569', discret: '#94a3b8', grille: '#e2e8f0' }

/** Pas « rond » (1, 2, 5, 10…) pour 4 intervalles : graduations toujours propres. */
function pasRond(max) {
  const brut = Math.max(1, max) / 4
  const puissance = 10 ** Math.floor(Math.log10(brut))
  return [1, 2, 5, 10].map((m) => m * puissance).find((p) => p >= brut)
}

/** Courbes multi-séries (évolution mensuelle) avec réticule et info-bulle. */
export function GraphiqueCourbes({ donnees, series, hauteur = 260, libelleAxe }) {
  const ref = useRef(null)
  const [survol, setSurvol] = useState(null)
  const largeur = 720
  const marge = { haut: 16, droite: 24, bas: 32, gauche: 40 }
  const l = largeur - marge.gauche - marge.droite
  const h = hauteur - marge.haut - marge.bas

  const pas = pasRond(Math.max(...donnees.flatMap((d) => series.map((s) => d[s.cle]))))
  const max = pas * 4
  const x = (i) => marge.gauche + (donnees.length <= 1 ? l / 2 : (i * l) / (donnees.length - 1))
  const y = (v) => marge.haut + h - (v / max) * h
  const graduations = [0, 1, 2, 3, 4].map((k) => k * pas)

  const surMouvement = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * largeur
    const i = Math.round(((px - marge.gauche) / l) * (donnees.length - 1))
    setSurvol(Math.max(0, Math.min(donnees.length - 1, i)))
  }

  return (
    <div className="relative">
      <Legende series={series} />
      <svg
        ref={ref}
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="mt-3 w-full overflow-visible"
        role="img"
        aria-label={libelleAxe}
        onMouseMove={surMouvement}
        onMouseLeave={() => setSurvol(null)}
      >
        {graduations.map((g) => (
          <g key={g}>
            <line x1={marge.gauche} x2={largeur - marge.droite} y1={y(g)} y2={y(g)} stroke={ENCRE.grille} strokeWidth="1" />
            <text x={marge.gauche - 8} y={y(g)} dy="0.32em" textAnchor="end" fontSize="11" fill={ENCRE.discret}>{nombre(g)}</text>
          </g>
        ))}
        {donnees.map((d, i) => (
          <text key={d.mois} x={x(i)} y={hauteur - 8} textAnchor="middle" fontSize="11" fill={survol === i ? ENCRE.primaire : ENCRE.secondaire}>{d.libelle}</text>
        ))}

        {survol !== null && <line x1={x(survol)} x2={x(survol)} y1={marge.haut} y2={marge.haut + h} stroke={ENCRE.discret} strokeWidth="1" />}

        {series.map((s) => {
          const points = donnees.map((d, i) => `${x(i)},${y(d[s.cle])}`).join(' ')
          const dernier = donnees.length - 1
          return (
            <g key={s.cle}>
              {s.aire && (
                <polygon points={`${x(0)},${y(0)} ${points} ${x(dernier)},${y(0)}`} fill={s.couleur} opacity="0.1" />
              )}
              <polyline points={points} fill="none" stroke={s.couleur} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {/* Point final + valeur directe (étiquetage sélectif) */}
              <circle cx={x(dernier)} cy={y(donnees[dernier][s.cle])} r="4.5" fill={s.couleur} stroke="#fff" strokeWidth="2" />
              {survol !== null && <circle cx={x(survol)} cy={y(donnees[survol][s.cle])} r="5" fill={s.couleur} stroke="#fff" strokeWidth="2" />}
            </g>
          )
        })}
      </svg>

      {survol !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 min-w-[10rem] rounded-xl bg-white px-3 py-2.5 text-sm shadow-flottant ring-1 ring-slate-200"
          style={{ left: `clamp(0px, calc(${(x(survol) / largeur) * 100}% - 5rem), calc(100% - 10rem))` }}
        >
          <p className="font-semibold text-slate-900">{donnees[survol].libelle}</p>
          {series.map((s) => (
            <p key={s.cle} className="mt-1 flex items-center justify-between gap-4 text-slate-600">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full" style={{ background: s.couleur }} /> {s.libelle}</span>
              <span className="font-semibold tabular-nums text-slate-900">{nombre(donnees[survol][s.cle])}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** Barres horizontales à une seule série (magnitude par catégorie), triées. */
export function GraphiqueBarres({ donnees, couleur = '#1d7a52', format = nombre, libelle }) {
  const [survol, setSurvol] = useState(null)
  const max = useMemo(() => Math.max(1, ...donnees.map((d) => d.valeur)), [donnees])

  return (
    <ul className="space-y-3" aria-label={libelle}>
      {donnees.map((d, i) => (
        <li
          key={d.libelle}
          className="relative"
          onMouseEnter={() => setSurvol(i)}
          onMouseLeave={() => setSurvol(null)}
        >
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className={cx('truncate', survol === i ? 'font-medium text-slate-900' : 'text-slate-700')}>{d.libelle}</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">{format(d.valeur)}</span>
          </div>
          <div className="h-3 rounded-r bg-slate-100">
            <div
              className="h-3 rounded-r transition-[width] duration-500"
              style={{ width: `${(d.valeur / max) * 100}%`, background: couleur, opacity: survol === null || survol === i ? 1 : 0.55, minWidth: d.valeur > 0 ? 4 : 0 }}
            />
          </div>
          {survol === i && d.detail && (
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow-flottant ring-1 ring-slate-200">{d.detail}</div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function Legende({ series }) {
  if (series.length < 2) return null
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600" aria-label="Légende">
      {series.map((s) => (
        <li key={s.cle} className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded-full" style={{ background: s.couleur, height: 3 }} aria-hidden />
          {s.libelle}
        </li>
      ))}
    </ul>
  )
}
