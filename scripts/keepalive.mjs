#!/usr/bin/env node
/**
 * Supabase Keep-Alive Script
 * 
 * INSERTs a heartbeat row to prevent auto-pause on free tier.
 * Run every 2-3 days via cron/scheduler.
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

async function ensureTable() {
  // Create keepalive_logs table if not exists
  const sql = `
    CREATE TABLE IF NOT EXISTS keepalive_logs (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      created_at timestamptz DEFAULT now()
    );
  `
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  // If rpc not available, table might already exist - continue anyway
  if (!res.ok) {
    console.log('  ℹ exec_sql not available, assuming table exists')
  }
}

async function insertHeartbeat() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Supabase keep-alive: inserting heartbeat...`)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/keepalive_logs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({}),
  })

  if (res.ok || res.status === 201) {
    console.log(`  ✓ Heartbeat inserted (${res.status})`)
    return true
  }

  // If table doesn't exist, try to create it
  if (res.status === 404) {
    console.log('  ℹ Table not found, attempting to create...')
    await ensureTable()
    // Retry insert
    const retry = await fetch(`${SUPABASE_URL}/rest/v1/keepalive_logs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({}),
    })
    if (retry.ok || retry.status === 201) {
      console.log(`  ✓ Heartbeat inserted after table creation (${retry.status})`)
      return true
    }
    console.error(`  ✗ Retry failed: ${retry.status}`)
    return false
  }

  console.error(`  ✗ Insert failed: ${res.status}`)
  return false
}

async function cleanupOldLogs() {
  // Delete records older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/keepalive_logs?created_at=lt.${thirtyDaysAgo}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (res.ok) {
    console.log('  ✓ Old logs cleaned up')
  }
}

async function keepAlive() {
  try {
    const success = await insertHeartbeat()
    if (success) {
      await cleanupOldLogs()
      console.log(`[${new Date().toISOString()}] Keep-alive successful.`)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Keep-alive FAILED: ${err.message}`)
    process.exit(1)
  }
}

keepAlive()
