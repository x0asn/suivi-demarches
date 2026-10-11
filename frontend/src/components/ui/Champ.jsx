import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { cx } from '../../lib/utils'

const baseSaisie =
  'block w-full rounded-xl border-0 bg-white py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 transition focus:ring-2 focus:ring-inset focus:outline-none disabled:bg-slate-50 disabled:text-slate-500'

function classesSaisie(erreur, avecIcone, avecDroite) {
  return cx(
    baseSaisie,
    erreur ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-300 focus:ring-brand-600',
    avecIcone ? 'pl-10' : 'pl-3.5',
    avecDroite ? 'pr-10' : 'pr-3.5',
  )
}

/** Enveloppe commune : libellé, aide, message d'erreur accessible. */
function Enveloppe({ id, label, aide, erreur, obligatoire, children, className, actionLabel }) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor={id} className="block text-sm font-medium text-slate-800">
            {label}
            {obligatoire && (
              <span className="ml-0.5 text-red-600" aria-hidden>
                *
              </span>
            )}
          </label>
          {actionLabel}
        </div>
      )}
      {children}
      {erreur ? (
        <p id={`${id}-erreur`} className="mt-1.5 text-sm text-red-600" role="alert">
          {erreur}
        </p>
      ) : (
        aide && (
          <p id={`${id}-aide`} className="mt-1.5 text-sm text-slate-500">
            {aide}
          </p>
        )
      )}
    </div>
  )
}

export function Champ({ label, aide, erreur, icone: Icone, className, obligatoire, actionLabel, ...props }) {
  const id = useId()
  return (
    <Enveloppe {...{ id, label, aide, erreur, obligatoire, className, actionLabel }}>
      <div className="relative">
        {Icone && (
          <Icone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        )}
        <input
          id={id}
          className={classesSaisie(erreur, Icone, false)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
          required={obligatoire}
          {...props}
        />
      </div>
    </Enveloppe>
  )
}

export function ChampMotDePasse({ label, aide, erreur, icone: Icone, className, obligatoire, actionLabel, ...props }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <Enveloppe {...{ id, label, aide, erreur, obligatoire, className, actionLabel }}>
      <div className="relative">
        {Icone && (
          <Icone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        )}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={classesSaisie(erreur, Icone, true)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined}
          required={obligatoire}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Enveloppe>
  )
}

export function Selecteur({ label, aide, erreur, className, obligatoire, children, ...props }) {
  const id = useId()
  return (
    <Enveloppe {...{ id, label, aide, erreur, obligatoire, className }}>
      <div className="relative">
        <select
          id={id}
          className={cx(classesSaisie(erreur, false, true), 'appearance-none')}
          aria-invalid={erreur ? true : undefined}
          required={obligatoire}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      </div>
    </Enveloppe>
  )
}

export function ZoneTexte({ label, aide, erreur, className, obligatoire, ...props }) {
  const id = useId()
  return (
    <Enveloppe {...{ id, label, aide, erreur, obligatoire, className }}>
      <textarea
        id={id}
        rows={4}
        className={cx(classesSaisie(erreur, false, false), 'resize-y')}
        aria-invalid={erreur ? true : undefined}
        required={obligatoire}
        {...props}
      />
    </Enveloppe>
  )
}
