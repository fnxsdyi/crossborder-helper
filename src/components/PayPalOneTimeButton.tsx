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

    // Load SDK (one-time payments — no vault / no subscription intent)
    const script = document.createElement('script')
    script.src = `${PAYPAL_SDK_URL}?client-id=${CLIENT_ID}&currency=USD`
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

interface PayPalOneTimeButtonProps {
  amount: number
  currency?: string
  customId?: string | null
  onSuccess?: (orderId: string) => void
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

export function PayPalOneTimeButton({
  amount,
  currency = 'USD',
  customId,
  onSuccess,
  onError,
}: PayPalOneTimeButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef(false)
  const uniqueId = useId().replace(/:/g, '-')

  useEffect(() => {
    if (renderedRef.current) return
    if (!containerRef.current) return

    const containerId = `paypal-onetime-${uniqueId}`
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
            label: 'pay',
          },
          createOrder: (_data: unknown, actions: { order: { create: (config: Record<string, unknown>) => Promise<string> } }) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: currency,
                  },
                  ...(customId ? { custom_id: customId } : {}),
                },
              ],
            })
          },
          onApprove: async (data: { orderID?: string }, actions: { order: { capture: () => Promise<unknown> } }) => {
            // Capture the funds client-side
            try {
              await actions.order.capture()
            } catch (captureErr) {
              console.error('[TaxFlow] PayPal capture failed:', captureErr)
            }
            if (data.orderID && !cancelled) {
              onSuccess?.(data.orderID)
            }
          },
          onError: (err: unknown) => {
            console.error('PayPal one-time button error:', err)
            if (!cancelled) onError?.(err)
          },
        }).render(`#${containerId}`)

        renderedRef.current = true
      } catch (err) {
        console.error('PayPal one-time init error:', err)
        if (!cancelled) onError?.(err)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [amount, currency, customId, onSuccess, onError, uniqueId])

  return <div id={`paypal-onetime-${uniqueId}`} ref={containerRef} className="paypal-button-container" />
}
