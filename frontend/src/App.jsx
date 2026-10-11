import { Route, Routes } from 'react-router-dom'
import Garde from './components/auth/Garde'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import PublicLayout from './layouts/PublicLayout'
import Connexion from './pages/auth/Connexion'
import Inscription from './pages/auth/Inscription'
import MotDePasseOublie from './pages/auth/MotDePasseOublie'
import ReinitialiserMotDePasse from './pages/auth/ReinitialiserMotDePasse'
import NonTrouve from './pages/erreurs/NonTrouve'
import Journal from './pages/espace/admin/Journal'
import ModelesNotification from './pages/espace/admin/ModelesNotification'
import ServicesAdmin from './pages/espace/admin/ServicesAdmin'
import Reclamations from './pages/espace/Reclamations'
import Statistiques from './pages/espace/Statistiques'
import ProcedureEditeur from './pages/espace/admin/ProcedureEditeur'
import ProceduresAdmin from './pages/espace/admin/Procedures'
import Utilisateurs from './pages/espace/admin/Utilisateurs'
import DossierTraitement from './pages/espace/agent/DossierTraitement'
import FileTraitement from './pages/espace/agent/FileTraitement'
import DossierCitoyen from './pages/espace/citoyen/DossierCitoyen'
import MesDossiers from './pages/espace/citoyen/MesDossiers'
import NouveauDossier from './pages/espace/citoyen/NouveauDossier'
import Notifications from './pages/espace/Notifications'
import Profil from './pages/espace/Profil'
import TableauDeBord from './pages/espace/TableauDeBord'
import Accueil from './pages/public/Accueil'
import ProcedureDetail from './pages/public/ProcedureDetail'
import Procedures from './pages/public/Procedures'
import Services from './pages/public/Services'

export default function App() {
  return (
    <Routes>
      {/* Site public */}
      <Route element={<PublicLayout />}>
        <Route index element={<Accueil />} />
        <Route path="procedures" element={<Procedures />} />
        <Route path="procedures/:slug" element={<ProcedureDetail />} />
        <Route path="services" element={<Services />} />
      </Route>

      {/* Authentification (M01) */}
      <Route element={<AuthLayout />}>
        <Route path="connexion" element={<Connexion />} />
        <Route path="inscription" element={<Inscription />} />
        <Route path="mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />
      </Route>

      {/* Espace connecté */}
      <Route path="espace" element={<AppLayout />}>
        <Route index element={<TableauDeBord />} />
        <Route path="profil" element={<Profil />} />
        <Route path="notifications" element={<Notifications />} />

        {/* M03 / M04 : citoyen */}
        <Route element={<Garde roles={['citoyen']} />}>
          <Route path="dossiers" element={<MesDossiers />} />
          <Route path="dossiers/nouveau/:slug" element={<NouveauDossier />} />
          <Route path="dossiers/:id" element={<DossierCitoyen />} />
        </Route>

        {/* M07 : réclamations (citoyen, agent, administration) */}
        <Route path="reclamations" element={<Reclamations />} />

        {/* M09 : statistiques */}
        <Route element={<Garde roles={['admin', 'responsable']} />}>
          <Route path="statistiques" element={<Statistiques />} />
        </Route>

        {/* M05 : traitement */}
        <Route element={<Garde roles={['agent', 'admin', 'responsable']} />}>
          <Route path="traitement" element={<FileTraitement />} />
          <Route path="traitement/:id" element={<DossierTraitement />} />
        </Route>

        <Route path="admin" element={<Garde roles={['admin']} />}>
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="journal" element={<Journal />} />
          <Route path="procedures" element={<ProceduresAdmin />} />
          <Route path="procedures/nouvelle" element={<ProcedureEditeur />} />
          <Route path="procedures/:id" element={<ProcedureEditeur />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="notifications" element={<ModelesNotification />} />
        </Route>
      </Route>

      <Route path="*" element={<NonTrouve />} />
    </Routes>
  )
}
