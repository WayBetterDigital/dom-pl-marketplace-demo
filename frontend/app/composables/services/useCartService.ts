import { useMedusaClient, useCookie, useState, useRuntimeConfig } from '#imports'

const LOCAL_STORAGE_KEY = 'cart_id'

export function useCartService() {
  const sdk = useMedusaClient()
  const config = useRuntimeConfig()
  const cartIdCookie = useCookie('cart_id', { maxAge: 60 * 60 * 24 * 30 }) // 30 days
  const cart = useState('cart', () => null as any)

  const baseUrl = import.meta.server
    ? (config.medusaBaseUrl as string)
    : config.public.medusa.baseUrl
  const publishableKey = config.public.medusa.publishableKey as string

  function getStoredCartId(): string | null {
    if (cartIdCookie.value) return cartIdCookie.value
    if (import.meta.client) return localStorage.getItem(LOCAL_STORAGE_KEY)
    return null
  }

  function saveCartId(id: string | null) {
    cartIdCookie.value = id
    if (import.meta.client) {
      if (id) localStorage.setItem(LOCAL_STORAGE_KEY, id)
      else localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }

  async function getCart() {
    if (cart.value) return cart.value

    const storedId = getStoredCartId()
    if (storedId) {
      try {
        let cartData: any
        if (import.meta.server) {
          // On the server use the internal Docker URL (same pattern as useSketchService)
          const fields = '*items,*items.variant,*items.variant.product,*items.variant.product.house_plan'
          const response = await $fetch<{ cart: any }>(
            `${baseUrl}/store/carts/${storedId}?fields=${fields}`,
            { headers: { 'x-publishable-api-key': publishableKey } }
          )
          cartData = response.cart
        } else {
          const response = await sdk.store.cart.retrieve(storedId, {
            fields: '*items,*items.variant,*items.variant.product,*items.variant.product.house_plan'
          })
          cartData = response.cart
        }
        cart.value = cartData
        // Keep both storages in sync
        saveCartId(storedId)
        return cart.value
      } catch (e) {
        console.error('Failed to retrieve cart:', e)
        saveCartId(null)
      }
    }

    // Create new cart
    const regionsRes = await sdk.store.region.list()
    // Prefer PLN region if available
    const plnRegion = regionsRes.regions.find(r => r.currency_code === 'pln')
    const regionId = plnRegion?.id || regionsRes.regions[0]?.id

    if (!regionId) throw new Error("No region found")

    const { cart: newCart } = await sdk.store.cart.create({
      region_id: regionId
    })

    saveCartId(newCart.id)
    cart.value = newCart
    return newCart
  }

  const CART_FIELDS = { fields: '*items,*items.variant,*items.variant.product,*items.variant.product.house_plan' }

  async function addToCart(variantId: string, quantity = 1) {
    const currentCart = await getCart()
    const { cart: updatedCart } = await sdk.store.cart.createLineItem(
      currentCart.id,
      { variant_id: variantId, quantity },
      CART_FIELDS
    )
    cart.value = updatedCart
    return updatedCart
  }

  async function removeFromCart(lineItemId: string) {
    const currentCart = await getCart()
    const { cart: updatedCart } = await sdk.store.cart.deleteLineItem(
      currentCart.id,
      lineItemId,
      CART_FIELDS
    )
    cart.value = updatedCart
    return updatedCart
  }

  type CheckoutCustomer = { email: string; first_name: string; last_name: string }

  async function initiateStripeP24Payment(
    customer: CheckoutCustomer
  ): Promise<{ orderId: string; clientSecret: string }> {
    const currentCart = await getCart()
    if (!currentCart?.items?.length) throw new Error('Koszyk jest pusty')

    // Fetch fresh cart state to check what's already been set up from a previous attempt
    const { cart: freshCart } = await sdk.store.cart.retrieve(currentCart.id, {
      fields: '*shipping_methods,*payment_collection,*payment_collection.payment_sessions',
    })

    // 1. Set customer email and placeholder shipping address (digital delivery)
    await sdk.store.cart.update(currentCart.id, {
      email: customer.email,
      shipping_address: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        address_1: 'Dostawa cyfrowa',
        city: 'Warszawa',
        country_code: 'pl',
        postal_code: '00-000',
      },
    })

    // 2. Add shipping option only if not already present (prevents conflict on retry)
    if (!(freshCart as any)?.shipping_methods?.length) {
      const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: currentCart.id })
      if (shipping_options?.length) {
        await sdk.store.cart.addShippingMethod(currentCart.id, { option_id: shipping_options[0].id })
      }
    }

    // 3. Reuse existing P24 session if present, otherwise create a new one
    //    (prevents conflict when the user retries after a failed/abandoned attempt)
    const existingSession = (freshCart as any)?.payment_collection?.payment_sessions?.find(
      (s: any) => s.provider_id === 'pp_stripe-przelewy24_default'
    )

    let clientSecret: string | undefined
    if (existingSession?.data) {
      clientSecret = (existingSession.data as any)?.client_secret
    } else {
      const { payment_collection } = await sdk.store.payment.initiatePaymentSession(currentCart, {
        provider_id: 'pp_stripe-przelewy24_default',
      })
      const session = payment_collection?.payment_sessions?.find(
        (s: any) => s.provider_id === 'pp_stripe-przelewy24_default'
      )
      clientSecret = (session?.data as any)?.client_secret
    }

    if (!clientSecret) throw new Error('Nie udało się zainicjować płatności Stripe')

    // 4. Complete cart — creates the order with payment_status: awaiting
    //    (payment confirmed asynchronously via Stripe webhook)
    const result = await sdk.store.cart.complete(currentCart.id)
    if (result.type !== 'order' || !result.order?.id) {
      throw new Error('Nie udało się złożyć zamówienia')
    }

    saveCartId(null)
    cart.value = null

    return { orderId: result.order.id, clientSecret }
  }

  return {
    cart,
    getCart,
    addToCart,
    removeFromCart,
    initiateStripeP24Payment,
  }
}
