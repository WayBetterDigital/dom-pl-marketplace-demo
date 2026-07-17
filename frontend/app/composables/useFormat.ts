export function useFormat() {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
      useGrouping: 'always'
    }).format(price)

  const formatArea = (area: number) =>
    new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(area)

  const plural = (n: number, one: string, few: string, many: string) => {
    if (n === 1) return one
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few
    return many
  }

  return { formatPrice, formatArea, plural }
}
