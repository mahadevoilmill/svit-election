#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null);
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COLUMNS = [
  { name: 'member_id', type: 'VARCHAR(50)' },
  { name: 'gujarati_name', type: 'TEXT' },
  { name: 'gender', type: 'VARCHAR(10)' },
  { name: 'birthdate', type: 'VARCHAR(50)' },
  { name: 'age', type: 'VARCHAR(10)' },
  { name: 'mobile2', type: 'VARCHAR(20)' },
  { name: 'address', type: 'TEXT' },
  { name: 'email', type: 'VARCHAR(255)' },
  { name: 'address_guj', type: 'TEXT' },
  { name: 'city_guj', type: 'VARCHAR(255)' },
  { name: 'fee_payment', type: 'VARCHAR(50)' },
  { name: 'photo', type: 'TEXT' },
  { name: 'status', type: 'VARCHAR(20) DEFAULT \'active\'' },
  { name: 'cancel_remarks', type: 'TEXT' }
];

async function addColumn(col) {
  const sql = `ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`;
  const { error } = await supabase.rpc('exec', { sql });
  if (error) {
    console.error(`  Failed to add ${col.name}: ${error.message}`);
    return false;
  }
  console.log(`  + ${col.name}`);
  return true;
}

async function main() {
  console.log('Adding missing columns to votes table...\n');

  let ok = 0, fail = 0;
  for (const col of COLUMNS) {
    const success = await addColumn(col);
    if (success) ok++; else fail++;
  }

  console.log(`\nDone: ${ok} added, ${fail} failed`);

  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows in votes table: ${count}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
