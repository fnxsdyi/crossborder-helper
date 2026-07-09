import { useEffect, useRef, useId } from 'react'

const PAYPAL_SDK_URL = 'https://www.paypal.com/sdk/js'
const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || ''

// Global SDK loading state - prevent double loading
let sdkLoading = false
let sdkLoaded = false
let sdkError = false
const sdkCallbacks: Array<() => void> = []

function loadPayPalSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (sdkLoaded && window.paypal) {
      resolve()
      return
    }

    // Already failed
    if (sdkError) {
      reject(new Error('PayPal SDK failed to load'))
      return
    }

    // Already loading - queue callback
    if (sdkLoading) {
      sdkCallbacks.push(() => resolve())
      return
    }

    // Check if CLIENT_ID is configured
    if (!CLIENT_ID) {
      sdkError = true
      reject(new Error('VITE_PAYPAL_CLIENT_ID not configured'))
      return
    }

    sdkLoading = true

    // Check if SDK script already exists in DOM
    const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`)
    if (existingScript) {
      // Script tag exists, wait for it
      const checkLoaded = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkLoaded)
          sdkLoaded = true
          sdkLoading = false
          sdkCallbacks.forEach(cb => cb())
          sdkCallbacks.length = 0
          resolve()
        }
      }, 100)
      // Timeout after 10s
      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!sdkLoaded) {
          sdkError = true
          sdkLoading = false
          reject(new Error('PayPal SDK load timeout'))
        }
      }, 10000)
      return
    }

    // Load SDK
    const script = document.createElement('script')
    script.src = `${PAYPAL_SDK_URL}?client-id=${CLIENT_ID}&vault=true&intent=subscription&locale=en_US`
    script.async = true
    script.onload = () => {
      // Wait for window.paypal to be defined
      const checkLoaded = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkLoaded)
          sdkLoaded = true
          sdkLoading = false
          sdkCallbacks.forEach(cb => cb())
          sdkCallbacks.length = 0
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!sdkLoaded) {
          sdkError = true
          sdkLoading = false
          reject(new Error('PayPal SDK init timeout'))
        }
      }, 10000)
    }
    script.onerror = () => {
      sdkError = true
      sdkLoading = false
      reject(new Error('Failed to load PayPal SDK'))
    }
    document.body.appendChild(script)
  })
}

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
    let cancelled = false

    async function init() {
      try {
        await loadPayPalSDK()

        if (cancelled || !containerRef.current || !window.paypal) return

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
            if (data.subscriptionID && !cancelled) {
              onSuccess?.(data.subscriptionID)
            }
          },
          onError: (err: unknown) => {
            console.error('PayPal button error:', err)
            if (!cancelled) onError?.(err)
          },
        }).render(`#${containerId}`)

        renderedRef.current = true
      } catch (err) {
        console.error('PayPal init error:', err)
        if (!cancelled) onError?.(err)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [planId, onSuccess, onError, uniqueId])

  return <div id={`paypal-btn-${uniqueId}`} ref={containerRef} className="paypal-button-container" />
}
