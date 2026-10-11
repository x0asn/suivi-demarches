import { AlertCircle, CheckCircle2, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { api, televerser } from '../../lib/api'
import { cx, tailleFichier } from '../../lib/utils'
import { BoutonApercu, IconeFichier } from './ApercuDocument'
import { BadgeDocument } from './BadgeStatut'

const FORMATS = ['application/pdf', 'image/jpeg', 'image/png']
const TAILLE_MAX = 5 * 1024 * 1024

/**
 * Une pièce attendue par la procédure : zone de dépôt (glisser-déposer) ou fichier déjà déposé.
 * RF-008 : format et taille vérifiés avant l'envoi (et revérifiés par le serveur).
 */
export default function PieceDepot({ dossierId, piece, document, modifiable, onChange, onApercu }) {
  const champ = useRef(null)
  const [survol, setSurvol] = useState(false)
  const [progression, setProgression] = useState(null)
  const [erreur, setErreur] = useState(null)

  const envoyer = async (fichier) => {
    setErreur(null)
    if (!fichier) return
    if (!FORMATS.includes(fichier.type)) return setErreur('Format non accepté : choisissez un PDF, un JPG ou un PNG.')
    if (fichier.size > TAILLE_MAX) return setErreur(`Ce fichier fait ${tailleFichier(fichier.size)} : la limite est de 5 Mo.`)

    const formulaire = new FormData()
    formulaire.append('fichier', fichier)
    formulaire.append('piece_requise_id', piece.id)
    setProgression(0)
    try {
      await televerser(`/dossiers/${dossierId}/documents`, formulaire, setProgression)
      await onChange()
    } catch (err) {
      setErreur(err.champ?.('fichier') ?? err.message)
    } finally {
      setProgression(null)
      if (champ.current) champ.current.value = ''
    }
  }

  const retirer = async () => {
    setErreur(null)
    try {
      await api(`/documents/${document.id}`, { method: 'DELETE' })
      await onChange()
    } catch (err) {
      setErreur(err.message)
    }
  }

  const aRemplacer = document && ['refuse', 'a_corriger'].includes(document.statut)
  const peutDeposer = modifiable && (!document || document.statut !== 'accepte')

  return (
    <li className={cx('p-5', aRemplacer && 'bg-orange-50/40')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
            {document && document.statut !== 'refuse' && document.statut !== 'a_corriger' ? (
              <CheckCircle2 className="size-4 shrink-0 text-brand-600" aria-hidden />
            ) : piece.obligatoire ? (
              <span className="size-4 shrink-0 rounded-full border-2 border-slate-300" aria-hidden />
            ) : null}
            {piece.libelle}
            {!piece.obligatoire && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">Si concerné</span>}
          </p>
          {piece.description && <p className="mt-0.5 text-sm text-slate-500">{piece.description}</p>}
        </div>
        {document && <BadgeDocument statut={document.statut} />}
      </div>

      {document && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <IconeFichier mime={document.mime} className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{document.nom_original}</p>
            <p className="text-xs text-slate-500">{tailleFichier(document.taille)}</p>
          </div>
          <div className="flex items-center gap-1">
            <BoutonApercu onClick={() => onApercu({ ...document, piece_libelle: piece.libelle })} />
            {peutDeposer && (
              <>
                <button type="button" onClick={() => champ.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  <RefreshCw className="size-4" aria-hidden /> Remplacer
                </button>
                {document.statut === 'en_attente' && (
                  <button type="button" onClick={retirer} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Retirer ${document.nom_original}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {document?.motif && (
        <p className="mt-3 flex gap-2 rounded-lg bg-orange-100/70 px-3 py-2 text-sm text-orange-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span><b className="font-semibold">Message de l’agent :</b> {document.motif}</span>
        </p>
      )}

      {peutDeposer && !document && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => champ.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && champ.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSurvol(false)
            envoyer(e.dataTransfer.files?.[0])
          }}
          className={cx(
            'mt-3 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
            survol ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50',
          )}
          aria-label={`Déposer un fichier pour : ${piece.libelle}`}
        >
          <UploadCloud className={cx('size-7', survol ? 'text-brand-600' : 'text-slate-400')} aria-hidden />
          <p className="mt-2 text-sm text-slate-700"><span className="font-semibold text-brand-700">Choisir un fichier</span> ou glissez-le ici</p>
          <p className="mt-0.5 text-xs text-slate-500">PDF, JPG ou PNG · 5 Mo maximum</p>
        </div>
      )}

      {progression !== null && (
        <div className="mt-3" aria-live="polite">
          <div className="flex justify-between text-xs text-slate-600"><span>Envoi en cours…</span><span>{progression} %</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progression}%` }} />
          </div>
        </div>
      )}

      {erreur && <p className="mt-2 text-sm text-red-600" role="alert">{erreur}</p>}

      <input
        ref={champ}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => envoyer(e.target.files?.[0])}
        tabIndex={-1}
      />
    </li>
  )
}
