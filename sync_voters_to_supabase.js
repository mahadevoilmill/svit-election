#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const VOTERS_FILE = path.resolve(__dirname, 'voters.json');
const BATCH_SIZE = 500;

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null);
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_PROJECT_ID and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeSrNumber(sr) {
  const n = Number(sr);
  return isNaN(n) ? null : n;
}

async function fetchExistingVotes() {
  const existing = new Map();
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('votes')
      .select('id, sr_number, total_votes, voter_name, member_id, gujarati_name, gender, birthdate, age, mobile, mobile2, address, village, email, address_guj, city_guj, fee_payment, photo, status, cancel_remarks')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching existing votes:', error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      existing.set(String(row.sr_number), row);
    }
    offset += data.length;
    if (data.length < limit) break;
  }

  return existing;
}

function prepareBatch(voters, existingMap) {
  const toUpsert = [];

  for (const voter of voters) {
    const sr = normalizeSrNumber(voter.sr_number);
    if (sr === null) continue;

    const existing = existingMap.get(String(sr));

    toUpsert.push({
      id: voter.id || undefined,
      sr_number: sr,
      voter_name: voter.voter_name || (existing ? existing.voter_name : ''),
      member_id: voter.member_id || (existing ? existing.member_id : ''),
      gujarati_name: voter.gujarati_name || (existing ? existing.gujarati_name : ''),
      gender: voter.gender || (existing ? existing.gender : ''),
      birthdate: voter.birthdate || (existing ? existing.birthdate : ''),
      age: voter.age || (existing ? existing.age : ''),
      mobile: voter.mobile || (existing ? existing.mobile : ''),
      mobile2: voter.mobile2 || (existing ? existing.mobile2 : ''),
      address: voter.address || (existing ? existing.address : ''),
      village: voter.village || (existing ? existing.village : ''),
      email: voter.email || (existing ? existing.email : ''),
      address_guj: voter.address_guj || (existing ? existing.address_guj : ''),
      city_guj: voter.city_guj || (existing ? existing.city_guj : ''),
      fee_payment: voter.fee_payment || (existing ? existing.fee_payment : ''),
      photo: voter.photo || (existing ? existing.photo : ''),
      logo: voter.photo || (existing ? existing.logo : ''),
      status: voter.status || (existing ? existing.status : 'active'),
      cancel_remarks: voter.cancel_remarks || (existing ? existing.cancel_remarks : ''),
      total_votes: existing ? existing.total_votes : 0
    });
  }

  return toUpsert;
}

async function upsertBatch(batch) {
  const { data, error } = await supabase
    .from('votes')
    .upsert(batch, { onConflict: 'sr_number', ignoreDuplicates: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function main() {
  console.log('Reading voters.json...');
  if (!fs.existsSync(VOTERS_FILE)) {
    console.error('voters.json not found at', VOTERS_FILE);
    process.exit(1);
  }

  const voters = JSON.parse(fs.readFileSync(VOTERS_FILE, 'utf8'));
  console.log(`Found ${voters.length} voters in voters.json\n`);

  console.log('Fetching existing votes from Supabase...');
  const existingMap = await fetchExistingVotes();
  console.log(`Found ${existingMap.size} existing records in Supabase votes table\n`);

  const allRecords = prepareBatch(voters, existingMap);
  console.log(`Prepared ${allRecords.length} records to upsert\n`);

  const batches = [];
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    batches.push(allRecords.slice(i, i + BATCH_SIZE));
  }

  console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      await upsertBatch(batch);
      successCount += batch.length;
      if ((i + 1) % 10 === 0 || i === batches.length - 1) {
        console.log(`  Batch ${i + 1}/${batches.length} done (${successCount}/${allRecords.length} records)`);
      }
    } catch (err) {
      errorCount += batch.length;
      console.error(`  Batch ${i + 1} failed: ${err.message}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Upserted: ${successCount}`);
  console.log(`  Errors:   ${errorCount}`);

  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  console.log(`  Total in Supabase votes table: ${count}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
