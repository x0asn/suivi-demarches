import { ExternalLink, FilePlus2, FileText, Pencil, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alerte, Badge, Bouton, Champ, EnTetePage, EtatVide, Pagination, Selecteur, Squelette } from '../../../components/ui'
import { useListe } from '../../../hooks/useListe'
import { api } from '../../../lib/api'
import { iconeCategorie } from '../../../lib/icones'
import { STATUTS_PROCEDURE } from '../../../lib/procedures'
import { dates } from '../../../lib/utils'

/** RF-017 / UC-07 : référentiel des procédures. */
export default function ProceduresAdmin() {
  const { donnees, meta, chargement, erreur, filtres, filtrer, allerPage } = useListe('/admin/procedures', { q: '', statut: '', categorie: '' })
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  return (
    <>
      <EnTetePage
        surtitre="Administration"
        titre="Procédures"
        description="Rédigez les fiches, définissez les pièces et les étapes, puis publiez-les pour les rendre visibles aux citoyens."
        actions={<Bouton vers="/espace/admin/procedures/nouvelle" icone={FilePlus2}>Nouvelle procédure</Bouton>}
      />

      <div className="carte overflow-hidden">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_13rem_13rem] sm:p-5">
          <Champ icone={Search} placeholder="Rechercher une procédure…" value={filtres.q} onChange={(e) => filtrer({ q: e.target.value })} aria-label="Rechercher une procédure" />
          <Selecteur value={filtres.categorie} onChange={(e) => filtrer({ categorie: e.target.value })} aria-label="Catégorie">
            <option value="">Toutes les catégories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </Selecteur>
          <Selecteur value={filtres.statut} onChange={(e) => filtrer({ statut: e.target.value })} aria-label="Statut">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUTS_PROCEDURE).map(([v, s]) => <option key={v} value={v}>{s.libelle}</option>)}
          </Selecteur>
        </div>

        {erreur ? (
          <div className="p-6"><Alerte type="erreur">{erreur.message}</Alerte></div>
        ) : !chargement && donnees.length === 0 ? (
          <EtatVide
            icone={FileText}
            titre="Aucune procédure"
            description="Aucune procédure ne correspond à ces critères."
            action={<Bouton vers="/espace/admin/procedures/nouvelle" variante="secondaire" icone={FilePlus2}>Créer une procédure</Bouton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Procédure</th>
                  <th scope="col" className="hidden px-5 py-3 md:table-cell">Service compétent</th>
                  <th scope="col" className="hidden px-5 py-3 lg:table-cell">Pièces</th>
                  <th scope="col" className="px-5 py-3">Statut</th>
                  <th scope="col" className="hidden px-5 py-3 lg:table-cell">Modifiée</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargement
                  ? Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-5 py-4"><Squelette className="h-9" /></td></tr>)
                  : donnees.map((p) => {
                      const Icone = iconeCategorie(p.categorie?.icone)
                      const statut = STATUTS_PROCEDURE[p.statut]
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icone className="size-4" aria-hidden /></span>
                              <div className="min-w-0">
                                <Link to={`/espace/admin/procedures/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">{p.titre}</Link>
                                <p className="text-xs text-slate-500">{p.categorie?.nom}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-5 py-3.5 text-slate-600 md:table-cell">{p.service?.nom ?? '—'}</td>
                          <td className="hidden px-5 py-3.5 text-slate-600 lg:table-cell">{p.pieces_count}</td>
                          <td className="px-5 py-3.5"><Badge className={statut.classe} point={statut.point}>{statut.libelle}</Badge></td>
                          <td className="hidden px-5 py-3.5 text-slate-500 lg:table-cell">{dates.relative(p.updated_at)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1">
                              {p.statut === 'publiee' && (
                                <a href={`/procedures/${p.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Voir la fiche publique" aria-label={`Voir la fiche publique de ${p.titre}`}>
                                  <ExternalLink className="size-4" />
                                </a>
                              )}
                              <Link to={`/espace/admin/procedures/${p.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Modifier" aria-label={`Modifier ${p.titre}`}>
                                <Pencil className="size-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={allerPage} />
      </div>
    </>
  )
}
