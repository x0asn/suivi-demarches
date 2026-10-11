import { STATUTS_DOCUMENT, STATUTS_DOSSIER } from '../../lib/dossiers'
import { cx } from '../../lib/utils'
import { Badge } from '../ui'

export function BadgeStatut({ statut, className }) {
  const s = STATUTS_DOSSIER[statut]
  if (!s) return null
  return <Badge className={cx(s.classe, className)} point={s.point}>{s.libelle}</Badge>
}

export function BadgeDocument({ statut }) {
  const s = STATUTS_DOCUMENT[statut]
  return <Badge className={s.classe} point={s.point}>{s.libelle}</Badge>
}
