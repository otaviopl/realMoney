import { createBrowserSupabaseClient, createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const supabaseBrowser = createBrowserSupabaseClient()

export const createSupabaseServerClient = () =>
  createServerSupabaseClient({ cookies })
