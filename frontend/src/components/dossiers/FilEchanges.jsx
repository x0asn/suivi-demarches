import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../lib/api'
import { cx, dates } from '../../lib/utils'

/** Fil d'échanges entre le citoyen et l'administration (RF-016). */
export function FilEchanges({ dossier, observations, onAjout, moi, agent = false }) {
  const [contenu, setContenu] = useState('')
  const [interne, setInterne] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  const envoyer = async (e) => {
    e.preventDefault()
    if (!contenu.trim()) return
    setEnvoi(true)
    setErreur(null)
    try {
      const r = await api(`/dossiers/${dossier.id}/observations`, { method: 'POST', body: { contenu, interne } })
      onAjout(r.data)
      setContenu('')
      setInterne(false)
    } catch (err) {
      setErreur(err.champ?.('contenu') ?? err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div>
      {observations.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {agent ? 'Aucun échange pour le moment.' : 'Aucun message. Vous pouvez écrire à l’administration si vous avez une question sur votre dossier.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {observations.map((o) => {
            const deMoi = o.auteur?.id === moi.id
            const administration = o.auteur?.role !== 'citoyen'
            return (
              <li key={o.id} className={cx('flex', deMoi ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                    o.interne ? 'bg-or-50 text-slate-800 ring-1 ring-or-200' : deMoi ? 'rounded-br-md bg-brand-700 text-white' : 'rounded-bl-md bg-slate-100 text-slate-800',
                  )}
                >
                  <p className={cx('mb-1 text-xs font-semibold', deMoi && !o.interne ? 'text-brand-100' : 'text-slate-500')}>
                    {o.interne && '🔒 Note interne · '}
                    {deMoi ? 'Vous' : administration && !agent ? 'Administration' : o.auteur?.nom_complet}
                    {' · '}
                    <time dateTime={o.created_at}>{dates.heure(o.created_at)}</time>
                  </p>
                  <p className="whitespace-pre-line leading-relaxed">{o.contenu}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {dossier.permissions?.commenter && (
        <form onSubmit={envoyer} className="mt-5">
          <label htmlFor="message-dossier" className="sr-only">Votre message</label>
          <textarea
            id="message-dossier"
            rows={3}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder={agent ? 'Écrire au citoyen, ou ajouter une note interne…' : 'Écrire à l’administration…'}
            className="block w-full resize-y rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
            maxLength={2000}
          />
          {erreur && <p className="mt-1.5 text-sm text-red-600" role="alert">{erreur}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {agent ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={interne} onChange={(e) => setInterne(e.target.checked)} className="size-4 rounded accent-or-500" />
                Note interne (non visible par le citoyen)
              </label>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={envoi || !contenu.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {envoi && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {interne ? 'Enregistrer la note' : 'Envoyer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
