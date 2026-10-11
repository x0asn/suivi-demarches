import { Mail, Pencil, Phone, Power, Search, UserPlus, UserRound, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Alerte,
  Avatar,
  Badge,
  Bouton,
  Champ,
  ChampMotDePasse,
  EnTetePage,
  EtatVide,
  Modale,
  Pagination,
  Selecteur,
  Squelette,
} from '../../../components/ui'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { useListe } from '../../../hooks/useListe'
import { api } from '../../../lib/api'
import { LISTE_ROLES, ROLES } from '../../../lib/roles'
import { cx, dates } from '../../../lib/utils'

function FormulaireUtilisateur({ utilisateur, onFermer, onEnregistre }) {
  const toast = useToast()
  const edition = Boolean(utilisateur)
  const [champs, setChamps] = useState({
    prenom: utilisateur?.prenom ?? '',
    nom: utilisateur?.nom ?? '',
    email: utilisateur?.email ?? '',
    telephone: utilisateur?.telephone ?? '',
    role: utilisateur?.role ?? 'agent',
    service_id: utilisateur?.service_id ?? '',
    password: '',
  })
  const [services, setServices] = useState([])

  useEffect(() => {
    api('/admin/services').then((r) => setServices(r.data)).catch(() => {})
  }, [])
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const modifier = (e) => setChamps((c) => ({ ...c, [e.target.name]: e.target.value }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      const corps = { ...champs, telephone: champs.telephone || null, service_id: champs.role === 'agent' && champs.service_id ? Number(champs.service_id) : null }
      const r = edition
        ? await api(`/admin/users/${utilisateur.id}`, {
            method: 'PATCH',
            body: { prenom: corps.prenom, nom: corps.nom, telephone: corps.telephone, role: corps.role, service_id: corps.service_id },
          })
        : await api('/admin/users', { method: 'POST', body: corps })
      toast.succes(r.message)
      onEnregistre(r.data)
    } catch (err) {
      setErreur(err)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={edition ? 'Modifier le compte' : 'Nouveau compte'}
      description={edition ? utilisateur.email : 'Créez un compte agent, responsable ou administrateur.'}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton type="submit" form="form-utilisateur" chargement={envoi}>
            {edition ? 'Enregistrer' : 'Créer le compte'}
          </Bouton>
        </>
      }
    >
      <form id="form-utilisateur" onSubmit={soumettre} className="grid gap-5" noValidate>
        {erreur && erreur.status !== 422 && <Alerte type="erreur">{erreur.message}</Alerte>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ label="Prénom" name="prenom" icone={UserRound} value={champs.prenom} onChange={modifier} erreur={erreur?.champ('prenom')} obligatoire />
          <Champ label="Nom" name="nom" value={champs.nom} onChange={modifier} erreur={erreur?.champ('nom')} obligatoire />
        </div>
        {!edition && (
          <Champ label="Adresse e-mail" name="email" type="email" icone={Mail} value={champs.email} onChange={modifier} erreur={erreur?.champ('email')} obligatoire />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ label="Téléphone" name="telephone" icone={Phone} value={champs.telephone} onChange={modifier} erreur={erreur?.champ('telephone')} />
          <Selecteur label="Rôle" name="role" value={champs.role} onChange={modifier} erreur={erreur?.champ('role')} obligatoire>
            {LISTE_ROLES.map((r) => (
              <option key={r.valeur} value={r.valeur}>
                {r.libelle}
              </option>
            ))}
          </Selecteur>
        </div>
        {champs.role === 'agent' && (
          <Selecteur
            label="Service de rattachement"
            name="service_id"
            value={champs.service_id}
            onChange={modifier}
            erreur={erreur?.champ('service_id')}
            aide="L'agent ne verra que les dossiers des procédures de ce service (règle RG-006)."
          >
            <option value="">Aucun service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </Selecteur>
        )}
        {!edition && (
          <ChampMotDePasse
            label="Mot de passe provisoire"
            name="password"
            autoComplete="new-password"
            value={champs.password}
            onChange={modifier}
            erreur={erreur?.champ('password')}
            aide="À communiquer à la personne, qui pourra le changer depuis son profil."
            obligatoire
          />
        )}
      </form>
    </Modale>
  )
}

function ConfirmationStatut({ utilisateur, onFermer, onConfirme }) {
  const toast = useToast()
  const [envoi, setEnvoi] = useState(false)
  const desactiver = utilisateur.actif

  const confirmer = async () => {
    setEnvoi(true)
    try {
      const r = await api(`/admin/users/${utilisateur.id}`, { method: 'PATCH', body: { actif: !desactiver } })
      toast.succes(desactiver ? 'Le compte est désactivé et ses sessions ont été fermées.' : 'Le compte est de nouveau actif.', r.message)
      onConfirme(r.data)
    } catch (err) {
      toast.erreur(err.message)
      onFermer()
    }
  }

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre={desactiver ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>
            Annuler
          </Bouton>
          <Bouton variante={desactiver ? 'danger' : 'primaire'} onClick={confirmer} chargement={envoi}>
            {desactiver ? 'Désactiver' : 'Réactiver'}
          </Bouton>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        {desactiver ? (
          <>
            <b className="font-semibold text-slate-900">{utilisateur.nom_complet}</b> sera immédiatement déconnecté et ne pourra
            plus ouvrir de session. Ses dossiers et son historique sont conservés.
          </>
        ) : (
          <>
            <b className="font-semibold text-slate-900">{utilisateur.nom_complet}</b> pourra de nouveau se connecter à la plateforme.
          </>
        )}
      </p>
    </Modale>
  )
}

/** RF-018 / UC-10 : administration des utilisateurs et des rôles. */
export default function Utilisateurs() {
  const { utilisateur: moi } = useAuth()
  const { donnees, setDonnees, meta, chargement, erreur, filtres, filtrer, allerPage, recharger } = useListe('/admin/users', {
    q: '',
    role: '',
    actif: '',
  })
  const [formulaire, setFormulaire] = useState(null) // null | 'nouveau' | utilisateur
  const [aConfirmer, setAConfirmer] = useState(null)

  const remplacer = (u) => setDonnees((liste) => liste.map((x) => (x.id === u.id ? u : x)))

  return (
    <>
      <EnTetePage
        surtitre="Administration"
        titre="Utilisateurs et rôles"
        description="Créez les comptes des agents, attribuez les rôles et contrôlez l'accès à la plateforme."
        actions={
          <Bouton icone={UserPlus} onClick={() => setFormulaire('nouveau')}>
            Nouveau compte
          </Bouton>
        }
      />

      <div className="carte overflow-hidden">
        {/* Filtres */}
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_12rem_12rem] sm:p-5">
          <Champ
            icone={Search}
            placeholder="Rechercher par nom ou e-mail…"
            value={filtres.q}
            onChange={(e) => filtrer({ q: e.target.value })}
            aria-label="Rechercher un utilisateur"
          />
          <Selecteur value={filtres.role} onChange={(e) => filtrer({ role: e.target.value })} aria-label="Filtrer par rôle">
            <option value="">Tous les rôles</option>
            {LISTE_ROLES.map((r) => (
              <option key={r.valeur} value={r.valeur}>
                {r.libelle}
              </option>
            ))}
          </Selecteur>
          <Selecteur value={filtres.actif} onChange={(e) => filtrer({ actif: e.target.value })} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            <option value="1">Actifs</option>
            <option value="0">Désactivés</option>
          </Selecteur>
        </div>

        {erreur ? (
          <div className="p-6">
            <Alerte type="erreur" titre="La liste n'a pas pu être chargée">
              {erreur.message}{' '}
              <button onClick={recharger} className="font-semibold underline">
                Réessayer
              </button>
            </Alerte>
          </div>
        ) : !chargement && donnees.length === 0 ? (
          <EtatVide icone={Users} titre="Aucun utilisateur trouvé" description="Modifiez votre recherche ou vos filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Utilisateur</th>
                  <th scope="col" className="px-5 py-3">Rôle</th>
                  <th scope="col" className="hidden px-5 py-3 md:table-cell">Dernière connexion</th>
                  <th scope="col" className="px-5 py-3">Statut</th>
                  <th scope="col" className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargement
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-4" colSpan={5}><Squelette className="h-9 w-full" /></td>
                      </tr>
                    ))
                  : donnees.map((u) => {
                      const role = ROLES[u.role]
                      const soiMeme = u.id === moi.id
                      return (
                        <tr key={u.id} className={cx('transition-colors hover:bg-slate-50/60', !u.actif && 'opacity-60')}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar prenom={u.prenom} nom={u.nom} taille="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">
                                  {u.nom_complet} {soiMeme && <span className="text-xs font-normal text-slate-400">(vous)</span>}
                                </p>
                                <p className="truncate text-slate-500">{u.email}{u.region && ` · ${u.region}`}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge className={role?.couleur}>{role?.libelle}</Badge>
                            {u.service && <p className="mt-1 max-w-[14rem] truncate text-xs text-slate-500">{u.service.nom}</p>}
                          </td>
                          <td className="hidden px-5 py-3.5 text-slate-500 md:table-cell">
                            {u.derniere_connexion_at ? dates.relative(u.derniere_connexion_at) : 'Jamais'}
                          </td>
                          <td className="px-5 py-3.5">
                            {u.actif ? (
                              <Badge className="bg-brand-50 text-brand-800 ring-brand-200" point="bg-brand-500">Actif</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 ring-slate-200" point="bg-slate-400">Désactivé</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setFormulaire(u)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                aria-label={`Modifier ${u.nom_complet}`}
                                title="Modifier"
                              >
                                <Pencil className="size-4" />
                              </button>
                              {!soiMeme && (
                                <button
                                  onClick={() => setAConfirmer(u)}
                                  className={cx('rounded-lg p-2', u.actif ? 'text-slate-500 hover:bg-red-50 hover:text-red-600' : 'text-brand-600 hover:bg-brand-50')}
                                  aria-label={u.actif ? `Désactiver ${u.nom_complet}` : `Réactiver ${u.nom_complet}`}
                                  title={u.actif ? 'Désactiver' : 'Réactiver'}
                                >
                                  <Power className="size-4" />
                                </button>
                              )}
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

      {formulaire && (
        <FormulaireUtilisateur
          utilisateur={formulaire === 'nouveau' ? null : formulaire}
          onFermer={() => setFormulaire(null)}
          onEnregistre={(u) => {
            if (formulaire === 'nouveau') recharger()
            else remplacer(u)
            setFormulaire(null)
          }}
        />
      )}

      {aConfirmer && (
        <ConfirmationStatut
          utilisateur={aConfirmer}
          onFermer={() => setAConfirmer(null)}
          onConfirme={(u) => {
            remplacer(u)
            setAConfirmer(null)
          }}
        />
      )}
    </>
  )
}
