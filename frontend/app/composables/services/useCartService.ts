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

  type CheckoutCustomer = { email: string, first_name: string, last_name: string }

  async function completeDummyCheckout(customer?: CheckoutCustomer) {
    const currentCart = await getCart()
    if (!currentCart || !currentCart.items?.length) return

    // 1. Set email and dummy address
    await sdk.store.cart.update(currentCart.id, {
      email: customer?.email ?? 'demo@example.com',
      shipping_address: {
        first_name: customer?.first_name ?? 'Demo',
        last_name: customer?.last_name ?? 'User',
        address_1: 'Test Street 1',
        city: 'Test City',
        country_code: 'pl',
        postal_code: '00-000'
      }
    })

    // 2. Fetch shipping options and add the first one
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: currentCart.id })
    if (shipping_options?.length) {
      await sdk.store.cart.addShippingMethod(currentCart.id, {
        option_id: shipping_options[0].id
      })
    }

    // 3. Initiate payment session
    await sdk.store.payment.initiatePaymentSession(currentCart, {
      provider_id: 'pp_system_default' // The default manual provider in Medusa v2
    })

    // 4. Complete cart
    const { type, order } = await sdk.store.cart.complete(currentCart.id)

    saveCartId(null)
    cart.value = null

    return order
  }

  return {
    cart,
    getCart,
    addToCart,
    removeFromCart,
    completeDummyCheckout
  }
}
