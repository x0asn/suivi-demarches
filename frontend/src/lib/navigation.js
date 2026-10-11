import {
  BarChart3,
  Bell,
  BellRing,
  Building2,
  ClipboardList,
  FilePlus2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquareWarning,
  ScrollText,
  UserCircle,
  Users,
} from 'lucide-react'

/** Menu de l'espace connecté, par rôle. */
const TABLEAU = { vers: '/espace', libelle: 'Tableau de bord', icone: LayoutDashboard, exact: true }
const RECLAMATIONS = { vers: '/espace/reclamations', libelle: 'Réclamations', icone: MessageSquareWarning }
const STATISTIQUES = { vers: '/espace/statistiques', libelle: 'Statistiques', icone: BarChart3 }
const COMPTE = {
  titre: 'Mon compte',
  liens: [
    { vers: '/espace/notifications', libelle: 'Notifications', icone: Bell },
    { vers: '/espace/profil', libelle: 'Mon profil', icone: UserCircle },
  ],
}

export const NAVIGATION = {
  citoyen: [
    {
      titre: null,
      liens: [
        TABLEAU,
        { vers: '/espace/dossiers', libelle: 'Mes dossiers', icone: FolderOpen },
        { vers: '/procedures', libelle: 'Nouvelle démarche', icone: FilePlus2 },
        RECLAMATIONS,
      ],
    },
    COMPTE,
  ],
  agent: [
    {
      titre: null,
      liens: [TABLEAU, { vers: '/espace/traitement', libelle: 'File de travail', icone: ClipboardList }, RECLAMATIONS],
    },
    COMPTE,
  ],
  responsable: [
    {
      titre: 'Pilotage',
      liens: [TABLEAU, STATISTIQUES, { vers: '/espace/traitement', libelle: 'Tous les dossiers', icone: FolderOpen }, RECLAMATIONS],
    },
    COMPTE,
  ],
  admin: [
    {
      titre: 'Pilotage',
      liens: [TABLEAU, STATISTIQUES, { vers: '/espace/traitement', libelle: 'Tous les dossiers', icone: FolderOpen }, RECLAMATIONS],
    },
    {
      titre: 'Administration',
      liens: [
        { vers: '/espace/admin/utilisateurs', libelle: 'Utilisateurs', icone: Users },
        { vers: '/espace/admin/procedures', libelle: 'Procédures', icone: FileText },
        { vers: '/espace/admin/services', libelle: 'Services', icone: Building2 },
        { vers: '/espace/admin/notifications', libelle: 'Modèles de notification', icone: BellRing },
        { vers: '/espace/admin/journal', libelle: "Journal d'audit", icone: ScrollText },
      ],
    },
    COMPTE,
  ],
}
