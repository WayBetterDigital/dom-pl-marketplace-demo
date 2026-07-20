export interface HouseCategory {
  key: string
  label: string
  img: string
  to: string
}

/** Kategorie projektów domów prezentowane w karuzeli na stronie głównej */
export const houseCategories: HouseCategory[] = [
  {
    key: 'single-family',
    label: 'Jednorodzinnych',
    img: '/imgs/categories/single-family-houses.png',
    to: ''
  },
  {
    key: 'wooden',
    label: 'drewnianych',
    img: '/imgs/categories/wooden-houses.png',
    to: ''
  },
  {
    key: 'garage',
    label: 'z garażem',
    img: '/imgs/categories/garage-houses.png',
    to: ''
  },
  {
    key: 'no-garage',
    label: 'bez garażu',
    img: '/imgs/categories/no-garage-houses.jpg',
    to: ''
  },
  {
    key: 'multifamily',
    label: 'wielorodzinnych',
    img: '/imgs/categories/multifamily-houses.png',
    to: ''
  },
  {
    key: 'two-room',
    label: '2 - pokojowych',
    img: '/imgs/categories/two-room-houses.jpg',
    to: ''
  }
]
