/** Les 14 régions administratives du Sénégal (la liste fait aussi foi côté serveur). */
export const REGIONS = [
  'Dakar',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Thiès',
  'Ziguinchor',
]

export const localisation = (u) => [u?.commune, u?.region].filter(Boolean).join(', ')
