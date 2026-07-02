import { useEffect, useRef, useId } from 'react'

const PAYPAL_SDK_URL = 'https://www.paypal.com/sdk/js'
const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || ''

interface PayPalSubscriptionButtonProps {
  planId: string
  onSuccess?: (subscriptionId: string) => void
  onError?: (error: unknown) => void
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: unknown) => {
        render: (selector: string) => void
      }
    }
  }
}

export function PayPalSubscriptionButton({
  planId,
  onSuccess,
  onError,
}: PayPalSubscriptionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef(false)
  const uniqueId = useId().replace(/:/g, '-')

  useEffect(() => {
    if (renderedRef.current) return
    if (!containerRef.current) return

    const containerId = `paypal-btn-${uniqueId}`

    // Check if CLIENT_ID is configured
    if (!CLIENT_ID) {
      console.error('[PayPal] VITE_PAYPAL_CLIENT_ID not configured')
      onError?.(new Error('PayPal not configured'))
      return
    }

    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      renderButton(containerId)
      return
    }

    // Load PayPal SDK
    const script = document.createElement('script')
    script.src = `${PAYPAL_SDK_URL}?client-id=${CLIENT_ID}&vault=true&intent=subscription`
    script.async = true
    script.onload = () => {
      renderButton(containerId)
    }
    script.onerror = () => {
      console.error('Failed to load PayPal SDK')
      onError?.(new Error('Failed to load PayPal SDK'))
    }
    document.body.appendChild(script)

    function renderButton(containerId: string) {
      if (!containerRef.current || !window.paypal) return

      try {
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe',
          },
          createSubscription: (_data: unknown, actions: { subscription: { create: (config: { plan_id: string }) => Promise<string> } }) => {
            return actions.subscription.create({ plan_id: planId })
          },
          onApprove: (data: { subscriptionID?: string }) => {
            if (data.subscriptionID) {
              onSuccess?.(data.subscriptionID)
            }
          },
          onError: (err: unknown) => {
            console.error('PayPal error:', err)
            onError?.(err)
          },
        }).render(`#${containerId}`)
        renderedRef.current = true
      } catch (err) {
        console.error('Failed to render PayPal button:', err)
        onError?.(err)
      }
    }

    return () => {
      // Cleanup is handled by React unmounting
    }
  }, [planId, onSuccess, onError, uniqueId])

  return <div id={`paypal-btn-${uniqueId}`} ref={containerRef} className="paypal-button-container" />
}
