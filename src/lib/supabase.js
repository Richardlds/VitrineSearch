import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yltdjbkntaismaptmaxe.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdGRqYmtudGFpc21hcHRtYXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNzg2MzcsImV4cCI6MjEwMzc1NDYzN30.wWSDCuYGx3i2RpPqnyG9ObZWKwch7EYCK6-bkHYDhRA'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase variables are missing from environment.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
