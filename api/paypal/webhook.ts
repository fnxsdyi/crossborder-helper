import { createClient } from '@supabase/supabase-js'
import type { IncomingMessage, ServerResponse } from 'http'

interface VercelRequest extends IncomingMessage {
  body: any
  query: Record<string, string>
}

type VercelResponse = ServerResponse

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const paypalClientId = process.env.PAYPAL_CLIENT_ID!
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET!
const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')
  const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

// Verify PayPal webhook signature
async function verifyWebhookSignature(
  accessToken: string,
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const res = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      timestamp: headers['paypal-transmission-time'],
      webhook_id: paypalWebhookId,
      webhook_event: JSON.parse(body),
    }),
  })
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}

// Extract subscription ID from event resource
function getSubscriptionId(event: any): string | null {
  return event?.resource?.id || event?.resource?.subscription_id || null
}

// Map PayPal subscription status to our status
function mapStatus(paypalStatus: string): string {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'active',
    'APPROVAL_PENDING': 'pending',
    'APPROVED': 'pending',
    'SUSPENDED': 'past_due',
    'CANCELLED': 'canceled',
    'EXPIRED': 'expired',
  }
  return statusMap[paypalStatus] || 'pending'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const accessToken = await getPayPalAccessToken()

    // Verify webhook signature
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase().startsWith('paypal-')) {
        headers[key] = value as string
      }
    }

    const rawBody = JSON.stringify(req.body)
    const isValid = await verifyWebhookSignature(accessToken, headers, rawBody)

    if (!isValid) {
      console.error('[Webhook] Invalid signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const event = req.body
    const eventType = event.event_type
    const subscriptionId = getSubscriptionId(event)

    console.log(`[Webhook] Received: ${eventType}, subscription: ${subscriptionId}`)

    if (!subscriptionId) {
      return res.status(200).json({ received: true, skipped: true })
    }

    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const resource = event.resource
        const planType = resource?.plan?.plan_id === process.env.PAYPAL_ANNUAL_PLAN_ID ? 'annual' : 'monthly'
        const status = mapStatus(resource?.status || 'ACTIVE')

        // Get user_id from custom_id or metadata
        const userId = resource?.custom_id || resource?.subscriber?.payer_id

        if (!userId) {
          console.error('[Webhook] No user_id found in subscription event')
          return res.status(200).json({ received: true, error: 'no_user_id' })
        }

        // Upsert subscription
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            paypal_subscription_id: subscriptionId,
            plan_type: planType,
            status,
            current_period_start: resource?.start_time || new Date().toISOString(),
            current_period_end: resource?.billing_info?.next_billing_time || null,
            cancel_at_period_end: resource?.status === 'CANCELLED',
          }, { onConflict: 'paypal_subscription_id' })

        if (error) {
          console.error('[Webhook] Upsert error:', error)
          return res.status(500).json({ error: 'Database error' })
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const resource = event.resource
        const status = mapStatus(resource?.status || 'ACTIVE')

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_end: resource?.billing_info?.next_billing_time || null,
            cancel_at_period_end: resource?.status === 'CANCELLED',
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)

        if (error) {
          console.error('[Webhook] Update error:', error)
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)

        if (error) {
          console.error('[Webhook] Cancel error:', error)
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)

        if (error) {
          console.error('[Webhook] Expire error:', error)
        }
        break
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId)

        if (error) {
          console.error('[Webhook] Payment failed error:', error)
        }
        break
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Payment successful - reactivate if was past_due
        const resource = event.resource
        const subId = resource?.subscription_id || subscriptionId

        if (subId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('paypal_subscription_id', subId)
            .eq('status', 'past_due')

          if (error) {
            console.error('[Webhook] Reactivate error:', error)
          }
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`)
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[Webhook] Error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
