import { ArrowDown, ArrowLeft, ArrowUp, Ban, Eye, FileCheck2, ListOrdered, Plus, Rocket, Save, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alerte, Badge, Bouton, Champ, Chargement, Modale, Selecteur, ZoneTexte } from '../../../components/ui'
import { useToast } from '../../../context/ToastContext'
import { api } from '../../../lib/api'
import { REGLES_COMPETENCE, STATUTS_PROCEDURE } from '../../../lib/procedures'
import { sansAccents } from '../../../lib/utils'
import NonTrouve from '../../erreurs/NonTrouve'

const VIDE = {
  titre: '',
  categorie_id: '',
  service_id: '',
  regle_competence: 'nationale',
  service_ids: [],
  resume: '',
  description: '',
  conditions: '',
  public_concerne: '',
  delai_jours: '',
  cout: '',
  pieces: [{ libelle: '', description: '', obligatoire: true }],
  etapes: [
    { titre: 'Dépôt en ligne', description: 'Vous remplissez le formulaire et joignez les pièces demandées.' },
    { titre: 'Vérification des pièces', description: 'Un agent contrôle la conformité de votre dossier.' },
    { titre: 'Décision et délivrance', description: '' },
  ],
}

function deplacer(liste, i, sens) {
  const j = i + sens
  if (j < 0 || j >= liste.length) return liste
  const copie = [...liste]
  ;[copie[i], copie[j]] = [copie[j], copie[i]]
  return copie
}

function BlocListe({ titre, description, icone: Icone, children, onAjouter, libelleAjout }) {
  return (
    <section className="carte">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icone className="size-[1.1rem]" aria-hidden /></span>
          <div>
            <h2 className="font-semibold text-slate-900">{titre}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <Bouton type="button" variante="secondaire" taille="sm" icone={Plus} onClick={onAjouter}>{libelleAjout}</Bouton>
      </div>
      <ol className="divide-y divide-slate-100">{children}</ol>
    </section>
  )
}

function ActionsLigne({ index, total, onMonter, onDescendre, onSupprimer, libelle }) {
  return (
    <div className="flex shrink-0 gap-0.5 sm:pt-7">
      <button type="button" onClick={onMonter} disabled={index === 0} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label={`Monter ${libelle}`}><ArrowUp className="size-4" /></button>
      <button type="button" onClick={onDescendre} disabled={index === total - 1} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label={`Descendre ${libelle}`}><ArrowDown className="size-4" /></button>
      <button type="button" onClick={onSupprimer} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${libelle}`}><Trash2 className="size-4" /></button>
    </div>
  )
}

/** RF-017 : création et édition d'une procédure. */
export default function ProcedureEditeur() {
  const { id } = useParams()
  const creation = !id
  const navigate = useNavigate()
  const toast = useToast()

  const [champs, setChamps] = useState(VIDE)
  const [procedure, setProcedure] = useState(null)
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [filtreServices, setFiltreServices] = useState('')
  const [chargement, setChargement] = useState(!creation)
  const [introuvable, setIntrouvable] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [changementStatut, setChangementStatut] = useState(null)

  useEffect(() => {
    api('/categories').then((r) => setCategories(r.data)).catch(() => {})
    api('/admin/services').then((r) => setServices(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (creation) return
    api(`/admin/procedures/${id}`)
      .then((r) => {
        const p = r.data
        setProcedure(p)
        setChamps({
          titre: p.titre,
          categorie_id: p.categorie?.id ?? '',
          service_id: p.service?.id ?? '',
          regle_competence: p.competence?.valeur ?? 'nationale',
          service_ids: (p.services ?? []).map((s) => s.id),
          resume: p.resume ?? '',
          description: p.description ?? '',
          conditions: p.conditions ?? '',
          public_concerne: p.public_concerne ?? '',
          delai_jours: p.delai_jours ?? '',
          cout: p.cout ?? '',
          pieces: p.pieces.map(({ libelle, description, obligatoire }) => ({ libelle, description: description ?? '', obligatoire })),
          etapes: p.etapes.map(({ titre, description }) => ({ titre, description: description ?? '' })),
        })
      })
      .catch(() => setIntrouvable(true))
      .finally(() => setChargement(false))
  }, [id, creation])

  // Administrations habilitées (M08) : regroupées par type pour cocher « toutes les mairies » d'un clic.
  const typesServices = Object.entries(
    services.reduce((groupes, s) => ({ ...groupes, [s.type]: [...(groupes[s.type] ?? []), s] }), {}),
  )
  const termesFiltre = sansAccents(filtreServices).split(/\s+/).filter(Boolean)
  const servicesFiltres = services.filter((s) => {
    const texte = sansAccents(`${s.nom} ${s.commune} ${s.region} ${s.type_libelle}`)
    return termesFiltre.every((t) => texte.includes(t))
  })
  const habilitees = services.filter((s) => champs.service_ids.includes(s.id) || String(s.id) === String(champs.service_id)).length

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))
  const majListe = (cle, fn) => setChamps((c) => ({ ...c, [cle]: fn(c[cle]) }))
  const majElement = (cle, i, changements) => majListe(cle, (l) => l.map((x, k) => (k === i ? { ...x, ...changements } : x)))

  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    const corps = {
      ...champs,
      service_id: champs.service_id || null,
      delai_jours: champs.delai_jours === '' ? null : Number(champs.delai_jours),
      categorie_id: champs.categorie_id ? Number(champs.categorie_id) : null,
    }
    try {
      const r = creation
        ? await api('/admin/procedures', { method: 'POST', body: corps })
        : await api(`/admin/procedures/${id}`, { method: 'PUT', body: corps })
      toast.succes(r.message)
      if (creation) navigate(`/espace/admin/procedures/${r.data.id}`, { replace: true })
      else setProcedure(r.data)
    } catch (err) {
      setErreur(err)
      toast.erreur(err.status === 422 ? 'Certains champs sont à corriger.' : err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnvoi(false)
    }
  }

  const appliquerStatut = async () => {
    try {
      const r = await api(`/admin/procedures/${id}/statut`, { method: 'PATCH', body: { statut: changementStatut } })
      setProcedure((p) => ({ ...p, statut: r.data.statut, slug: r.data.slug }))
      toast.succes(r.message)
    } catch (err) {
      toast.erreur(err.message)
    } finally {
      setChangementStatut(null)
    }
  }

  if (chargement) return <Chargement />
  if (introuvable) return <NonTrouve integre titre="Procédure introuvable" retour="/espace/admin/procedures" libelleRetour="Retour aux procédures" />

  const err = (cle) => erreur?.champ(cle)
  const statut = procedure ? STATUTS_PROCEDURE[procedure.statut] : null
  const TEXTES_STATUT = {
    publiee: ['Publier cette procédure ?', 'Elle sera immédiatement visible dans le catalogue et les citoyens pourront déposer une demande.', 'Publier'],
    brouillon: ['Repasser en brouillon ?', "La procédure disparaîtra du catalogue jusqu'à sa prochaine publication.", 'Repasser en brouillon'],
    desactivee: ['Désactiver cette procédure ?', "Elle ne sera plus proposée aux citoyens. Les dossiers déjà déposés continuent d'être traités.", 'Désactiver'],
  }

  return (
    <form onSubmit={enregistrer} noValidate>
      <Link to="/espace/admin/procedures" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" aria-hidden /> Toutes les procédures
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="titre-display text-2xl font-semibold sm:text-3xl">{creation ? 'Nouvelle procédure' : champs.titre || 'Procédure'}</h1>
            {statut && <Badge className={statut.classe} point={statut.point}>{statut.libelle}</Badge>}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {creation ? 'La procédure sera créée en brouillon : vous pourrez la relire avant de la publier.' : 'Les modifications sont visibles par les citoyens dès l’enregistrement si la procédure est publiée.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {procedure?.statut === 'publiee' && (
            <Bouton type="button" variante="secondaire" icone={Eye} onClick={() => window.open(`/procedures/${procedure.slug}`, '_blank')}>Voir</Bouton>
          )}
          {procedure && procedure.statut !== 'publiee' && (
            <Bouton type="button" variante="or" icone={Rocket} onClick={() => setChangementStatut('publiee')}>Publier</Bouton>
          )}
          {procedure?.statut === 'publiee' && (
            <Bouton type="button" variante="secondaire" icone={Undo2} onClick={() => setChangementStatut('brouillon')}>Dépublier</Bouton>
          )}
          {procedure && procedure.statut !== 'desactivee' && (
            <Bouton type="button" variante="danger-doux" icone={Ban} onClick={() => setChangementStatut('desactivee')}>Désactiver</Bouton>
          )}
          <Bouton type="submit" icone={Save} chargement={envoi}>Enregistrer</Bouton>
        </div>
      </div>

      {erreur?.status === 422 && (
        <Alerte type="erreur" titre="Certains champs sont à corriger" className="mb-6">Vérifiez les messages affichés sous les champs concernés.</Alerte>
      )}
      {erreur && erreur.status !== 422 && <Alerte type="erreur" className="mb-6">{erreur.message}</Alerte>}

      <div className="space-y-6">
        <section className="carte">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">Informations générales</h2>
            <p className="text-sm text-slate-500">Ce que le citoyen lit en premier dans le catalogue.</p>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <Champ className="sm:col-span-2" label="Titre de la procédure" name="titre" value={champs.titre} onChange={modifier} erreur={err('titre')} obligatoire placeholder="Ex. : Certificat de résidence" />
            <Selecteur label="Catégorie" name="categorie_id" value={champs.categorie_id} onChange={modifier} erreur={err('categorie_id')} obligatoire>
              <option value="">Choisir…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </Selecteur>
            <Selecteur label="Service de référence" name="service_id" value={champs.service_id} onChange={modifier} erreur={err('service_id')} aide="Service responsable de la démarche. Il est toujours habilité à la traiter.">
              <option value="">Non défini</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </Selecteur>
            <ZoneTexte className="sm:col-span-2" rows={2} label="Résumé" name="resume" value={champs.resume} onChange={modifier} erreur={err('resume')} obligatoire aide={`${champs.resume.length}/500 caractères — une ou deux phrases.`} maxLength={500} />
            <ZoneTexte className="sm:col-span-2" label="Description détaillée" name="description" value={champs.description} onChange={modifier} erreur={err('description')} />
            <ZoneTexte className="sm:col-span-2" rows={3} label="Conditions" name="conditions" value={champs.conditions} onChange={modifier} erreur={err('conditions')} aide="Qui peut faire la demande, sous quelles conditions." />
            <Champ className="sm:col-span-2" label="Public concerné" name="public_concerne" value={champs.public_concerne} onChange={modifier} erreur={err('public_concerne')} />
            <Champ label="Délai indicatif (jours)" name="delai_jours" type="number" min={0} max={365} value={champs.delai_jours} onChange={modifier} erreur={err('delai_jours')} />
            <Champ label="Coût" name="cout" value={champs.cout} onChange={modifier} erreur={err('cout')} placeholder="Ex. : Gratuit, Timbre fiscal" />
          </div>
        </section>

        <section className="carte">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">Compétence des administrations</h2>
            <p className="text-sm text-slate-500">Quelles administrations peuvent traiter cette démarche, et laquelle est compétente pour un citoyen donné.</p>
          </div>
          <div className="space-y-5 p-6">
            <Selecteur
              label="Règle de compétence"
              name="regle_competence"
              value={champs.regle_competence}
              onChange={modifier}
              erreur={err('regle_competence')}
              aide={REGLES_COMPETENCE.find((r) => r.valeur === champs.regle_competence)?.aide}
            >
              {REGLES_COMPETENCE.map((r) => <option key={r.valeur} value={r.valeur}>{r.libelle}</option>)}
            </Selecteur>
            <fieldset>
              <legend className="text-sm font-medium text-slate-900">Administrations habilitées</legend>
              <p className="mt-0.5 text-sm text-slate-500">Le citoyen choisira parmi elles au moment de déposer sa demande. Les agents de l’administration choisie traiteront le dossier.</p>
              {err('service_ids') && <p className="mt-1.5 text-sm text-red-600" role="alert">{err('service_ids')}</p>}
              <p className="mt-3 text-sm font-medium text-slate-900" aria-live="polite">
                {habilitees} administration{habilitees > 1 ? 's' : ''} habilitée{habilitees > 1 ? 's' : ''} sur {services.length}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {typesServices.map(([type, liste]) => {
                  const tous = liste.every((s) => champs.service_ids.includes(s.id) || String(s.id) === String(champs.service_id))
                  const ids = liste.map((s) => s.id)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => majListe('service_ids', (l) => (tous ? l.filter((x) => !ids.includes(x)) : [...new Set([...l, ...ids])]))}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${tous ? 'bg-brand-800 text-white ring-brand-800' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-300'}`}
                      aria-pressed={tous}
                    >
                      {tous ? '✓ ' : ''}{liste[0].type_libelle} ({liste.length})
                    </button>
                  )
                })}
              </div>
              <input
                type="search"
                value={filtreServices}
                onChange={(e) => setFiltreServices(e.target.value)}
                placeholder="Filtrer par nom, commune ou région…"
                aria-label="Filtrer les administrations"
                className="mt-3 block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto rounded-xl p-1 ring-1 ring-slate-100 sm:grid-cols-2">
                {servicesFiltres.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500 sm:col-span-2">Aucune administration ne correspond.</p>}
                {servicesFiltres.map((s) => {
                  const reference = String(s.id) === String(champs.service_id)
                  const coche = reference || champs.service_ids.includes(s.id)
                  return (
                    <label key={s.id} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 ${coche ? 'bg-brand-50 ring-brand-300' : 'ring-slate-200'}`}>
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 rounded accent-brand-700"
                        checked={coche}
                        disabled={reference}
                        onChange={(e) => majListe('service_ids', (l) => (e.target.checked ? [...l, s.id] : l.filter((x) => x !== s.id)))}
                      />
                      <span>
                        <span className="block font-medium text-slate-900">{s.nom}</span>
                        <span className="text-slate-500">{s.commune}{s.region ? ` · ${s.region}` : ''}{reference ? ' · service de référence' : ''}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </div>
        </section>

        <BlocListe
          titre="Pièces à fournir"
          description="Le citoyen devra joindre chaque pièce obligatoire avant de soumettre sa demande (RG-004)."
          icone={FileCheck2}
          libelleAjout="Ajouter une pièce"
          onAjouter={() => majListe('pieces', (l) => [...l, { libelle: '', description: '', obligatoire: true }])}
        >
          {champs.pieces.length === 0 && <li className="px-6 py-8 text-center text-sm text-slate-500">Aucune pièce. Une procédure doit en comporter au moins une pour être publiée.</li>}
          {champs.pieces.map((piece, i) => (
            <li key={i} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-start">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 sm:mt-8">{i + 1}</span>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Champ label="Libellé" value={piece.libelle} onChange={(e) => majElement('pieces', i, { libelle: e.target.value })} erreur={err(`pieces.${i}.libelle`)} obligatoire />
                <Champ label="Précision" value={piece.description} onChange={(e) => majElement('pieces', i, { description: e.target.value })} placeholder="Ex. : de moins de 3 mois" />
                <label className="flex items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
                  <input type="checkbox" checked={piece.obligatoire} onChange={(e) => majElement('pieces', i, { obligatoire: e.target.checked })} className="size-4 rounded accent-brand-700" />
                  Pièce obligatoire
                </label>
              </div>
              <ActionsLigne
                index={i}
                total={champs.pieces.length}
                libelle={`la pièce ${i + 1}`}
                onMonter={() => majListe('pieces', (l) => deplacer(l, i, -1))}
                onDescendre={() => majListe('pieces', (l) => deplacer(l, i, 1))}
                onSupprimer={() => majListe('pieces', (l) => l.filter((_, k) => k !== i))}
              />
            </li>
          ))}
        </BlocListe>

        <BlocListe
          titre="Étapes de la démarche"
          description="Elles sont présentées au citoyen sous forme de parcours, dans cet ordre."
          icone={ListOrdered}
          libelleAjout="Ajouter une étape"
          onAjouter={() => majListe('etapes', (l) => [...l, { titre: '', description: '' }])}
        >
          {champs.etapes.map((etape, i) => (
            <li key={i} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-start">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-semibold text-white sm:mt-8">{i + 1}</span>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Champ label="Titre" value={etape.titre} onChange={(e) => majElement('etapes', i, { titre: e.target.value })} erreur={err(`etapes.${i}.titre`)} obligatoire />
                <Champ label="Description" value={etape.description} onChange={(e) => majElement('etapes', i, { description: e.target.value })} />
              </div>
              <ActionsLigne
                index={i}
                total={champs.etapes.length}
                libelle={`l'étape ${i + 1}`}
                onMonter={() => majListe('etapes', (l) => deplacer(l, i, -1))}
                onDescendre={() => majListe('etapes', (l) => deplacer(l, i, 1))}
                onSupprimer={() => majListe('etapes', (l) => l.filter((_, k) => k !== i))}
              />
            </li>
          ))}
        </BlocListe>

        <div className="flex justify-end">
          <Bouton type="submit" taille="lg" icone={Save} chargement={envoi}>Enregistrer la procédure</Bouton>
        </div>
      </div>

      {changementStatut && (
        <Modale
          ouverte
          onFermer={() => setChangementStatut(null)}
          titre={TEXTES_STATUT[changementStatut][0]}
          pied={
            <>
              <Bouton type="button" variante="secondaire" onClick={() => setChangementStatut(null)}>Annuler</Bouton>
              <Bouton type="button" variante={changementStatut === 'desactivee' ? 'danger' : 'primaire'} onClick={appliquerStatut}>
                {TEXTES_STATUT[changementStatut][2]}
              </Bouton>
            </>
          }
        >
          <p className="text-sm text-slate-600">{TEXTES_STATUT[changementStatut][1]}</p>
          {changementStatut === 'publiee' && <p className="mt-3 text-sm text-slate-500">Pensez à enregistrer vos dernières modifications avant de publier.</p>}
        </Modale>
      )}
    </form>
  )
}
