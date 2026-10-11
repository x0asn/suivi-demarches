import { LayoutDashboard, Menu, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { DrapeauSenegal, LisereSenegal } from '../components/ui/Senegal'
import { Bouton, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useLienSuivi } from '../hooks/useLienSuivi'
import { cx } from '../lib/utils'

function EnTete() {
  const { utilisateur } = useAuth()
  const suivi = useLienSuivi()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [defile, setDefile] = useState(false)

  const liens = [
    { vers: '/', libelle: 'Accueil', exact: true },
    { vers: '/procedures', libelle: 'Procédures' },
    { vers: suivi.vers, state: suivi.state, libelle: 'Suivre un dossier', suivi: true },
  ]

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 8)
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [])

  const classeLien = ({ isActive }, l) =>
    cx(
      'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
      isActive && !l.suivi ? 'text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    )

  return (
    <header
      className={cx(
        'sticky top-0 z-40 border-b transition-colors duration-300',
        defile || menuOuvert ? 'border-slate-200/80 bg-white/90 backdrop-blur-lg' : 'border-transparent bg-white',
      )}
    >
      <LisereSenegal />
      <div className="conteneur flex h-16 items-center justify-between gap-6 lg:h-18">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {liens.map((l) => (
            <NavLink key={l.libelle} to={l.vers} state={l.state} end={l.exact} className={(etat) => classeLien(etat, l)}>
              {l.libelle}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {utilisateur ? (
            <Bouton vers="/espace" icone={LayoutDashboard}>Mon espace</Bouton>
          ) : (
            <>
              <Bouton vers="/connexion" variante="fantome">Connexion</Bouton>
              <Bouton vers="/inscription">Créer un compte</Bouton>
            </>
          )}
        </div>

        <button
          className="-mr-2 rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setMenuOuvert((o) => !o)}
          aria-expanded={menuOuvert}
          aria-controls="menu-mobile"
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {menuOuvert ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOuvert && (
        <div id="menu-mobile" className="border-t border-slate-100 bg-white lg:hidden">
          <nav
            className="conteneur flex flex-col gap-1 py-4"
            aria-label="Navigation mobile"
            onClick={(e) => e.target.closest('a') && setMenuOuvert(false)}
          >
            {liens.map((l) => (
              <Link key={l.libelle} to={l.vers} state={l.state} className="rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
                {l.libelle}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-4">
              {utilisateur ? (
                <Bouton vers="/espace" icone={LayoutDashboard}>Mon espace</Bouton>
              ) : (
                <>
                  <Bouton vers="/inscription">Créer un compte</Bouton>
                  <Bouton vers="/connexion" variante="secondaire">Connexion</Bouton>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function PiedDePage() {
  const { utilisateur } = useAuth()
  const suivi = useLienSuivi()
  const lien = 'text-sm text-slate-600 transition-colors hover:text-brand-800'

  return (
    <footer className="bg-slate-50">
      <LisereSenegal />
      <div className="conteneur grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
            Comprendre une procédure, déposer sa demande et suivre son dossier en ligne.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Démarches</h2>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/procedures" className={lien}>Toutes les procédures</Link></li>
            <li><Link to="/services" className={lien}>Services et points d’accueil</Link></li>
            <li><Link to="/#fonctionnement" className={lien}>Comment ça marche</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Mon compte</h2>
          <ul className="mt-4 space-y-2.5">
            <li><Link to={suivi.vers} state={suivi.state} className={lien}>Suivre un dossier</Link></li>
            {utilisateur ? (
              <li><Link to="/espace" className={lien}>Mon espace</Link></li>
            ) : (
              <>
                <li><Link to="/inscription" className={lien}>Créer un compte</Link></li>
                <li><Link to="/connexion" className={lien}>Connexion</Link></li>
                <li><Link to="/mot-de-passe-oublie" className={lien}>Mot de passe oublié</Link></li>
              </>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Confidentialité et assistance</h2>
          <p className="mt-4 flex gap-2.5 text-sm leading-relaxed text-slate-600">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
            Vos données et vos pièces justificatives ne sont consultées que par les agents habilités à traiter votre dossier.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Une question sur un dossier ? Écrivez à l’administration depuis votre dossier, ou déposez une réclamation
            depuis votre espace.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200/80">
        <div className="conteneur flex flex-col gap-1 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Suivi Démarches — Projet de fin d’études, ISEP Amadou Trawaré de Diamniadio.</p>
          <p className="flex items-center gap-2">
            <DrapeauSenegal className="h-3 w-[1.125rem]" /> Conçu à Diamniadio, Sénégal · Promo 6 · 2025–2026
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  const { hash, pathname } = useLocation()

  // Défilement vers les ancres (#fonctionnement…) ou en haut de page à chaque navigation.
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [hash, pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white [overflow-x:clip]">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Aller au contenu
      </a>
      <EnTete />
      <main id="contenu" className="flex-1">
        <Outlet />
      </main>
      <PiedDePage />
    </div>
  )
}
