/**
 * Credit management service. Server-side only.
 * Usa el admin client (service-role) para operaciones de DB.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { isAdminUser, type UserProfile } from '@/lib/auth-utils'

export async function getUserCredits(userId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('getUserCredits error:', error.message)
    return 0
  }
  return data?.credits_remaining ?? 0
}

export async function addCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single()

  if (fetchErr || !profile) {
    console.error('addCredits fetch error:', fetchErr?.message)
    return false
  }

  const newBalance = (profile.credits_remaining ?? 0) + amount

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ credits_remaining: newBalance })
    .eq('id', userId)

  if (updateErr) {
    console.error('addCredits update error:', updateErr.message)
    return false
  }

  return true
}

export async function deductCredit(
  userId: string,
  amount: number = 1
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: profile, error: fetchErr } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single()

  if (fetchErr || !profile) {
    console.error('deductCredit fetch error:', fetchErr?.message)
    return false
  }

  const current = profile.credits_remaining ?? 0
  if (current < amount) return false

  const newBalance = current - amount

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ credits_remaining: newBalance })
    .eq('id', userId)

  if (updateErr) {
    console.error('deductCredit update error:', updateErr.message)
    return false
  }

  return true
}

export async function isAdminBypass(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return false
  return isAdminUser(data as UserProfile)
}
