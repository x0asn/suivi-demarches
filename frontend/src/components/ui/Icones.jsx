import { createElement } from 'react'
import { iconeCategorie, iconeService } from '../../lib/icones'

/** Icône d'une catégorie de procédure, à partir du nom stocké en base. */
export function IconeCategorie({ nom, ...props }) {
  return createElement(iconeCategorie(nom), { 'aria-hidden': true, ...props })
}

/** Icône d'un type de service administratif. */
export function IconeService({ type, ...props }) {
  return createElement(iconeService(type), { 'aria-hidden': true, ...props })
}
