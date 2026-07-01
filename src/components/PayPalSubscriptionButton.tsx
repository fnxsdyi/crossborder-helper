import { useEffect, useRef } from 'react'

const PAYPAL_SDK_URL = 'https://www.paypal.com/sdk/js'
const CLIENT_ID = 'ATs49ULf5-BT-BzxVRiH_5VPCYZlb_x11S4j1ZHwqGKQMjS8jLEgG3tm-lJ9Ch01s2ePTbs8nkgDN9P2'

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

  useEffect(() => {
    if (renderedRef.current) return
    if (!containerRef.current) return

    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      renderButton()
      return
    }

    // Load PayPal SDK
    const script = document.createElement('script')
    script.src = `${PAYPAL_SDK_URL}?client-id=${CLIENT_ID}&vault=true&intent=subscription`
    script.async = true
    script.onload = () => {
      renderButton()
    }
    script.onerror = () => {
      console.error('Failed to load PayPal SDK')
      onError?.(new Error('Failed to load PayPal SDK'))
    }
    document.body.appendChild(script)

    function renderButton() {
      if (!containerRef.current || !window.paypal) return

      try {
        window.paypal.Buttons({
          style: {
            shape: 'pill',
            color: 'silver',
            layout: 'vertical',
            label: 'paypal',
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
        }).render('#paypal-container')
        renderedRef.current = true
      } catch (err) {
        console.error('Failed to render PayPal button:', err)
        onError?.(err)
      }
    }

    return () => {
      // Cleanup is handled by React unmounting
    }
  }, [planId, onSuccess, onError])

  return <div id="paypal-container" ref={containerRef} className="paypal-button-container" />
}
