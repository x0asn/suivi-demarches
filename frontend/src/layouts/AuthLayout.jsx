import { ShieldCheck } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import monument from '../assets/images/monument-renaissance.jpg'
import { Chargement, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'

/** Mise en page des écrans d'authentification : formulaire à gauche, visuel à droite. */
export default function AuthLayout() {
  const { utilisateur, chargement } = useAuth()

  if (chargement) return <Chargement plein />
  if (utilisateur) return <Navigate to="/espace" replace />

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-10 lg:flex-none lg:basis-[52%] xl:px-20">
        <Logo />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-apparition">
            <Outlet />
          </div>
        </main>
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="size-4 text-brand-600" aria-hidden />
          Connexion sécurisée — vos données sont protégées et ne sont visibles que par les agents habilités.
        </p>
      </div>

      <aside className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden>
        <img src={monument} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-brand-950/10" />
        <div className="motif-senegal absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-12 xl:p-16">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-or-200 ring-1 ring-white/20 backdrop-blur">
              <span className="size-1.5 rounded-full bg-or-400" /> Service public numérique
            </span>
            <p className="mt-6 font-display text-3xl leading-snug text-white xl:text-4xl">
              « Du dépôt de la demande à sa résolution : rendre la procédure compréhensible, traçable et accessible. »
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-white">
              {[
                ['24h/24', 'Accès à vos dossiers'],
                ['100 %', 'Traçabilité des étapes'],
                ['0', 'Déplacement inutile'],
              ].map(([chiffre, legende]) => (
                <div key={legende}>
                  <p className="font-display text-2xl font-semibold text-or-300">{chiffre}</p>
                  <p className="mt-1 text-xs text-brand-100/80">{legende}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
