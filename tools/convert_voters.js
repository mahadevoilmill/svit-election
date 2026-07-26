#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function findKey(keys, ...patterns) {
  for (const p of patterns) {
    const match = keys.find(k => k && k.toLowerCase().trim() === p.toLowerCase().trim());
    if (match) return match;
  }
  for (const p of patterns) {
    const match = keys.find(k => k && k.toLowerCase().trim().includes(p.toLowerCase().trim()));
    if (match) return match;
  }
  return null;
}

function normalizeRow(row, fallbackId) {
  const keys = Object.keys(row || {});
  const srKey = findKey(keys, 'SR No', 'SR. No.', 'sr number', 'sr_number', 'sr', 'member id', 'member no');
  const nameKey = findKey(keys, 'voter Name', 'Voter Name', 'voter name', 'name', 'english name', 'full name');
  const addressKey = findKey(keys, 'Address', 'address');
  const villageKey = findKey(keys, 'Village', 'village');
  const mobileKey = findKey(keys, 'Mobile no', 'Mobile No', 'Mobile No. 1', 'mobile', 'mobile no');
  const mobile2Key = findKey(keys, 'Mobile No 2', 'Mobile No.2', 'mobile2');
  const memberIdKey = findKey(keys, 'Member ID', 'MemberID', 'Member No.', 'member_id');
  const feeKey = findKey(keys, 'Fee Payment', 'FeePaid', 'fee_payment');
  const photoKey = findKey(keys, 'Photo', 'photo', 'Photo URL', 'PhotoURL');

  return {
    id: Number(row.id ?? row['Voter ID'] ?? fallbackId) || null,
    sr_number: (srKey ? String(row[srKey] ?? '') : (row.sr_number || row['SR No'] || '')) || '',
    voter_name: (nameKey ? String(row[nameKey] ?? '') : (row.voter_name || row['English Name'] || row['Name'] || '')) || '',
    address: (addressKey ? String(row[addressKey] ?? '') : row.address || '') || '',
    village: (villageKey ? String(row[villageKey] ?? '') : row.village || '') || '',
    mobile: (mobileKey ? String(row[mobileKey] ?? '') : row.mobile || '') || '',
    mobile2: (mobile2Key ? String(row[mobile2Key] ?? '') : row.mobile2 || '') || '',
    member_id: (memberIdKey ? String(row[memberIdKey] ?? '') : row.member_id || '') || '',
    fee_payment: (feeKey ? String(row[feeKey] ?? '') : row.fee_payment || '') || '',
    photo: (photoKey ? String(row[photoKey] ?? '') : row.photo || '') || ''
  };
}

function toCsv(rows) {
  const headers = ['SR No','Voter Name','Address','Village','Mobile No','Mobile No 2','Member ID','Fee Payment','Photo'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = [r.sr_number, r.voter_name, r.address, r.village, r.mobile, r.mobile2, r.member_id, r.fee_payment, r.photo];
    const escaped = vals.map(v => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s}"` : s;
    });
    lines.push(escaped.join(','));
  }
  return lines.join('\n');
}

function usage() {
  console.log('Usage: node tools/convert_voters.js <input.xls/xlsx> [--out-json <file>] [--out-csv <file>]');
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length) { usage(); process.exit(1); }
  const input = argv[0];
  const outJsonIndex = argv.indexOf('--out-json');
  const outCsvIndex = argv.indexOf('--out-csv');
  const outJson = outJsonIndex !== -1 ? argv[outJsonIndex + 1] : null;
  const outCsv = outCsvIndex !== -1 ? argv[outCsvIndex + 1] : null;

  if (!fs.existsSync(input)) { console.error('Input file not found:', input); process.exit(2); }

  const wb = XLSX.readFile(input);
  const sheetName = wb.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

  const rows = data.map((r, idx) => normalizeRow(r, idx + 1));

  if (outJson) {
    fs.writeFileSync(outJson, JSON.stringify(rows, null, 2), 'utf8');
    console.log('Wrote JSON:', outJson);
  }

  if (outCsv) {
    const csv = toCsv(rows);
    fs.writeFileSync(outCsv, csv, 'utf8');
    console.log('Wrote CSV:', outCsv);
  }

  if (!outJson && !outCsv) {
    // default: print CSV to stdout
    console.log(toCsv(rows));
  }
}

main().catch(err => { console.error(err); process.exit(10); });
