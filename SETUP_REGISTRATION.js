#!/usr/bin/env node

/**
 * SVIT Election - User Registration Setup Guide
 * 
 * This script will help you set up the users table in Supabase
 * for user registration and password reset functionality.
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     SVIT ELECTION - USER REGISTRATION SETUP                    ║
╚════════════════════════════════════════════════════════════════╝

📋 SETUP INSTRUCTIONS:

Step 1: Open Supabase Dashboard
   → Go to: https://app.supabase.com
   → Select Project: "lbzacdkhfvhcswrqcbxl"

Step 2: Open SQL Editor
   → Click "SQL Editor" in the left menu
   → Click "New Query"

Step 3: Run This SQL Code
   → Copy the SQL below
   → Paste it into the editor
   → Click "Run"

───────────────────────────────────────────────────────────────
SQL CODE - COPY AND PASTE THIS:
───────────────────────────────────────────────────────────────

`);

const sqlCode = `-- Create users table for registration and password reset
CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (for simple app)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Insert default admin user
INSERT INTO public.users (username, password) 
VALUES ('NEST', 'sardar123')
ON CONFLICT (username) DO NOTHING;
`;

console.log(sqlCode);

console.log(`
───────────────────────────────────────────────────────────────

Step 4: Restart Server
   → In terminal: npm start

Step 5: Test
   → Go to: http://localhost:5000
   → Login with: NEST / sardar123
   → Click "Create Account" to register
   → Click "Forgot Password" to reset

═══════════════════════════════════════════════════════════════

✨ Features Available After Setup:

   ✅ Default Login: NEST / sardar123
   ✅ User Registration: Click "Create Account"
   ✅ Password Reset: Click "Forgot Password"
   ✅ New accounts can vote immediately

═══════════════════════════════════════════════════════════════

📝 Default Credentials:
   Username: NEST
   Password: sardar123

🔒 Security Note:
   Passwords currently stored in plain text.
   For production, add bcrypt hashing (see README.md)

🆘 Troubleshooting:

   Issue: "Could not find table 'public.users'"
   → Solution: Make sure you ran the SQL above in Supabase

   Issue: "Username already exists"
   → Solution: Register with different username or reset password

   Issue: Registration page not working
   → Solution: Make sure users table exists in Supabase

═══════════════════════════════════════════════════════════════
`);

// Save the SQL code to a file for easy copy-paste
const sqlFile = path.join(__dirname, 'CREATE_USERS_TABLE.sql');
fs.writeFileSync(sqlFile, sqlCode);
console.log(`\n📄 SQL code saved to: CREATE_USERS_TABLE.sql\n`);
