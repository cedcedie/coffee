import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Your Supabase credentials
const SUPABASE_URL = 'https://gpxygydlqmbikracyrdh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweHlneWRscW1iaWtyYWN5cmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NTQyNTUsImV4cCI6MjA3OTUzMDI1NX0.RbgZ7dyKB2ixg-mdQEdjoypqWmOFV87MIw-1s1tijKo'

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)








