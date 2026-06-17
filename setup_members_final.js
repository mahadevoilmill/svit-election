#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate 100 members
function generateMembers() {
  const members = [];
  
  const firstNames = ['Anil', 'Rajesh', 'Vikram', 'Deepak', 'Suresh', 'Ramesh', 'Mahesh', 'Arjun', 
                     'Ajay', 'Nitin', 'Sanjay', 'Pradeep', 'Rohit', 'Ashok', 'Kiran', 'Mohan',
                     'Pankaj', 'Ravi', 'Sandeep', 'Atul', 'Ritesh', 'Harsh', 'Varun', 'Siddharth',
                     'Anish', 'Bhavesh', 'Chintan', 'Darshan', 'Eshan', 'Farhan', 'Girish', 'Harish'];
  
  const lastNames = ['Sharma', 'Patel', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Yadav', 'Reddy',
                    'Khan', 'Desai', 'Chopra', 'Pandey', 'Saxena', 'Joshi', 'Nair', 'Iyer',
                    'Bhat', 'Bhatnagar', 'Dwivedi', 'Trivedi'];
  
  const villages = ['Ahmedabad', 'Vadodara', 'Rajkot', 'Surat', 'Bhavnagar', 'Jamnagar', 
                   'Junagadh', 'Porbandar', 'Morbi', 'Gondal'];
  
  for (let i = 1; i <= 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const village = villages[Math.floor(Math.random() * villages.length)];
    
    members.push({
      sr_number: i,
      voter_name: `${firstName} ${lastName}`,
      village: village,
      mobile: '98' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
      logo: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      total_votes: 0
    });
  }
  
  return members;
}

async function setupMembers() {
  try {
    console.log('🔄 Setting up 100 members...\n');
    
    // Delete existing data
    console.log('🗑️  Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .gt('id', 0);
    
    if (deleteError) {
      console.error('⚠️  Warning: Could not clear table:', deleteError.message);
    } else {
      console.log('✅ Existing data cleared\n');
    }
    
    // Generate members
    console.log('🔄 Generating 100 members...');
    const members = generateMembers();
    console.log(`✅ Generated ${members.length} members\n`);
    
    // Insert members
    console.log('📤 Inserting into database...');
    const { data, error: insertError } = await supabase
      .from('votes')
      .insert(members)
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      process.exit(1);
    }
    
    console.log(`✅ Successfully inserted ${data.length} members!\n`);
    
    // Verify
    const { count, error: countError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📈 Total members in database: ${count}`);
    }
    
    console.log('\n✔️ Database is ready! You can now login.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupMembers();
