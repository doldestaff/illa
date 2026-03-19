import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import { join } from 'path'

// Load environment variables manually from .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

let supabaseUrl = ''
let supabaseKey = ''

envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/^"|"$/g, '')
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/^"|"$/g, '')
})

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdmin() {
  const email = 'webdigitalxp@gmail.com'
  const password = '1209'
  
  console.log(`Creating user: ${email}...`)
  
  // 1. Create or get user in Auth
  let userId = ''
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  
  if (authError) {
    if (authError.message.includes('User already registered')) {
        console.log('User already exists. Attempting to update password instead...')
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
        if (usersError) throw usersError
        const existingUser = usersData.users.find(u => u.email === email)
        if (existingUser) {
            userId = existingUser.id
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password })
            if (updateError) throw updateError
            console.log('Password updated successfully.')
        } else {
            console.error('Could not find existing user to update.')
            process.exit(1)
        }
    } else {
        throw authError
    }
  } else {
      userId = authData.user.id
      console.log('User created in Auth.')
  }
  
  // 2. Add to admin_users table
  console.log(`Adding ${userId} to admin_users...`)
  const { error: dbError } = await supabase
    .from('admin_users')
    .upsert({ user_id: userId })
    
  if (dbError) {
    throw dbError
  }
  
  console.log('✅ Admin user created/updated successfully!')
  console.log(`Email: ${email}`)
  console.log(`Senha: ${password}`)
}

createAdmin().catch(console.error)
