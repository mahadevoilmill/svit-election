#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null);
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase Connection Test\n');
console.log('Project ID:', process.env.SUPABASE_PROJECT_ID);
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n✅ Creating Supabase client...');
    
    // Test connection by fetching votes
    console.log('📡 Querying votes table...');
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('\n❌ Database query error:', error);
      return;
    }
    
    console.log('✅ Successfully connected to database!');
    console.log(`📊 Found ${data.length} records in votes table\n`);
    
    if (data.length > 0) {
      console.log('Sample record:');
      console.log(data[0]);
    } else {
      console.log('⚠️  Votes table is empty');
    }
    
    // Check total count
    const { count, error: countError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n📈 Total members in database: ${count}`);
    }
    
  } catch (error) {
    console.error('\n❌ Connection error:', error.message);
  }
}

testConnection();
