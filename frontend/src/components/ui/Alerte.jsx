import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cx } from '../../lib/utils'

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
