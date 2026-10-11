import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cx } from '../../lib/utils'

const VARIANTES = {
  primaire:
    'bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-700/60',
  secondaire:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 shadow-sm hover:bg-slate-50 active:bg-slate-100',
  or: 'bg-or-400 text-brand-950 shadow-sm hover:bg-or-300 active:bg-or-500',
  fantome: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  clair: 'bg-white/10 text-white ring-1 ring-inset ring-white/25 backdrop-blur hover:bg-white/20',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
  'danger-doux': 'text-red-700 ring-1 ring-inset ring-red-200 bg-red-50 hover:bg-red-100',
}

const TAILLES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-base',
}

export default function Bouton({
  variante = 'primaire',
  taille = 'md',
  chargement = false,
  icone: Icone,
  iconeDroite: IconeDroite,
  vers,
  className,
  children,
  disabled,
  ...props
}) {
  const classes = cx(
    'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-70',
    VARIANTES[variante],
    TAILLES[taille],
    className,
  )

  const contenu = (
    <>
      {chargement ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        Icone && <Icone className={taille === 'lg' ? 'size-5' : 'size-4'} aria-hidden />
      )}
      {children}
      {IconeDroite && !chargement && <IconeDroite className={taille === 'lg' ? 'size-5' : 'size-4'} aria-hidden />}
    </>
  )

  if (vers) {
    return (
      <Link to={vers} className={classes} {...props}>
        {contenu}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled || chargement} aria-busy={chargement || undefined} {...props}>
      {contenu}
    </button>
  )
}
