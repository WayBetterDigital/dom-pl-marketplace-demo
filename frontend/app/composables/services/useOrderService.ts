import { useMedusaClient } from '#imports'

export function useOrderService() {
  const sdk = useMedusaClient()

  async function getOrder(orderId: string) {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields: '+items,+items.variant,+items.variant.product,+payment_collections,+payment_collections.payment_sessions',
    })
    return order
  }

  return { getOrder }
}
