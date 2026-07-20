export const useNavbarLinks = () => {
  return ref([
    {
      name: 'Artykuły i newsy',
      path: '/artykuly',
      icon: '/svgs/article-news-white.svg'
    },
    {
      name: 'Projekty domów',
      path: '/',
      icon: '/svgs/home-designs-white.svg'
    },
    {
      name: 'Ogłoszenia',
      path: '/ogloszenia',
      icon: '/svgs/listings-white.svg'
    }
  ])
}
