import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cx, initiales } from '../../lib/utils'

/* ---------- Logo ---------- */
export function Logo({ clair = false, compact = false, className }) {
  return (
    <Link to="/" className={cx('group inline-flex items-center gap-2.5', className)} aria-label="Suivi Démarches — accueil">
      <svg viewBox="0 0 64 64" className="size-9 shrink-0 transition-transform group-hover:-rotate-3" aria-hidden>
        <rect width="64" height="64" rx="16" fill={clair ? '#ffffff' : '#154e38'} />
        <path
          d="M17 44 L28 33 L36 39 L47 24"
          fill="none"
          stroke={clair ? '#154e38' : '#ffffff'}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="44" r="4.5" fill="#d4a12f" />
        <circle cx="28" cy="33" r="4" fill={clair ? '#154e38' : '#ffffff'} />
        <circle cx="36" cy="39" r="4" fill={clair ? '#154e38' : '#ffffff'} />
        <circle cx="47" cy="24" r="5.5" fill="#d4a12f" />
      </svg>
      {!compact && (
        <span className="whitespace-nowrap leading-none">
          <span className={cx('block font-display text-[1.2rem] font-semibold tracking-tight', clair ? 'text-white' : 'text-slate-900')}>
            Suivi Démarches
          </span>
          <span className={cx('mt-0.5 block text-[0.65rem] font-medium tracking-[0.14em] uppercase', clair ? 'text-brand-200' : 'text-brand-700')}>
            Guichet numérique
          </span>
        </span>
      )}
    </Link>
  )
}

/* ---------- Alerte ---------- */
const ALERTES = {
  erreur: { icone: AlertCircle, classe: 'bg-red-50 text-red-800 ring-red-200', iconeClasse: 'text-red-500' },
  succes: { icone: CheckCircle2, classe: 'bg-brand-50 text-brand-900 ring-brand-200', iconeClasse: 'text-brand-600' },
  info: { icone: Info, classe: 'bg-sky-50 text-sky-900 ring-sky-200', iconeClasse: 'text-sky-500' },
  alerte: { icone: TriangleAlert, classe: 'bg-or-50 text-or-700 ring-or-200', iconeClasse: 'text-or-500' },
}

export function Alerte({ type = 'info', titre, children, className }) {
  const { icone: Icone, classe, iconeClasse } = ALERTES[type]
  return (
    <div role={type === 'erreur' ? 'alert' : 'status'} className={cx('flex gap-3 rounded-xl p-4 text-sm ring-1 ring-inset', classe, className)}>
      <Icone className={cx('mt-0.5 size-5 shrink-0', iconeClasse)} aria-hidden />
      <div>
        {titre && <p className="font-semibold">{titre}</p>}
        {children && <div className={titre ? 'mt-1 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  )
}

/* ---------- Badge ---------- */
export function Badge({ className, children, point }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', className)}>
      {point && <span className={cx('size-1.5 rounded-full', point)} aria-hidden />}
      {children}
    </span>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ prenom, nom, taille = 'md', className }) {
  const tailles = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-semibold text-white ring-2 ring-white',
        tailles[taille],
        className,
      )}
      aria-hidden
    >
      {initiales(prenom, nom)}
    </span>
  )
}

/* ---------- Chargement ---------- */
export function Chargement({ texte = 'Chargement…', plein = false }) {
  return (
    <div className={cx('flex items-center justify-center gap-3 text-sm text-slate-500', plein ? 'min-h-screen' : 'py-16')} role="status">
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
      {texte}
    </div>
  )
}

export function Squelette({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-slate-200/70', className)} aria-hidden />
}

/* ---------- État vide ---------- */
export function EtatVide({ icone: Icone, titre, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-14 text-center', className)}>
      {Icone && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
          <Icone className="size-6" aria-hidden />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{titre}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Modale ---------- */
export function Modale({ ouverte, onFermer, titre, description, children, pied, large = false }) {
  const ref = useRef(null)
  const fermerRef = useRef(onFermer)

  useEffect(() => {
    fermerRef.current = onFermer
  })

  useEffect(() => {
    if (!ouverte) return
    const precedent = document.activeElement
    const surTouche = (e) => e.key === 'Escape' && fermerRef.current()
    document.addEventListener('keydown', surTouche)
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('input, select, textarea, button:not([data-fermer])')?.focus()
    return () => {
      document.removeEventListener('keydown', surTouche)
      document.body.style.overflow = ''
      precedent?.focus?.()
    }
  }, [ouverte])

  if (!ouverte) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onFermer} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modale-titre"
        className={cx(
          'relative flex max-h-[92vh] w-full animate-apparition flex-col rounded-t-2xl bg-white shadow-flottant sm:rounded-2xl',
          large ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="modale-titre" className="text-lg font-semibold text-slate-900">
              {titre}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            data-fermer
            onClick={onFermer}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {pied && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end rounded-b-2xl">{pied}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Pagination ---------- */
export function Pagination({ meta, onPage }) {
  if (!meta || meta.derniere_page <= 1) return null
  const debut = (meta.page - 1) * meta.par_page + 1
  const fin = Math.min(meta.page * meta.par_page, meta.total)
  return (
    <nav className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 sm:px-6" aria-label="Pagination">
      <p className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">{debut}</span>–<span className="font-medium text-slate-700">{fin}</span> sur{' '}
        <span className="font-medium text-slate-700">{meta.total}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden /> Précédent
        </button>
        <button
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page >= meta.derniere_page}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:opacity-40"
        >
          Suivant <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  )
}

/* ---------- En-tête de page (espace connecté) ---------- */
export function EnTetePage({ surtitre, titre, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {surtitre && <p className="mb-1 text-sm font-medium text-brand-700">{surtitre}</p>}
        <h1 className="titre-display text-2xl font-semibold sm:text-3xl">{titre}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
