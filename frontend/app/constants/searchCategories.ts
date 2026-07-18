export interface SearchCategory {
  name: string
  /** Link do listingu; puste = jeszcze niewpięte (brak dopasowania do filtra backendu) */
  to: string
}

export const searchCategoryColumns: SearchCategory[][] = [
  [
    { name: '2-pokojowych', to: '/produkty?rooms=2' },
    { name: '3-pokojowych', to: '/produkty?rooms=3' },
    { name: '4-pokojowych', to: '/produkty?rooms=4' },
    { name: '5-pokojowych i większych', to: '/produkty?rooms=5' },
    { name: 'bliźniaczych (Bliźniaki)', to: '' },
    { name: 'dwurodzinnych', to: '' },
    { name: 'jednorodzinnych', to: '/produkty?houseType=jednorodzinny' },
    { name: 'małych (do 100 m²)', to: '/produkty?maxArea=100' },
    { name: 'dużych (powyżej 150 m²)', to: '/produkty?minArea=150' },
    { name: 'średnich (100-150 m²)', to: '/produkty?minArea=100&maxArea=150' },
    { name: 'szeregowych (Szeregowce)', to: '' },
    { name: 'wielorodzinnych', to: '' }
  ],
  [
    { name: 'bez piwnicy', to: '/produkty?basement=brak' },
    { name: 'na wąską działkę', to: '' },
    { name: 'na zgłoszenie (do 70 m²)', to: '/produkty?maxArea=70' },
    { name: 'parterowych', to: '/produkty?floors=1' },
    { name: 'podpiwniczonych', to: '' },
    { name: 'z dachem dwuspadowym', to: '' },
    { name: 'z dachem kopertowym (wielospadowym)', to: '' },
    { name: 'z dachem płaskim', to: '' },
    { name: 'z poddaszem użytkowym', to: '' },
    { name: 'z poddaszem do adaptacji', to: '' },
    { name: 'piętrowych', to: '/produkty?floors=2' },
    { name: 'bez garażu', to: '/produkty?garage=brak' }
  ],
  [
    { name: 'z garażem jednostanowiskowym', to: '' },
    { name: 'z garażem dwustanowiskowym', to: '' },
    { name: 'z garażem w piwnicy', to: '' },
    { name: 'z wiatą garażową', to: '' },
    { name: 'drewnianych', to: '' },
    { name: 'murowanych', to: '' },
    { name: 'szkieletowych (Kanadyjskie)', to: '' },
    { name: 'z bali', to: '' },
    { name: 'z prefabrykatów', to: '' },
    { name: 'energooszczędnych', to: '/produkty?energyStandard=energooszczędny' },
    { name: 'klasycznych (Tradycyjnych)', to: '' },
    { name: 'nowoczesnych', to: '/produkty?architecturalStyle=nowoczesny' }
  ]
]
