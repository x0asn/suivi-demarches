import { AlarmClock, CheckCircle2, Download, FileStack, Gauge, Hourglass, MessageSquareWarning, Table2, Timer, UsersRound, LineChart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GraphiqueBarres, GraphiqueCourbes } from '../../components/statistiques/Graphiques'
import { Alerte, EnTetePage, Selecteur, Squelette } from '../../components/ui'
import { api } from '../../lib/api'
import { STATUTS_DOSSIER } from '../../lib/dossiers'
import { cx, dates, nombre } from '../../lib/utils'

const VERT = '#1d7a52'
const OR = '#d4a12f'

const PERIODES = [
  { valeur: '1', libelle: '30 derniers jours' },
  { valeur: '3', libelle: '3 derniers mois' },
  { valeur: '6', libelle: '6 derniers mois' },
  { valeur: '12', libelle: '12 derniers mois' },
]

function debutPeriode(mois) {
  const d = new Date()
  if (mois === '1') d.setDate(d.getDate() - 30)
  else {
    d.setMonth(d.getMonth() - Number(mois))
    d.setDate(1)
  }
  return d.toISOString().slice(0, 10)
}

function Indicateur({ icone: Icone, libelle, valeur, aide }) {
  return (
    <div className="carte p-5">
      <p className="flex items-center gap-2 text-sm text-slate-500"><Icone className="size-4 text-brand-600" aria-hidden /> {libelle}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-slate-900">{valeur ?? '—'}</p>
      {aide && <p className="mt-1 text-xs text-slate-500">{aide}</p>}
    </div>
  )
}

function Bloc({ titre, sousTitre, children, actions, className }) {
  return (
    <section className={cx('carte p-6', className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{titre}</h2>
          {sousTitre && <p className="mt-0.5 text-sm text-slate-500">{sousTitre}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

function BasculeTableau({ tableau, onChange }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium" role="group" aria-label="Affichage">
      {[[false, LineChart, 'Graphique'], [true, Table2, 'Tableau']].map(([v, Icone, l]) => (
        <button key={l} onClick={() => onChange(v)} aria-pressed={tableau === v} className={cx('flex items-center gap-1 rounded-md px-2.5 py-1', tableau === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
          <Icone className="size-3.5" aria-hidden /> {l}
        </button>
      ))}
    </div>
  )
}

function exporterCsv(stats) {
  const lignes = [
    ['Indicateur', 'Valeur'],
    ...Object.entries(stats.indicateurs).map(([k, v]) => [k, v ?? '']),
    [],
    ['Mois', 'Déposés', 'Décisions favorables', 'Décisions défavorables'],
    ...stats.evolution.map((m) => [m.libelle, m.deposes, m.favorables, m.defavorables]),
    [],
    ['Procédure', 'Dossiers', 'Délai moyen (j)', 'Délai indicatif (j)'],
    ...stats.par_procedure.map((p) => [p.procedure, p.total, p.delai_moyen_jours ?? '', p.delai_indicatif ?? '']),
    [],
    ['Service', 'Dossiers', 'En cours', 'En retard', 'Délai moyen (j)'],
    ...stats.par_service.map((s) => [s.service, s.total, s.en_cours, s.en_retard, s.delai_moyen_jours ?? '']),
    [],
    ['Région', 'Dossiers'],
    ...(stats.par_region ?? []).map((r) => [r.region, r.total]),
  ]
  const csv = lignes.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  lien.download = `statistiques-${stats.periode.du}-${stats.periode.au}.csv`
  lien.click()
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000)
}

/** RF-019 / UC-08 : indicateurs filtrables par période, service et statut. */
export default function Statistiques() {
  const [filtres, setFiltres] = useState({ periode: '6', service: '', statut: '' })
  const [stats, setStats] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [tableauEvolution, setTableauEvolution] = useState(false)
  const [tableauProcedures, setTableauProcedures] = useState(false)

  useEffect(() => {
    const controleur = new AbortController()
    api('/statistics', { params: { du: debutPeriode(filtres.periode), service: filtres.service, statut: filtres.statut }, signal: controleur.signal })
      .then((r) => {
        setStats(r.data)
        setErreur(null)
      })
      .catch((e) => e.name !== 'AbortError' && setErreur(e))
      .finally(() => !controleur.signal.aborted && setChargement(false))
    return () => controleur.abort()
  }, [filtres])

  const filtrer = (c) => {
    setChargement(true)
    setFiltres((f) => ({ ...f, ...c }))
  }

  const ind = stats?.indicateurs
  const evolution = stats?.evolution.map((m) => ({ ...m, decisions: m.favorables + m.defavorables })) ?? []

  return (
    <>
      <EnTetePage
        surtitre="Pilotage"
        titre="Statistiques"
        description="Volumes, délais et décisions, calculés en temps réel à partir des dossiers enregistrés."
        actions={stats && (
          <button onClick={() => exporterCsv(stats)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Download className="size-4" aria-hidden /> Exporter (CSV)
          </button>
        )}
      />

      {/* Filtres : une seule rangée au-dessus des graphiques */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Selecteur value={filtres.periode} onChange={(e) => filtrer({ periode: e.target.value })} aria-label="Période">
          {PERIODES.map((p) => <option key={p.valeur} value={p.valeur}>{p.libelle}</option>)}
        </Selecteur>
        <Selecteur value={filtres.service} onChange={(e) => filtrer({ service: e.target.value })} aria-label="Service">
          <option value="">Tous les services</option>
          {stats?.services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </Selecteur>
        <Selecteur value={filtres.statut} onChange={(e) => filtrer({ statut: e.target.value })} aria-label="Statut">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS_DOSSIER).filter(([k]) => k !== 'brouillon').map(([k, s]) => <option key={k} value={k}>{s.libelle}</option>)}
        </Selecteur>
      </div>

      {erreur && <Alerte type="erreur" className="mb-6">{erreur.message}</Alerte>}

      {!stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Squelette key={i} className="h-28 rounded-2xl" />)}</div>
      ) : (
        <div className={cx('space-y-6 transition-opacity', chargement && 'opacity-60')}>
          <p className="text-sm text-slate-500">Dossiers déposés du <b className="font-medium text-slate-700">{dates.longue(stats.periode.du)}</b> au <b className="font-medium text-slate-700">{dates.longue(stats.periode.au)}</b>.</p>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Indicateur icone={FileStack} libelle="Dossiers déposés" valeur={nombre(ind.deposes)} aide={`${nombre(ind.citoyens)} citoyens distincts`} />
            <Indicateur icone={Hourglass} libelle="En cours" valeur={nombre(ind.en_cours)} aide="Y compris en attente du citoyen" />
            <Indicateur icone={CheckCircle2} libelle="Taux de validation" valeur={ind.taux_validation !== null ? `${String(ind.taux_validation).replace('.', ',')} %` : '—'} aide={`${ind.favorables} favorables · ${ind.defavorables} défavorables`} />
            <Indicateur icone={Timer} libelle="Délai moyen de décision" valeur={ind.delai_moyen_jours !== null ? `${String(ind.delai_moyen_jours).replace('.', ',')} j` : '—'} aide="De la soumission à la décision" />
            <Indicateur icone={Gauge} libelle="Délais respectés" valeur={ind.respect_delai !== null ? `${String(ind.respect_delai).replace('.', ',')} %` : '—'} aide="Décisions rendues dans le délai indicatif" />
            <Indicateur icone={AlarmClock} libelle="Dossiers en retard" valeur={nombre(ind.en_retard)} aide="Délai indicatif dépassé" />
            <Indicateur icone={UsersRound} libelle="Décisions rendues" valeur={nombre(ind.decisions)} />
            <Indicateur icone={MessageSquareWarning} libelle="Réclamations ouvertes" valeur={nombre(ind.reclamations_ouvertes)} />
          </div>

          <Bloc
            titre="Évolution mensuelle"
            sousTitre="Dossiers déposés et décisions rendues chaque mois"
            actions={<BasculeTableau tableau={tableauEvolution} onChange={setTableauEvolution} />}
          >
            {tableauEvolution ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="py-2 pr-4">Mois</th><th className="py-2 pr-4 text-right">Déposés</th><th className="py-2 pr-4 text-right">Favorables</th><th className="py-2 text-right">Défavorables</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {stats.evolution.map((m) => (
                      <tr key={m.mois}><td className="py-2 pr-4 text-slate-700">{m.libelle}</td><td className="py-2 pr-4 text-right font-medium text-slate-900">{m.deposes}</td><td className="py-2 pr-4 text-right">{m.favorables}</td><td className="py-2 text-right">{m.defavorables}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <GraphiqueCourbes
                donnees={evolution}
                libelleAxe="Évolution mensuelle des dépôts et des décisions"
                series={[
                  { cle: 'deposes', libelle: 'Dossiers déposés', couleur: VERT, aire: true },
                  { cle: 'decisions', libelle: 'Décisions rendues', couleur: OR },
                ]}
              />
            )}
          </Bloc>

          <div className="grid gap-6 lg:grid-cols-2">
            <Bloc titre="Répartition par statut" sousTitre="Statut actuel des dossiers déposés sur la période">
              <GraphiqueBarres
                libelle="Nombre de dossiers par statut"
                donnees={stats.par_statut.filter((s) => s.total > 0).sort((a, b) => b.total - a.total).map((s) => ({ libelle: s.libelle, valeur: s.total }))}
              />
            </Bloc>

            <Bloc
              titre="Procédures les plus demandées"
              sousTitre="Nombre de dossiers par procédure"
              actions={<BasculeTableau tableau={tableauProcedures} onChange={setTableauProcedures} />}
            >
              {tableauProcedures ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="py-2 pr-3">Procédure</th><th className="py-2 pr-3 text-right">Dossiers</th><th className="py-2 pr-3 text-right">Délai moyen</th><th className="py-2 text-right">Indicatif</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {stats.par_procedure.map((p) => (
                        <tr key={p.procedure}>
                          <td className="py-2 pr-3 text-slate-700">{p.procedure}</td>
                          <td className="py-2 pr-3 text-right font-medium text-slate-900">{p.total}</td>
                          <td className={cx('py-2 pr-3 text-right', p.delai_moyen_jours > p.delai_indicatif && 'font-semibold text-red-700')}>{p.delai_moyen_jours !== null ? `${p.delai_moyen_jours} j` : '—'}</td>
                          <td className="py-2 text-right text-slate-500">{p.delai_indicatif !== null ? `${p.delai_indicatif} j` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <GraphiqueBarres
                  libelle="Nombre de dossiers par procédure"
                  donnees={stats.par_procedure.slice(0, 8).map((p) => ({
                    libelle: p.procedure,
                    valeur: p.total,
                    detail: `Délai moyen ${p.delai_moyen_jours ?? '—'} j · indicatif ${p.delai_indicatif ?? '—'} j`,
                  }))}
                />
              )}
            </Bloc>
          </div>

          {stats.par_region?.length > 0 && (
            <Bloc titre="Origine des demandes" sousTitre="Nombre de dossiers selon la région de résidence déclarée par le citoyen">
              <GraphiqueBarres
                libelle="Nombre de dossiers par région"
                donnees={stats.par_region.map((r) => ({
                  libelle: r.region,
                  valeur: r.total,
                  detail: `${Math.round((100 * r.total) / Math.max(1, ind.deposes))} % des demandes`,
                }))}
              />
            </Bloc>
          )}

          <Bloc titre="Activité par service" sousTitre="Charge et délais de chaque service administratif">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Service</th>
                    <th className="px-3 py-2.5 text-right">Dossiers</th>
                    <th className="px-3 py-2.5 text-right">En cours</th>
                    <th className="px-3 py-2.5 text-right">En retard</th>
                    <th className="px-3 py-2.5 text-right">Délai moyen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {stats.par_service.map((s) => (
                    <tr key={s.service} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-medium text-slate-800">{s.service}</td>
                      <td className="px-3 py-2.5 text-right text-slate-900">{s.total}</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">{s.en_cours}</td>
                      <td className="px-3 py-2.5 text-right">
                        {s.en_retard > 0 ? <span className="inline-flex items-center gap-1 font-semibold text-red-700"><AlarmClock className="size-3.5" aria-hidden />{s.en_retard}</span> : <span className="text-slate-400">0</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">{s.delai_moyen_jours !== null ? `${String(s.delai_moyen_jours).replace('.', ',')} j` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bloc>
        </div>
      )}
    </>
  )
}
