import { ArrowLeft, ArrowRight, Clock, FileCheck2, Landmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconeCategorie } from '../../../components/ui/Icones'
import { Alerte, Bouton, Chargement, ZoneTexte } from '../../../components/ui'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'
import { libelleDelai } from '../../../lib/icones'
import AccesRefuse from '../../erreurs/AccesRefuse'
import NonTrouve from '../../erreurs/NonTrouve'

/** RF-006 / UC-03 : démarrer une démarche (étape 1 du parcours de dépôt). */
export default function NouveauDossier() {
  const { slug } = useParams()
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [procedure, setProcedure] = useState(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [champs, setChamps] = useState({ motif: '', precisions: '' })
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    api(`/procedures/${slug}`)
      .then((r) => setProcedure(r.data))
      .catch(() => setIntrouvable(true))
  }, [slug])

  if (utilisateur.role !== 'citoyen') return <AccesRefuse />
  if (introuvable) return <NonTrouve integre titre="Procédure introuvable" retour="/procedures" libelleRetour="Voir le catalogue" />
  if (!procedure) return <Chargement />

  const commencer = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const r = await api('/dossiers', { method: 'POST', body: { procedure: slug, ...champs } })
      toast.succes('Ajoutez maintenant vos pièces justificatives.', `Dossier ${r.data.reference} créé`)
      navigate(`/espace/dossiers/${r.data.id}`, { replace: true })
    } catch (err) {
      setErreur(err)
      setEnvoi(false)
    }
  }

  const obligatoires = procedure.pieces.filter((p) => p.obligatoire).length

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={`/procedures/${slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" aria-hidden /> Retour à la fiche
      </Link>

      {/* Étapes du dépôt */}
      <ol className="mb-8 grid grid-cols-3 gap-2 text-sm" aria-label="Étapes du dépôt">
        {['Votre demande', 'Pièces justificatives', 'Vérification et envoi'].map((e, i) => (
          <li key={e} className={i === 0 ? 'border-t-4 border-brand-600 pt-3 font-semibold text-brand-800' : 'border-t-4 border-slate-200 pt-3 text-slate-500'}>
            <span className="block text-xs">Étape {i + 1}</span>
            {e}
          </li>
        ))}
      </ol>

      <div className="carte overflow-hidden">
        <div className="flex items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
            <IconeCategorie nom={procedure.categorie?.icone} className="size-5" />
          </span>
          <div>
            <p className="text-sm text-brand-700">Nouvelle démarche</p>
            <h1 className="titre-display text-2xl font-semibold">{procedure.titre}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Clock className="size-4 text-slate-400" aria-hidden /> {libelleDelai(procedure.delai_jours)}</span>
              <span className="flex items-center gap-1.5"><FileCheck2 className="size-4 text-slate-400" aria-hidden /> {obligatoires} pièce{obligatoires > 1 ? 's' : ''} obligatoire{obligatoires > 1 ? 's' : ''}</span>
              {procedure.service && <span className="flex items-center gap-1.5"><Landmark className="size-4 text-slate-400" aria-hidden /> {procedure.service.nom}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={commencer} className="space-y-5 p-6" noValidate>
          {erreur && erreur.status !== 422 && <Alerte type="erreur">{erreur.message}</Alerte>}
          <ZoneTexte
            label="Objet de votre demande"
            rows={3}
            value={champs.motif}
            onChange={(e) => setChamps((c) => ({ ...c, motif: e.target.value }))}
            erreur={erreur?.champ('motif')}
            placeholder="Ex. : constitution d’un dossier de concours de la fonction publique."
            aide="Expliquez en une phrase pourquoi vous faites cette demande. Vous pourrez le modifier avant l’envoi."
            maxLength={2000}
          />
          <ZoneTexte
            label="Précisions (facultatif)"
            rows={3}
            value={champs.precisions}
            onChange={(e) => setChamps((c) => ({ ...c, precisions: e.target.value }))}
            placeholder="Toute information utile à l’agent : urgence, numéro d’acte connu…"
            maxLength={2000}
          />
          <Alerte type="info">
            Votre dossier sera enregistré en <b>brouillon</b> : rien n’est transmis à l’administration tant que vous ne l’avez pas soumis.
          </Alerte>
          <div className="flex justify-end">
            <Bouton type="submit" taille="lg" chargement={envoi} iconeDroite={ArrowRight}>Créer mon dossier</Bouton>
          </div>
        </form>
      </div>
    </div>
  )
}
