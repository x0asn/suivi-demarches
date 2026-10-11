import { Download, Eye, FileImage, FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiError, BASE_URL, jeton } from '../../lib/api'
import { dates, tailleFichier } from '../../lib/utils'
import { Modale } from '../ui'

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
