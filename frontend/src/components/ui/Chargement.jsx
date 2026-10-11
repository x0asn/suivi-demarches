import { Loader2 } from 'lucide-react'
import { cx } from '../../lib/utils'

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
