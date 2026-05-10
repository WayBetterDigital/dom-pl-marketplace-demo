import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'

let stripeInstance: Promise<Stripe | null> | null = null

export function useStripe() {
  const config = useRuntimeConfig()

  function getStripe(): Promise<Stripe | null> {
    if (!stripeInstance) {
      stripeInstance = loadStripe(config.public.stripePublishableKey as string)
    }
    return stripeInstance
  }

  return { getStripe }
}
