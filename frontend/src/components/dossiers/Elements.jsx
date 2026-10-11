import { AlertTriangle, Check, Download, Eye, FileImage, FileText, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, ApiError, BASE_URL, jeton } from '../../lib/api'
import { etapesFrise, STATUTS_DOCUMENT, STATUTS_DOSSIER } from '../../lib/dossiers'
import { cx, dates, tailleFichier } from '../../lib/utils'
import { Badge, Modale } from '../ui'

export function BadgeStatut({ statut, className }) {
  const s = STATUTS_DOSSIER[statut]
  if (!s) return null
  return <Badge className={cx(s.classe, className)} point={s.point}>{s.libelle}</Badge>
}

export function BadgeDocument({ statut }) {
  const s = STATUTS_DOCUMENT[statut]
  return <Badge className={s.classe} point={s.point}>{s.libelle}</Badge>
}

/** Frise d'avancement du dossier (RF-009 : statut lisible en un coup d'œil). */
export function Frise({ statut, compacte = false }) {
  const etapes = etapesFrise(statut)
  return (
    <ol className="flex items-start" aria-label="Avancement du dossier">
      {etapes.map((e, i) => (
        <li key={e.cle} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && (
            <span
              className={cx('absolute right-1/2 top-3.5 h-0.5 w-full', e.etat === 'avenir' ? 'bg-slate-200' : 'bg-brand-500')}
              aria-hidden
            />
          )}
          <span
            className={cx(
              'relative z-10 flex items-center justify-center rounded-full ring-4 ring-white transition',
              compacte ? 'size-6' : 'size-7',
              e.etat === 'fait' && 'bg-brand-600 text-white',
              e.etat === 'actuel' && !e.alerte && 'bg-white ring-brand-100 outline outline-2 outline-brand-600',
              e.etat === 'actuel' && e.alerte && 'bg-orange-500 text-white ring-orange-100',
              e.etat === 'avenir' && 'bg-slate-100 text-slate-400',
            )}
          >
            {e.etat === 'fait' && <Check className="size-3.5" aria-hidden />}
            {e.etat === 'actuel' && !e.alerte && <span className="size-2.5 animate-pulse rounded-full bg-brand-600" />}
            {e.etat === 'actuel' && e.alerte && (statut === 'rejete' ? <X className="size-3.5" aria-hidden /> : <AlertTriangle className="size-3.5" aria-hidden />)}
          </span>
          {!compacte && (
            <span className={cx('mt-2 px-0.5 text-[0.62rem] font-medium leading-tight sm:text-xs', e.etat === 'avenir' ? 'text-slate-400' : 'text-slate-700', e.etat === 'actuel' && 'font-semibold text-slate-900')}>
              {e.libelle}
            </span>
          )}
          <span className="sr-only">{e.etat === 'fait' ? 'terminée' : e.etat === 'actuel' ? 'en cours' : 'à venir'}</span>
        </li>
      ))}
    </ol>
  )
}

/** RG-005 : historique daté des changements de statut. */
export function Historique({ historique }) {
  return (
    <ol className="relative space-y-6">
      {[...historique].reverse().map((h, i, liste) => {
        const s = STATUTS_DOSSIER[h.nouveau_statut]
        return (
          <li key={h.id} className="relative flex gap-4">
            {i < liste.length - 1 && <span className="absolute left-[0.6875rem] top-7 h-[calc(100%+0.5rem)] w-px bg-slate-200" aria-hidden />}
            <span className={cx('relative mt-1 size-[1.375rem] shrink-0 rounded-full ring-4 ring-white', s?.point)} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold text-slate-900">{h.nouveau_statut_libelle}</p>
                <time className="text-xs text-slate-500" dateTime={h.created_at}>{dates.heure(h.created_at)}</time>
              </div>
              {h.auteur && (
                <p className="text-sm text-slate-500">
                  par {h.auteur.nom_complet}
                  {h.auteur.role !== 'citoyen' && ' · Administration'}
                </p>
              )}
              {h.commentaire && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/70">« {h.commentaire} »</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Aperçu d'une pièce (PDF ou image), chargée avec le jeton : jamais d'accès direct au fichier. */
export function ApercuDocument({ document, onFermer, actions }) {
  const [url, setUrl] = useState(null)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let objet
    const controleur = new AbortController()
    fetch(`${BASE_URL}/documents/${document.id}/fichier`, {
      headers: { Authorization: `Bearer ${jeton.lire()}` },
      signal: controleur.signal,
    })
      .then((r) => {
        if (!r.ok) throw new ApiError("La pièce n'a pas pu être chargée.", r.status)
        return r.blob()
      })
      .then((b) => {
        objet = URL.createObjectURL(b)
        setUrl(objet)
      })
      .catch((e) => e.name !== 'AbortError' && setErreur(e.message))
    return () => {
      controleur.abort()
      if (objet) URL.revokeObjectURL(objet)
    }
  }, [document.id])

  const estImage = document.mime?.startsWith('image/')

  return (
    <Modale
      ouverte
      large
      onFermer={onFermer}
      titre={document.piece_libelle ?? document.nom_original}
      description={`${document.nom_original} · ${tailleFichier(document.taille)} · déposée le ${dates.courte(document.created_at)}`}
      pied={
        <>
          {url && (
            <a href={url} download={document.nom_original} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              <Download className="size-4" aria-hidden /> Télécharger
            </a>
          )}
          {actions}
        </>
      }
    >
      <div className="flex min-h-[24rem] items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
        {erreur ? (
          <p className="p-6 text-sm text-red-600">{erreur}</p>
        ) : !url ? (
          <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Chargement" />
        ) : estImage ? (
          <img src={url} alt={document.nom_original} className="max-h-[60vh] object-contain" />
        ) : (
          <iframe src={url} title={document.nom_original} className="h-[60vh] w-full bg-white" />
        )}
      </div>
    </Modale>
  )
}

export function IconeFichier({ mime, className }) {
  const Icone = mime?.startsWith('image/') ? FileImage : FileText
  return <Icone className={className} aria-hidden />
}

export function BoutonApercu({ onClick, libelle = 'Voir' }) {
  return (
    <button onClick={onClick} type="button" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
      <Eye className="size-4" aria-hidden /> {libelle}
    </button>
  )
}

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
