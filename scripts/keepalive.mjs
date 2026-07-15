#!/usr/bin/env node
/**
 * Supabase Keep-Alive Script
 * 
 * Queries the Supabase database to prevent auto-pause on free tier.
 * Run every 5 days via cron/scheduler.
 * 
 * Usage: node scripts/keepalive.mjs
 * 
 * Env vars (set in .env.supabase or system env):
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_ANON_KEY - Your Supabase anon/public key
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env from .env.supabase if exists
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.supabase')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  } catch {
    // .env.supabase not found, rely on system env
  }
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set.')
  console.error('Create .env.supabase in project root with:')
  console.error('  SUPABASE_URL=https://xxx.supabase.co')
  console.error('  SUPABASE_ANON_KEY=eyJhbGci...')
  process.exit(1)
}

async function keepAlive() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Supabase keep-alive ping...`)

  // Query subscriptions table (lightweight count)
  const tables = ['subscriptions', 'sf_clients', 'sf_invoices']
  let success = false

  for (const table of tables) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Range': '0-0',
        },
      })

      if (res.ok) {
        console.log(`  ✓ ${table} query succeeded (${res.status})`)
        success = true
        break
      } else {
        console.warn(`  ✗ ${table} returned ${res.status}: ${res.statusText}`)
      }
    } catch (err) {
      console.warn(`  ✗ ${table} failed: ${err.message}`)
    }
  }

  if (success) {
    console.log(`[${timestamp}] Keep-alive successful. DB is active.`)
  } else {
    console.error(`[${timestamp}] Keep-alive FAILED. All table queries failed.`)
    process.exit(1)
  }
}

keepAlive()
