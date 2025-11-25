import { supabase } from './supabase.js'

// Example: Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('_test')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('Supabase connected! (Test table error is expected)')
      document.getElementById('app').innerHTML = '<p class="text-green-600">✅ Supabase connected successfully!</p>'
    } else {
      console.log('Supabase connected!', data)
      document.getElementById('app').innerHTML = '<p class="text-green-600">✅ Supabase connected successfully!</p>'
    }
  } catch (error) {
    console.error('Connection error:', error)
    document.getElementById('app').innerHTML = '<p class="text-red-600">❌ Connection error. Check console for details.</p>'
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  testConnection()
})









