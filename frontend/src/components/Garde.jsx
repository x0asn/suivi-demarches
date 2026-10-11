import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AccesRefuse from '../pages/erreurs/AccesRefuse'

/** Affiche la page « accès refusé » si le rôle n'est pas autorisé (le serveur vérifie aussi). */
export default function Garde({ roles }) {
  const { utilisateur } = useAuth()
  if (!roles.includes(utilisateur?.role)) return <AccesRefuse />
  return <Outlet />
}
