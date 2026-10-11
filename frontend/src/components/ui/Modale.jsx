import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/utils'

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
