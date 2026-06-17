#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null);
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_PROJECT_ID and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required.');
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

// Insert members into Supabase
async function insertMembers() {
  try {
    console.log('🔄 Generating 100 members...');
    const members = generateMembers();
    
    console.log('📤 Inserting into Supabase...');
    const { data, error } = await supabase
      .from('votes')
      .insert(members);
    
    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully inserted 100 members!');
    console.log(`📊 Members with SR numbers and logos added to database`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertMembers();
