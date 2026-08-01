require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null);
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  const queries = [
    `ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS form_no VARCHAR(50);`,
    `ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS application_date VARCHAR(50);`
  ];

  for (const sql of queries) {
    const { error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('OK:', sql);
    }
  }
}

addColumns();
