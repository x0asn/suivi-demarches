import { ChevronDown, ExternalLink, LogOut, Menu, UserCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Cloche from '../components/notifications/Cloche'
import { Avatar, Badge, BandeWax, Chargement, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { NAVIGATION } from '../lib/navigation'
import { ROLES } from '../lib/roles'
import { cx } from '../lib/utils'

function MenuLateral({ onNaviguer }) {
  const { utilisateur } = useAuth()
  const sections = NAVIGATION[utilisateur.role] ?? []
  const role = ROLES[utilisateur.role]

  return (
    <div className="relative flex h-full flex-col bg-brand-950 text-brand-100">
      <div className="motif-senegal pointer-events-none absolute inset-0" aria-hidden />
      <BandeWax className="absolute inset-x-0 bottom-0" />
      <div className="relative flex h-16 items-center px-5">
        <Logo clair />
      </div>

      <div className="relative mx-4 mt-2 rounded-xl bg-white/5 px-3.5 py-3 ring-1 ring-white/10">
        <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-brand-300 uppercase">Espace</p>
        <p className="mt-0.5 font-medium text-white">{role?.libelle}</p>
      </div>

      <nav className="relative mt-6 flex-1 space-y-7 overflow-y-auto px-3 pb-6" aria-label="Menu de l'espace">
        {sections.map((section, i) => (
          <div key={i}>
            {section.titre && (
              <p className="mb-2 px-3 text-[0.68rem] font-semibold tracking-[0.12em] text-brand-300/70 uppercase">{section.titre}</p>
            )}
            <ul className="space-y-0.5">
              {section.liens.map(({ vers, libelle, icone: Icone, exact, compteur }) => (
                <li key={vers}>
                  <NavLink
                    to={vers}
                    end={exact}
                    onClick={onNaviguer}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-100/80 hover:bg-white/8 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icone className={cx('size-[1.15rem] shrink-0', isActive ? 'text-brand-700' : 'text-brand-300 group-hover:text-white')} aria-hidden />
                        <span className="flex-1">{libelle}</span>
                        {compteur > 0 && (
                          <span className="rounded-full bg-or-400 px-2 py-0.5 text-xs font-semibold text-brand-950">{compteur}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/10 px-4 pb-7 pt-4">
        <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-200 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-4" aria-hidden /> Retour au site public
        </Link>
      </div>
    </div>
  )
}

function MenuUtilisateur() {
  const { utilisateur, deconnexion } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!ouvert) return
    const surClic = (e) => !ref.current?.contains(e.target) && setOuvert(false)
    const surTouche = (e) => e.key === 'Escape' && setOuvert(false)
    document.addEventListener('mousedown', surClic)
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('mousedown', surClic)
      document.removeEventListener('keydown', surTouche)
    }
  }, [ouvert])

  const seDeconnecter = async () => {
    await deconnexion()
    toast.info('À bientôt sur Suivi Démarches.', 'Vous êtes déconnecté')
    navigate('/connexion')
  }

  const role = ROLES[utilisateur.role]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="flex items-center gap-3 rounded-xl py-1.5 pr-2 pl-1.5 hover:bg-slate-100"
        aria-expanded={ouvert}
        aria-haspopup="menu"
      >
        <Avatar prenom={utilisateur.prenom} nom={utilisateur.nom} taille="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-semibold text-slate-900">{utilisateur.nom_complet}</span>
          <span className="block text-xs text-slate-500">{role?.libelle}</span>
        </span>
        <ChevronDown className="size-4 text-slate-400" aria-hidden />
      </button>

      {ouvert && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 animate-apparition overflow-hidden rounded-xl border border-slate-200 bg-white shadow-flottant">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{utilisateur.nom_complet}</p>
            <p className="truncate text-xs text-slate-500">{utilisateur.email}</p>
            <Badge className={cx('mt-2', role?.couleur)}>{role?.libelle}</Badge>
          </div>
          <div className="p-1.5">
            <Link
              role="menuitem"
              to="/espace/profil"
              onClick={() => setOuvert(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserCircle className="size-4 text-slate-400" aria-hidden /> Mon profil
            </Link>
            <button
              role="menuitem"
              onClick={seDeconnecter}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <LogOut className="size-4" aria-hidden /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout({ extrasBarre }) {
  const { utilisateur, chargement } = useAuth()
  const [menuMobile, setMenuMobile] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (chargement) return <Chargement plein texte="Ouverture de votre espace…" />
  if (!utilisateur) return <Navigate to="/connexion" replace state={{ depuis: pathname }} />

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Menu latéral fixe (ordinateur) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 lg:block">
        <MenuLateral />
      </aside>

      {/* Menu latéral coulissant (mobile) */}
      {menuMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setMenuMobile(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-apparition shadow-flottant">
            <MenuLateral onNaviguer={() => setMenuMobile(false)} />
            <button
              onClick={() => setMenuMobile(false)}
              className="absolute top-4 -right-12 rounded-lg bg-white/10 p-2 text-white"
              aria-label="Fermer le menu"
            >
              <X className="size-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-68">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-lg sm:px-6 lg:px-10">
          <button
            onClick={() => setMenuMobile(true)}
            className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-6" />
          </button>
          <Logo compact className="lg:hidden" />
          <div className="flex-1" />
          {extrasBarre}
          <Cloche />
          <MenuUtilisateur />
        </header>

        <main id="contenu" className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {/* La clé relance l'animation d'arrivée à chaque changement de page. */}
          <div key={pathname} className="animate-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
