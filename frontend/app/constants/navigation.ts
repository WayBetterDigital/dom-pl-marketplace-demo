export interface NavLink {
  name: string
  path: string
}

/** Główna nawigacja marketplace (navbar + menu mobilne) */
export const mainNavLinks: NavLink[] = [
  { name: 'Projekty domów', path: '' },
  { name: 'Nowości', path: '' },
  { name: 'Popularne', path: '' },
  { name: 'Promocje', path: '' }
]

/** Linki drugorzędne (górny pasek + menu mobilne) */
export const secondaryNavLinks: NavLink[] = [
  { name: 'Współpraca', path: '' },
  { name: 'Reklama', path: '' },
  { name: 'Kontakt', path: '' }
]
