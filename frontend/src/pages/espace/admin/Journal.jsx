import { CheckCircle2, ScrollText, XCircle } from 'lucide-react'
import { Alerte, Badge, Champ, EnTetePage, EtatVide, Pagination, Selecteur, Squelette } from '../../../components/ui'
import { useListe } from '../../../hooks/useListe'
import { LIBELLES_ACTIONS } from '../../../lib/journal'
import { ROLES } from '../../../lib/roles'
import { dates } from '../../../lib/utils'

const FAMILLES = [
  { valeur: '', libelle: 'Toutes les actions' },
  { valeur: 'connexion', libelle: 'Connexions' },
  { valeur: 'admin', libelle: 'Administration' },
  { valeur: 'profil', libelle: 'Profils' },
  { valeur: 'mot_de_passe', libelle: 'Mots de passe' },
  { valeur: 'compte', libelle: 'Inscriptions' },
]

function Details({ details }) {
  if (!details) return <span className="text-slate-400">—</span>
  if (details.avant && details.apres) {
    return (
      <span className="text-xs text-slate-600">
        {Object.keys(details.apres).map((cle) => (
          <span key={cle} className="mr-2 inline-block">
            <b className="font-medium">{cle}</b> : <s className="text-slate-400">{String(details.avant[cle])}</s> → {String(details.apres[cle])}
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className="text-xs text-slate-600">
      {Object.entries(details)
        .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' · ')}
    </span>
  )
}

/** RF-022 : consultation du journal d'audit. */
export default function Journal() {
  const { donnees, meta, chargement, erreur, filtres, filtrer, allerPage } = useListe('/admin/journal', {
    action: '',
    resultat: '',
    du: '',
    au: '',
  })

  return (
    <>
      <EnTetePage
        surtitre="Administration"
        titre="Journal d'audit"
        description="Toutes les actions sensibles sont enregistrées avec leur auteur, leur date, leur adresse IP et leur résultat."
      />

      <div className="carte overflow-hidden">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <Selecteur value={filtres.action} onChange={(e) => filtrer({ action: e.target.value })} aria-label="Type d'action">
            {FAMILLES.map((f) => (
              <option key={f.valeur} value={f.valeur}>{f.libelle}</option>
            ))}
          </Selecteur>
          <Selecteur value={filtres.resultat} onChange={(e) => filtrer({ resultat: e.target.value })} aria-label="Résultat">
            <option value="">Tous les résultats</option>
            <option value="succes">Succès</option>
            <option value="echec">Échecs</option>
          </Selecteur>
          <Champ type="date" value={filtres.du} onChange={(e) => filtrer({ du: e.target.value })} aria-label="Depuis le" />
          <Champ type="date" value={filtres.au} onChange={(e) => filtrer({ au: e.target.value })} aria-label="Jusqu'au" />
        </div>

        {erreur ? (
          <div className="p-6"><Alerte type="erreur">{erreur.message}</Alerte></div>
        ) : !chargement && donnees.length === 0 ? (
          <EtatVide icone={ScrollText} titre="Aucune action enregistrée" description="Aucune entrée ne correspond à ces filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3">Acteur</th>
                  <th scope="col" className="px-5 py-3">Action</th>
                  <th scope="col" className="hidden px-5 py-3 lg:table-cell">Détails</th>
                  <th scope="col" className="hidden px-5 py-3 md:table-cell">Adresse IP</th>
                  <th scope="col" className="px-5 py-3">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargement
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-5 py-3.5"><Squelette className="h-6 w-full" /></td></tr>
                    ))
                  : donnees.map((j) => (
                      <tr key={j.id} className="align-top hover:bg-slate-50/60">
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{dates.heure(j.created_at)}</td>
                        <td className="px-5 py-3.5">
                          {j.user ? (
                            <>
                              <p className="font-medium text-slate-900">{j.user.prenom} {j.user.nom}</p>
                              <p className="text-xs text-slate-500">{ROLES[j.user.role]?.libelle}</p>
                            </>
                          ) : (
                            <span className="text-slate-400">Anonyme</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">{LIBELLES_ACTIONS[j.action] ?? j.action}</p>
                          {j.objet_type && <p className="text-xs text-slate-500">{j.objet_type} #{j.objet_id}</p>}
                        </td>
                        <td className="hidden max-w-xs px-5 py-3.5 lg:table-cell"><Details details={j.details} /></td>
                        <td className="hidden px-5 py-3.5 font-mono text-xs text-slate-500 md:table-cell">{j.ip ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          {j.resultat === 'succes' ? (
                            <Badge className="bg-brand-50 text-brand-800 ring-brand-200"><CheckCircle2 className="size-3" aria-hidden /> Succès</Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 ring-red-200"><XCircle className="size-3" aria-hidden /> Échec</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={allerPage} />
      </div>
    </>
  )
}
