import { AlarmClock, FileSearch, Inbox, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeStatut } from '../../../components/dossiers'
import { Alerte, Avatar, EnTetePage, EtatVide, Pagination, Squelette } from '../../../components/ui'
import { useAuth } from '../../../context/AuthContext'
import { useListe } from '../../../hooks/useListe'
import { api } from '../../../lib/api'
import { cx, dates } from '../../../lib/utils'

/** RF-013 / M05 : file de travail de l'agent (ou vue globale pour l'administration). */
export default function FileTraitement() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const estAgent = utilisateur.role === 'agent'
  const { donnees, meta, chargement, erreur, filtres, filtrer, allerPage } = useListe('/traitement/dossiers', {
    statut: estAgent ? 'a_traiter' : 'tous',
    q: '',
    retard: '',
    mes_dossiers: '',
  })
  const [resume, setResume] = useState(null)

  useEffect(() => {
    api('/traitement/resume').then((r) => setResume(r.data)).catch(() => {})
  }, [])

  const onglets = [
    { valeur: 'a_traiter', libelle: 'À traiter', compte: resume ? resume.nouveaux + resume.en_verification + resume.en_traitement : null },
    { valeur: 'soumis', libelle: 'Nouveaux', compte: resume?.nouveaux },
    { valeur: 'en_verification', libelle: 'En vérification', compte: resume?.en_verification },
    { valeur: 'en_traitement', libelle: 'En traitement', compte: resume?.en_traitement },
    { valeur: 'correction_demandee', libelle: 'Attente citoyen', compte: resume?.en_attente_citoyen },
    { valeur: 'tous', libelle: 'Tous' },
  ]

  return (
    <>
      <EnTetePage
        surtitre={estAgent ? utilisateur.service?.nom ?? 'Traitement' : 'Supervision'}
        titre={estAgent ? 'File de travail' : 'Tous les dossiers'}
        description={estAgent
          ? 'Les dossiers de votre service, du plus ancien au plus récent : premier arrivé, premier servi.'
          : 'Vue d’ensemble, en lecture, des dossiers transmis à l’administration.'}
      />

      {estAgent && !utilisateur.service && (
        <Alerte type="alerte" className="mb-6" titre="Aucun service de rattachement">
          Votre compte n’est rattaché à aucun service : demandez à l’administrateur de vous en attribuer un pour voir des dossiers.
        </Alerte>
      )}

      <div className="carte overflow-hidden">
        <div className="onglets flex gap-1 border-b border-slate-100 px-3 pt-3" role="tablist">
          {onglets.map((o) => (
            <button
              key={o.valeur}
              role="tab"
              aria-selected={filtres.statut === o.valeur}
              onClick={() => filtrer({ statut: o.valeur })}
              className={cx(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition',
                filtres.statut === o.valeur ? 'border-brand-600 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {o.libelle}
              {o.compte > 0 && <span className={cx('rounded-full px-1.5 py-0.5 text-xs', filtres.statut === o.valeur ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600')}>{o.compte}</span>}
            </button>
          ))}
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={filtres.q}
              onChange={(e) => filtrer({ q: e.target.value })}
              placeholder="Référence, nom du citoyen, procédure…"
              aria-label="Rechercher un dossier"
              className="block w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-3.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={filtres.retard === '1'} onChange={(e) => filtrer({ retard: e.target.checked ? '1' : '' })} className="size-4 rounded accent-red-600" />
            <AlarmClock className="size-4 text-red-500" aria-hidden /> En retard {resume?.en_retard > 0 && <span className="rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">{resume.en_retard}</span>}
          </label>
          {estAgent && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={filtres.mes_dossiers === '1'} onChange={(e) => filtrer({ mes_dossiers: e.target.checked ? '1' : '' })} className="size-4 rounded accent-brand-700" />
              Mes dossiers
            </label>
          )}
        </div>

        {erreur ? (
          <div className="p-6"><Alerte type="erreur">{erreur.message}</Alerte></div>
        ) : !chargement && donnees.length === 0 ? (
          <EtatVide icone={Inbox} titre="Aucun dossier ici" description={filtres.statut === 'a_traiter' ? 'Tous les dossiers de votre service sont à jour. Bravo !' : 'Aucun dossier ne correspond à ces filtres.'} />
        ) : (
          <>
          {/* Téléphone : une carte par dossier, plus lisible qu'un tableau qu'il faudrait faire défiler. */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {chargement
              ? Array.from({ length: 5 }).map((_, i) => <li key={i} className="p-4"><Squelette className="h-16" /></li>)
              : donnees.map((d) => (
                  <li key={d.id}>
                    <Link to={`/espace/traitement/${d.id}`} className={cx('flex items-start gap-3 p-4 transition active:bg-brand-50/60', d.en_retard && 'bg-red-50/30')}>
                      <Avatar prenom={d.citoyen?.prenom} nom={d.citoyen?.nom} taille="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{d.procedure?.titre}</p>
                        <p className="truncate text-xs text-slate-500"><span className="font-mono font-semibold">{d.reference}</span> · {d.citoyen?.nom_complet}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <BadgeStatut statut={d.statut} />
                          <span className={cx('text-xs', d.en_retard ? 'font-semibold text-red-600' : 'text-slate-500')}>
                            {d.en_retard && <AlarmClock className="mr-1 inline size-3.5" aria-hidden />}
                            {dates.relative(d.soumis_at)}
                          </span>
                          {d.documents_a_verifier_count > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                              <FileSearch className="size-3" aria-hidden /> {d.documents_a_verifier_count} à vérifier
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Dossier</th>
                  <th scope="col" className="px-5 py-3">Citoyen</th>
                  <th scope="col" className="px-5 py-3">Statut</th>
                  <th scope="col" className="hidden px-5 py-3 md:table-cell">Soumis</th>
                  <th scope="col" className="hidden px-5 py-3 lg:table-cell">Pièces</th>
                  <th scope="col" className="hidden px-5 py-3 xl:table-cell">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargement
                  ? Array.from({ length: 7 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-5 py-3.5"><Squelette className="h-10" /></td></tr>)
                  : donnees.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => navigate(`/espace/traitement/${d.id}`)}
                        className={cx('cursor-pointer transition hover:bg-brand-50/40', d.en_retard && 'bg-red-50/30')}
                      >
                        <td className="px-5 py-3.5">
                          <a href={`/espace/traitement/${d.id}`} onClick={(e) => { e.preventDefault(); navigate(`/espace/traitement/${d.id}`) }} className="font-mono text-xs font-semibold text-slate-500 hover:text-brand-700">{d.reference}</a>
                          <p className="max-w-xs truncate font-medium text-slate-900">{d.procedure?.titre}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar prenom={d.citoyen?.prenom} nom={d.citoyen?.nom} taille="sm" />
                            <span className="whitespace-nowrap text-slate-700">{d.citoyen?.nom_complet}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><BadgeStatut statut={d.statut} /></td>
                        <td className="hidden whitespace-nowrap px-5 py-3.5 md:table-cell">
                          <span className="text-slate-700">{dates.relative(d.soumis_at)}</span>
                          {d.en_retard && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-red-600"><AlarmClock className="size-3" aria-hidden /> Délai dépassé</span>
                          )}
                        </td>
                        <td className="hidden px-5 py-3.5 lg:table-cell">
                          {d.documents_a_verifier_count > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                              <FileSearch className="size-3" aria-hidden /> {d.documents_a_verifier_count} à vérifier
                            </span>
                          ) : (
                            <span className="text-slate-500">{d.documents_count}</span>
                          )}
                        </td>
                        <td className="hidden px-5 py-3.5 text-slate-600 xl:table-cell">{d.agent?.nom_complet ?? <span className="text-slate-400">Non attribué</span>}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        <Pagination meta={meta} onPage={allerPage} />
      </div>
    </>
  )
}
