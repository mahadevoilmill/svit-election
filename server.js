const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null);
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_PROJECT_ID and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const upload = multer({ dest: 'uploads/' });

const DEFAULT_USERNAME = 'NEST';
const DEFAULT_PASSWORD = 'sardar123';

// Simple JSON file-based role store (no DB schema change needed)
const ROLES_FILE = './user_roles.json';
function loadRoles() {
  try { return JSON.parse(fs.readFileSync(ROLES_FILE, 'utf8')); } catch { return {}; }
}
function saveRoles(roles) {
  fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2));
}
function getUserRole(username) {
  return loadRoles()[username] || 'dashboard';
}
function setUserRole(username, role) {
  const roles = loadRoles();
  roles[username] = role || 'dashboard';
  saveRoles(roles);
}
function deleteUserRole(username) {
  const roles = loadRoles();
  delete roles[username];
  saveRoles(roles);
}

const MAX_VOTE_SELECTION = 17;
const CANDIDATE_LIST_FILE = './candidate_list.json';

function canUserVote(username) {
  const role = getUserRole(username);
  return role === 'member' || role === 'admin';
}

function loadCandidateList() {
  try {
    return JSON.parse(fs.readFileSync(CANDIDATE_LIST_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveCandidateList(candidates) {
  fs.writeFileSync(CANDIDATE_LIST_FILE, JSON.stringify(candidates, null, 2));
}

function requireAdmin(req, res, next) {
  const username = req.headers['x-username'] || req.body?.username || req.query?.username;
  if (!username) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const role = getUserRole(username);
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.authUser = { username, role };
  next();
}

// Ensure default admin has admin role
setUserRole(DEFAULT_USERNAME, 'admin');

// Simple JSON file-based ballot entry log (tracks who entered each ballot)
const BALLOT_LOG_FILE = './ballot_entry_log.json';
function loadBallotLog() {
  try { return JSON.parse(fs.readFileSync(BALLOT_LOG_FILE, 'utf8')); } catch { return {}; }
}
function saveBallotLog(log) {
  fs.writeFileSync(BALLOT_LOG_FILE, JSON.stringify(log, null, 2));
}
function setBallotEntry(ballotId, enteredBy) {
  const log = loadBallotLog();
  log[String(ballotId)] = { entered_by: enteredBy, timestamp: new Date().toISOString() };
  saveBallotLog(log);
}
function getBallotEntry(ballotId) {
  return loadBallotLog()[String(ballotId)] || null;
}
function removeBallotEntry(ballotId) {
  const log = loadBallotLog();
  delete log[String(ballotId)];
  saveBallotLog(log);
}

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database tables...');
    
    // Check if users table exists
    const { data: tables, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST204') {
      console.error('❌ users table does not exist:');
      console.log('   Run CREATE_USERS_TABLE.sql manually: CREATE TABLE IF NOT EXISTS users (...);');
      console.log('   This will create the users table with default admin user');
      
      // Try to insert default user directly if table doesn't exist
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD
        });
      
      if (insertError) {
        console.error('❌ Failed to create default user:', insertError.message);
      } else {
        console.log('✅ Default user created: ' + DEFAULT_USERNAME);
      }
    } else {
      // Users table exists
      console.log('✅ users table exists');
      
      // Create default admin user
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', DEFAULT_USERNAME)
        .single();
      
      if (!existingUser) {
        await supabase.from('users').insert({
          username: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD
        });
        console.log('✅ Default user created: ' + DEFAULT_USERNAME);
      } else {
        console.log('✅ Default user already exists');
      }
    }
    
    // Check if ballots table exists
    const { error: ballotsError } = await supabase
      .from('ballots')
      .select('*')
      .limit(1);
    
    if (ballotsError && ballotsError.code === 'PGRST204') {
      console.error('❌ ballots table does not exist:');
      console.log('   Create this table in Supabase SQL Editor or run CREATE_BALLOTS_TABLE.sql');
      console.log('   CREATE TABLE ballots (id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY, sr_numbers JSONB NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());');
    } else {
      console.log('✅ ballots table exists');
    }
    
  } catch (error) {
    console.log('⚠️  Note: Database tables may need manual creation in Supabase:', error.message);
  }
}

initializeDatabase();

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // First check if it's the default admin
    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      return res.json({ success: true, role: 'admin', username });
    }

    // Then check database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false });
    }

    res.json({ success: true, role: getUserRole(data.username), username: data.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ success: false });
  }
});

async function insertUser({ username, password, role }) {
  const { data, error } = await supabase
    .from('users')
    .insert({ username, password, role: role || 'dashboard' })
    .select();
  if (!error && username) setUserRole(username, role || 'dashboard');
  return { data, error };
}

async function updateUserById(id, fields) {
  const { username, role } = fields;
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('username')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  const oldUsername = existingUser?.username;
  const newUsername = username || oldUsername;
  const newRole = role || getUserRole(oldUsername);

  if (oldUsername && newUsername && oldUsername !== newUsername) {
    const roles = loadRoles();
    if (roles[oldUsername]) {
      roles[newUsername] = roles[oldUsername];
      delete roles[oldUsername];
      saveRoles(roles);
    }
  }

  if (newUsername) {
    setUserRole(newUsername, newRole);
  }

  const dbFields = {};
  if (username) dbFields.username = username;
  if (fields.password) dbFields.password = fields.password;
  if (role) dbFields.role = role;

  const { data, error } = await supabase
    .from('users')
    .update(dbFields)
    .eq('id', id)
    .select();
  return { data, error };
}

app.post('/register', requireAdmin, async (req, res) => {
  let { username, password, role } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const { data, error } = await insertUser({ username, password, role });

    if (error) {
      console.error('❌ Registration database error:', error.message);
      return res.status(400).json({ error: `Registration failed: ${error.message}` });
    }

    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Username and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (fetchError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Update password
    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        password: newPassword,
        updated_at: new Date().toISOString()
      })
      .eq('username', username)
      .select();

    if (updateError) {
      return res.status(400).json({ error: 'Password reset failed' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/users', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, created_at')
      .order('username', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const roles = loadRoles();
    res.json(data.map(u => ({ ...u, role: roles[u.username] || 'dashboard' })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: user } = await supabase
      .from('users')
      .select('username')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (user) deleteUserRole(user.username);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  try {
    const updateData = { username };
    if (password) updateData.password = password;
    if (role) updateData.role = role;

    const { data, error } = await updateUserById(id, updateData);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'User updated', data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/upload-excel', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);

    function findKey(keys, ...patterns) {
      for (const p of patterns) {
        const match = keys.find(k => k.toLowerCase().trim() === p.toLowerCase().trim());
        if (match) return match;
      }
      for (const p of patterns) {
        const match = keys.find(k => k.toLowerCase().trim().includes(p.toLowerCase().trim()));
        if (match) return match;
      }
      return null;
    }

    let rows = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!data.length) continue;

      const keys = Object.keys(data[0] || {});
    const srKey = findKey(keys, 'SR No', 'SR. No.', 'sr number', 'sr_number', 'sr', 'Sr. No.');
    const memberIdKey = findKey(keys, 'Member No.', 'Member ID', 'MemberID', 'member_id', 'member no');
    const nameKey = findKey(keys, 'English Name', 'voter Name', 'Voter Name', 'voter name', 'name', 'full name');
    const gujaratiNameKey = findKey(keys, 'Gujarati Name', 'gujarati name', 'Name Gujarati');
    const genderKey = findKey(keys, 'M/F', 'Gender', 'gender', 'sex');
    const birthdateKey = findKey(keys, 'Birthdate', 'Birth Date', 'DOB', 'Date of Birth');
    const ageKey = findKey(keys, 'AGE', 'Age');
    const mobileKey = findKey(keys, 'Mobile No. 1', 'Mobile No', 'Mobile no', 'mobile', 'mobile no');
    const mobile2Key = findKey(keys, 'Mobile No 2', 'Mobile No.2', 'mobile2');
    const addressKey = findKey(keys, 'Address', 'address');
    const villageKey = findKey(keys, 'Village', 'village');
    const emailKey = findKey(keys, 'Email ID', 'Email', 'email', 'Email ID');
    const addressGujKey = findKey(keys, 'Addres_guj', 'Address Gujarati', 'address_guj');
    const cityGujKey = findKey(keys, 'City_Gujarato', 'City Gujarati', 'city_guj');
    const feeKey = findKey(keys, 'FEE Payment Date', 'Fee Payment', 'FeePaid', 'fee_payment');
    const photoKey = findKey(keys, 'Photo', 'photo', 'Photo URL', 'PhotoURL');

      if (!nameKey) continue;

      const existing = readVoters();
      let maxId = existing.reduce((m, v) => Math.max(m, Number(v.id) || Number(v['Voter ID']) || 0), 0);

      const imported = data
        .map((row, index) => {
          const name = row[nameKey];
          if (!name && !row[srKey] && !row[addressKey] && !row[villageKey] && !row[mobileKey]) return null;

          maxId += 1;
          const voter = {
            id: maxId,
            sr_number: row[srKey] ?? '',
            member_id: row[memberIdKey] ?? '',
            voter_name: typeof name === 'number' ? String(name) : String(name || '').trim(),
            gujarati_name: row[gujaratiNameKey] ? String(row[gujaratiNameKey]) : '',
            gender: row[genderKey] ? String(row[genderKey]) : '',
            birthdate: row[birthdateKey] ? String(row[birthdateKey]) : '',
            age: row[ageKey] ? String(row[ageKey]) : '',
            mobile: row[mobileKey] ? String(row[mobileKey]) : '',
            mobile2: row[mobile2Key] ? String(row[mobile2Key]) : '',
            address: row[addressKey] ? String(row[addressKey]) : '',
            village: row[villageKey] ? String(row[villageKey]) : '',
            email: row[emailKey] ? String(row[emailKey]) : '',
            address_guj: row[addressGujKey] ? String(row[addressGujKey]) : '',
            city_guj: row[cityGujKey] ? String(row[cityGujKey]) : '',
            fee_payment: row[feeKey] ? String(row[feeKey]) : '',
            photo: row[photoKey] ? String(row[photoKey]) : '',
            _importIndex: index
          };

          return voter;
        })
        .filter(Boolean);

      if (imported.length) {
        rows = imported;
        break;
      }
    }

    if (!rows.length) {
      const firstSheet = workbook.SheetNames[0];
      const firstData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      const sampleKeys = firstData.length > 0 ? Object.keys(firstData[0]) : [];
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'No valid rows found in Excel file',
        detail: 'Detected columns: ' + (sampleKeys.join(', ') || 'none') + '. Tried sheets: ' + workbook.SheetNames.join(', ')
      });
    }

    const data = readVoters();
    const existingMap = new Map(data.map(v => [Number(v.id) || Number(v['Voter ID']), v]));

    for (const row of rows) {
      const id = Number(row.id) || Number(row['Voter ID']);
      if (existingMap.has(id)) {
        Object.assign(existingMap.get(id), row);
      } else {
        data.push(row);
        existingMap.set(id, row);
      }
    }

    writeVoters(data);
    fs.unlinkSync(req.file.path);

    res.json({ success: true, message: 'Voters list imported', imported: rows.length, processedCount: rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/member-template', (req, res) => {
  const templatePath = require('path').resolve(__dirname, 'members_100.xlsx');
  if (fs.existsSync(templatePath)) {
    res.download(templatePath, 'member-template.xlsx');
  } else {
    res.status(404).json({ error: 'Template file not found' });
  }
});

app.get('/voter-template', (req, res) => {
  const templatePath = require('path').resolve(__dirname, 'templates', 'voter-template.xlsx');
  if (fs.existsSync(templatePath)) {
    res.download(templatePath, 'voter-template.xlsx');
  } else {
    res.status(404).json({ error: 'Template file not found' });
  }
});

app.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple JSON file store for candidate party logos
const CANDIDATE_LOGOS_FILE = './candidate_logos.json';
function loadCandidateLogos() {
  try { return JSON.parse(fs.readFileSync(CANDIDATE_LOGOS_FILE, 'utf8')); } catch { return {}; }
}
function saveCandidateLogos(data) {
  fs.writeFileSync(CANDIDATE_LOGOS_FILE, JSON.stringify(data, null, 2));
}

app.post('/candidate-logo', (req, res) => {
  const { sr_number, logo_url } = req.body;
  if (!sr_number) return res.status(400).json({ error: 'sr_number required' });
  const data = loadCandidateLogos();
  data[String(sr_number)] = logo_url || '';
  saveCandidateLogos(data);
  res.json({ success: true });
});

app.get('/candidate-logo/:sr_number', (req, res) => {
  const data = loadCandidateLogos();
  res.json({ logo_url: data[String(req.params.sr_number)] || '' });
});

app.get('/voters-list', async (req, res) => {
  try {
    const data = readVoters();
    res.json(data.map((voter) => ({ ...voter, id: voter.id ?? null })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export voters as CSV using template headers
app.get('/voters-list/export.csv', async (req, res) => {
  try {
    const data = readVoters();
    const headers = ['SR No','Member No','Voter Name','Gujarati Name','M/F','Birthdate','Age','Mobile No 1','Mobile No 2','Address','Village','Email ID','Address Guj','City Guj','Fee Payment Date','Photo'];
    const rows = data.map(v => [
      v.sr_number ?? '',
      v.member_id ?? '',
      v.voter_name ?? '',
      v.gujarati_name ?? '',
      v.gender ?? '',
      v.birthdate ?? '',
      v.age ?? '',
      v.mobile ?? '',
      v.mobile2 ?? '',
      v.address ?? '',
      v.village ?? '',
      v.email ?? '',
      v.address_guj ?? '',
      v.city_guj ?? '',
      v.fee_payment ?? '',
      v.photo ?? ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => {
      if (cell === null || cell === undefined) return '';
      const s = String(cell).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="voters-export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voters-list', async (req, res) => {
  try {
    const payload = req.body || {};
    const data = readVoters();
    const id = (data.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1);
    const newVoter = {
      id,
      sr_number: payload.sr_number ?? '',
      member_id: payload.member_id ?? '',
      voter_name: payload.voter_name ?? '',
      gujarati_name: payload.gujarati_name ?? '',
      gender: payload.gender ?? '',
      birthdate: payload.birthdate ?? '',
      age: payload.age ?? '',
      mobile: payload.mobile ?? '',
      mobile2: payload.mobile2 ?? '',
      address: payload.address ?? '',
      village: payload.village ?? '',
      email: payload.email ?? '',
      address_guj: payload.address_guj ?? '',
      city_guj: payload.city_guj ?? '',
      fee_payment: payload.fee_payment ?? '',
      photo: payload.photo ?? '',
      status: payload.status ?? 'active',
      cancel_remarks: payload.cancel_remarks ?? ''
    };

    if (!newVoter.voter_name && !newVoter.sr_number) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    data.push(newVoter);
    writeVoters(data);
    res.json({ success: true, message: 'Voter added', voter: newVoter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/voters-list/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body || {};
    const data = readVoters();
    const index = data.findIndex((item) => Number(item.id) === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    data[index] = {
      ...data[index],
      sr_number: payload.sr_number ?? data[index].sr_number ?? '',
      member_id: payload.member_id ?? data[index].member_id ?? '',
      voter_name: payload.voter_name ?? data[index].voter_name ?? '',
      gujarati_name: payload.gujarati_name ?? data[index].gujarati_name ?? '',
      gender: payload.gender ?? data[index].gender ?? '',
      birthdate: payload.birthdate ?? data[index].birthdate ?? '',
      age: payload.age ?? data[index].age ?? '',
      mobile: payload.mobile ?? data[index].mobile ?? '',
      mobile2: payload.mobile2 ?? data[index].mobile2 ?? '',
      address: payload.address ?? data[index].address ?? '',
      village: payload.village ?? data[index].village ?? '',
      email: payload.email ?? data[index].email ?? '',
      address_guj: payload.address_guj ?? data[index].address_guj ?? '',
      city_guj: payload.city_guj ?? data[index].city_guj ?? '',
      fee_payment: payload.fee_payment ?? data[index].fee_payment ?? '',
      photo: payload.photo ?? data[index].photo ?? '',
      status: payload.status ?? data[index].status ?? 'active',
      cancel_remarks: payload.cancel_remarks ?? data[index].cancel_remarks ?? ''
    };

    writeVoters(data);
    res.json({ success: true, message: 'Voter updated', voter: data[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/voters-list/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = readVoters();
    const filtered = data.filter((item) => Number(item.id) !== id);

    if (filtered.length === data.length) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    writeVoters(filtered);
    res.json({ success: true, message: 'Voter deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/voters-list/check-member-id/:memberId', async (req, res) => {
  try {
    const memberId = req.params.memberId;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    const data = readVoters();
    const duplicates = data.filter(v => v.member_id && String(v.member_id).trim() === String(memberId).trim());
    res.json({ exists: duplicates.length > 0, count: duplicates.length, duplicates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/voters-list/:id/cancel', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { cancel_remarks } = req.body || {};
    const data = readVoters();
    const index = data.findIndex((item) => Number(item.id) === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    data[index] = {
      ...data[index],
      status: 'cancelled',
      cancel_remarks: cancel_remarks || ''
    };

    writeVoters(data);
    res.json({ success: true, message: 'Voter cancelled', voter: data[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/voters-list/:id/restore', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = readVoters();
    const index = data.findIndex((item) => Number(item.id) === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    data[index] = {
      ...data[index],
      status: 'active',
      cancel_remarks: ''
    };

    writeVoters(data);
    res.json({ success: true, message: 'Voter restored', voter: data[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voters-list/bulk', async (req, res) => {
  try {
    const { voters } = req.body || {};
    if (!Array.isArray(voters)) {
      return res.status(400).json({ error: 'voters array is required' });
    }

    const data = readVoters();
    const updates = []; 

    voters.forEach((entry) => {
      if (entry.id) {
        const index = data.findIndex((item) => Number(item.id) === Number(entry.id));
        if (index !== -1) {
          data[index] = {
            ...data[index],
            sr_number: entry.sr_number ?? data[index].sr_number ?? '',
            member_id: entry.member_id ?? data[index].member_id ?? '',
            voter_name: entry.voter_name ?? data[index].voter_name ?? '',
            gujarati_name: entry.gujarati_name ?? data[index].gujarati_name ?? '',
            gender: entry.gender ?? data[index].gender ?? '',
            birthdate: entry.birthdate ?? data[index].birthdate ?? '',
            age: entry.age ?? data[index].age ?? '',
            mobile: entry.mobile ?? data[index].mobile ?? '',
            mobile2: entry.mobile2 ?? data[index].mobile2 ?? '',
            address: entry.address ?? data[index].address ?? '',
            village: entry.village ?? data[index].village ?? '',
            email: entry.email ?? data[index].email ?? '',
            address_guj: entry.address_guj ?? data[index].address_guj ?? '',
            city_guj: entry.city_guj ?? data[index].city_guj ?? '',
            fee_payment: entry.fee_payment ?? data[index].fee_payment ?? '',
            photo: entry.photo ?? data[index].photo ?? '',
            status: entry.status ?? data[index].status ?? 'active',
            cancel_remarks: entry.cancel_remarks ?? data[index].cancel_remarks ?? ''
          };
          updates.push(data[index]);
          return;
        }
      }

      const newVoter = {
        id: (data.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1),
        sr_number: entry.sr_number ?? '',
        member_id: entry.member_id ?? '',
        voter_name: entry.voter_name ?? '',
        gujarati_name: entry.gujarati_name ?? '',
        gender: entry.gender ?? '',
        birthdate: entry.birthdate ?? '',
        age: entry.age ?? '',
        mobile: entry.mobile ?? '',
        mobile2: entry.mobile2 ?? '',
        address: entry.address ?? '',
        village: entry.village ?? '',
        email: entry.email ?? '',
        address_guj: entry.address_guj ?? '',
        city_guj: entry.city_guj ?? '',
        fee_payment: entry.fee_payment ?? '',
        photo: entry.photo ?? '',
        status: entry.status ?? 'active',
        cancel_remarks: entry.cancel_remarks ?? ''
      };
      data.push(newVoter);
      updates.push(newVoter);
    });

    writeVoters(data);
    res.json({ success: true, message: 'Bulk update completed', updated: updates.length, voters: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/add-to-candidate-list', requireAdmin, async (req, res) => {
  const { candidate_name, sr_number, member_id, candidate_number, logo_url } = req.body;
  const trimmedName = String(candidate_name || '').trim();
  const trimmedSrNumber = String(sr_number || '').trim();

  if (!trimmedName || !trimmedSrNumber) {
    return res.status(400).json({ error: 'Candidate name and SR number are required' });
  }

  try {
    const candidates = loadCandidateList();
    const payload = {
      id: (candidates.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1),
      candidate_name: trimmedName,
      sr_number: trimmedSrNumber,
      created_at: new Date().toISOString()
    };

    if (member_id) payload.member_id = member_id;
    if (candidate_number) payload.candidate_number = candidate_number;
    if (logo_url) payload.logo_url = logo_url;

    candidates.push(payload);
    saveCandidateList(candidates);

    res.json({ success: true, message: 'Added to candidate list', data: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/has-voted/:username', (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const log = loadBallotLog();
  const hasVoted = Object.values(log).some(e => e.entered_by === username);
  res.json({ hasVoted });
});

app.get('/ballots', async (req, res) => {
  try {
    const localCandidates = loadCandidateList();

    try {
      const { data, error } = await supabase
        .from('ballots')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error) {
        const safeBallots = (data || [])
          .filter((ballot) => ballot?.candidate_name || ballot?.sr_number || ballot?.sr_numbers)
          .map((ballot) => {
            const { entered_by, ...rest } = ballot;
            return rest;
          });

        const merged = [...localCandidates, ...safeBallots];
        return res.json(merged);
      }
    } catch (error) {
      console.warn('Supabase ballot lookup failed, falling back to local candidate list:', error.message);
    }

    res.json(localCandidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/ballots/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get the ballot to know which SR numbers to decrement
    const { data: ballot, error: fetchError } = await supabase
      .from('ballots')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    // 2. Decrement votes for each SR number in the ballot
    if (ballot.sr_numbers) {
      if (Array.isArray(ballot.sr_numbers)) {
        for (const sr_number of ballot.sr_numbers) {
          const { data: member } = await supabase.from('votes').select('id, total_votes').eq('sr_number', String(sr_number)).single();
          if (member) {
            const newVoteCount = Math.max(0, (member.total_votes || 0) - 1);
            await supabase.from('votes').update({ total_votes: newVoteCount }).eq('id', member.id);
          }
        }
      } else {
        // Handle object format
        for (const [sr_number, count] of Object.entries(ballot.sr_numbers)) {
          const { data: member } = await supabase.from('votes').select('id, total_votes').eq('sr_number', String(sr_number)).single();
          if (member) {
            const newVoteCount = Math.max(0, (member.total_votes || 0) - count);
            await supabase.from('votes').update({ total_votes: newVoteCount }).eq('id', member.id);
          }
        }
      }
    }

    // 3. Delete the ballot
    const { error: deleteError } = await supabase
      .from('ballots')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    // Clean up entry log
    removeBallotEntry(id);

    res.json({ success: true, message: 'Ballot deleted and votes adjusted' });
  } catch (error) {
    console.error('Delete ballot error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/ballots/:id', async (req, res) => {
  const { id } = req.params;
  const { sr_number, new_count } = req.body;

  try {
    const { data: ballot, error: fetchError } = await supabase.from('ballots').select('*').eq('id', id).single();
    if (fetchError || !ballot) return res.status(404).json({ error: 'Ballot not found' });

    let old_count = 0;
    if (Array.isArray(ballot.sr_numbers)) {
      old_count = ballot.sr_numbers.includes(String(sr_number)) ? 1 : 0;
    } else {
      old_count = ballot.sr_numbers[sr_number] || 0;
    }

    const diff = new_count - old_count;
    if (diff === 0) return res.json({ success: true, noChange: true });

    // Update member total
    const { data: member } = await supabase.from('votes').select('id, total_votes').eq('sr_number', String(sr_number)).single();
    if (!member) return res.status(404).json({ error: 'Candidate not found' });

    const new_total = Math.max(0, (member.total_votes || 0) + diff);
    await supabase.from('votes').update({ total_votes: new_total }).eq('id', member.id);

    // Update ballot content
    let updated_sr_numbers = ballot.sr_numbers;
    if (Array.isArray(updated_sr_numbers)) {
      // Convert to object/map for numeric support
      const obj = {};
      updated_sr_numbers.forEach(s => obj[s] = 1);
      updated_sr_numbers = obj;
    }
    updated_sr_numbers[sr_number] = new_count;

    await supabase.from('ballots').update({ sr_numbers: updated_sr_numbers }).eq('id', id);

    res.json({ success: true, new_ballot_count: new_count, new_member_total: new_total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/ballots/:id/batch', async (req, res) => {
  const { id } = req.params;
  const { sr_numbers } = req.body;

  if (!Array.isArray(sr_numbers)) {
    return res.status(400).json({ error: 'sr_numbers array is required' });
  }

  try {
    const { data: ballot, error: fetchError } = await supabase.from('ballots').select('*').eq('id', id).single();
    if (fetchError || !ballot) return res.status(404).json({ error: 'Ballot not found' });

    const oldSrs = new Set();
    if (Array.isArray(ballot.sr_numbers)) {
      ballot.sr_numbers.forEach(s => oldSrs.add(String(s)));
    } else {
      Object.keys(ballot.sr_numbers).forEach(s => {
        if ((ballot.sr_numbers[s] || 0) > 0) oldSrs.add(String(s));
      });
    }

    const newSrs = new Set(sr_numbers.map(s => String(s).trim()).filter(s => s));

    const added = [...newSrs].filter(s => !oldSrs.has(s));
    const removed = [...oldSrs].filter(s => !newSrs.has(s));

    for (const sr of removed) {
      const { data: member } = await supabase.from('votes').select('id, total_votes').eq('sr_number', sr).single();
      if (member) {
        const newTotal = Math.max(0, (member.total_votes || 0) - 1);
        await supabase.from('votes').update({ total_votes: newTotal }).eq('id', member.id);
      }
    }

    for (const sr of added) {
      const { data: member } = await supabase.from('votes').select('id, total_votes').eq('sr_number', sr).single();
      if (member) {
        const newTotal = (member.total_votes || 0) + 1;
        await supabase.from('votes').update({ total_votes: newTotal }).eq('id', member.id);
      }
    }

    const newSrArray = [...newSrs];
    await supabase.from('ballots').update({ sr_numbers: newSrArray }).eq('id', id);

    const updatedMembers = {};
    for (const sr of [...newSrs, ...removed]) {
      const { data: member } = await supabase.from('votes').select('sr_number, total_votes').eq('sr_number', sr).single();
      if (member) updatedMembers[member.sr_number] = member.total_votes;
    }

    res.json({ success: true, message: 'Ballot updated', updatedMembers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voters-list/by-sr/vote', async (req, res) => {
  const { sr_number, entered_by } = req.body;

  if (!sr_number) {
    return res.status(400).json({ error: 'SR Number is required' });
  }
  if (!entered_by) {
    return res.status(403).json({ error: 'Voting requires a signed-in member' });
  }
  if (!canUserVote(entered_by)) {
    return res.status(403).json({ error: 'Only member users can cast votes' });
  }

  try {
    const { data: existingBallot, error: existingError } = await supabase
      .from('ballots')
      .select('id')
      .eq('entered_by', entered_by)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }
    if (existingBallot) {
      return res.status(400).json({ error: 'You have already submitted a ballot' });
    }

    const { data: member, error: fetchError } = await supabase
      .from('votes')
      .select('id, total_votes')
      .eq('sr_number', String(sr_number))
      .single();

    if (fetchError || !member) {
      return res.status(404).json({ error: 'SR Number not found' });
    }

    const newVoteCount = (member.total_votes || 0) + 1;

    const { data, error: updateError } = await supabase
      .from('votes')
      .update({ total_votes: newVoteCount })
      .eq('id', member.id)
      .select();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    const { data: ballotData, error: ballotError } = await supabase
      .from('ballots')
      .insert({ sr_numbers: [String(sr_number)], entered_by })
      .select();
    if (ballotError) {
      console.error('❌ Failed to record ballot:', ballotError.message);
    } else if (ballotData && ballotData[0]) {
      setBallotEntry(ballotData[0].id, entered_by);
    }

    res.json({ success: true, message: 'Vote recorded', data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voters-list/by-sr/votes', async (req, res) => {
  let { sr_numbers, entered_by } = req.body;

  if (!sr_numbers || !Array.isArray(sr_numbers) || sr_numbers.length === 0) {
    return res.status(400).json({ error: 'SR Numbers array is required' });
  }
  if (!entered_by) {
    return res.status(403).json({ error: 'Voting requires a signed-in member' });
  }
  if (!canUserVote(entered_by)) {
    return res.status(403).json({ error: 'Only member users can cast votes' });
  }

  const uniqueSrNumbers = [...new Set(sr_numbers.map(sr => String(sr).trim()).filter(sr => sr))];
  if (uniqueSrNumbers.length === 0) {
    return res.status(400).json({ error: 'No valid SR numbers provided' });
  }
  if (uniqueSrNumbers.length > MAX_VOTE_SELECTION) {
    return res.status(400).json({ error: `Maximum of ${MAX_VOTE_SELECTION} candidates is allowed` });
  }

  try {
    const { data: existingBallot, error: existingError } = await supabase
      .from('ballots')
      .select('id')
      .eq('entered_by', entered_by)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }
    if (existingBallot) {
      return res.status(400).json({ error: 'You have already submitted a ballot' });
    }

    const results = [];
    const errors = [];
    const processedSrNumbers = [];

    for (const sr_number of uniqueSrNumbers) {
      try {
        const { data: member, error: fetchError } = await supabase
          .from('votes')
          .select('id, voter_name, total_votes')
          .eq('sr_number', String(sr_number))
          .single();

        if (fetchError || !member) {
          errors.push({ sr_number, error: 'SR Number not found' });
          continue;
        }

        const newVoteCount = (member.total_votes || 0) + 1;

        const { data, error: updateError } = await supabase
          .from('votes')
          .update({ total_votes: newVoteCount })
          .eq('id', member.id)
          .select();

        if (updateError) {
          errors.push({ sr_number, error: updateError.message });
          continue;
        }

        results.push({
          sr_number,
          success: true,
          data: data[0]
        });
        processedSrNumbers.push(String(sr_number));
      } catch (error) {
        errors.push({ sr_number, error: error.message });
      }
    }

    if (processedSrNumbers.length > 0) {
      const { data: ballotData, error: ballotError } = await supabase.from('ballots').insert({ sr_numbers: processedSrNumbers, entered_by }).select();
      if (ballotError) {
        console.error('❌ Failed to record multiple ballot:', ballotError.message);
      } else if (ballotData && ballotData[0]) {
        setBallotEntry(ballotData[0].id, entered_by);
      }
    }

    const response = {
      success: true,
      message: `Processed ${results.length} votes successfully`,
      processed: results.length,
      errors: errors.length,
      results: results,
      errors: errors
    };

    if (errors.length > 0) {
      response.warning = `${errors.length} SR numbers failed to process`;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voters-list/:id/vote', async (req, res) => {
  const { id } = req.params;

  try {
    // Get current vote count
    const { data: member, error: fetchError } = await supabase
      .from('votes')
      .select('total_votes')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Increment vote count
    const newVoteCount = (member.total_votes || 0) + 1;

    const { data, error: updateError } = await supabase
      .from('votes')
      .update({ total_votes: newVoteCount })
      .eq('id', id)
      .select();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Vote recorded', data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voters-list/bulk-update', async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Updates array is required' });
  }

  try {
    const updatePromises = updates.map(async (update) => {
      const { id, total_votes } = update;
      
      if (!id) {
        throw new Error('ID is required for each update');
      }
      
      const { data, error } = await supabase
        .from('votes')
        .update({ total_votes })
        .eq('id', id)
        .select();
        
      if (error) {
        throw error;
      }
      
      return data[0];
    });
    
    const results = await Promise.all(updatePromises);
    
    res.json({ 
      success: true, 
      message: 'Bulk update completed',
      updated: results.length
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voters list helpers — stored in JSON for performance, synced to trust.xlsx
const VOTERS_FILE = require('path').resolve(__dirname, 'voters.json');
const XLSX_FILE = require('path').resolve(__dirname, 'trust.xlsx');
function normalizeVoterRecord(voter, fallbackId = null) {
  const id = Number(voter.id ?? voter['Voter ID'] ?? fallbackId ?? 0);
  return {
    id: id || null,
    sr_number: voter.sr_number ?? voter['SR No'] ?? voter['SR. No.'] ?? voter['Sr. No.'] ?? voter['Voter ID'] ?? voter['Member No.'] ?? '',
    member_id: voter.member_id ?? voter['Member ID'] ?? voter['MemberID'] ?? voter['Member No.'] ?? '',
    voter_name: voter.voter_name ?? voter['English Name'] ?? voter['Name'] ?? voter['voter name'] ?? '',
    gujarati_name: voter.gujarati_name ?? voter['Gujarati Name'] ?? '',
    gender: voter.gender ?? voter['M/F'] ?? '',
    birthdate: voter.birthdate ?? voter['Birthdate'] ?? voter['Birth Date'] ?? '',
    age: voter.age ?? voter['AGE'] ?? '',
    mobile: voter.mobile ?? voter['Mobile No. 1'] ?? voter['Mobile no'] ?? voter['Mobile No'] ?? '',
    mobile2: voter.mobile2 ?? voter['Mobile No 2'] ?? voter['Mobile No.2'] ?? '',
    address: voter.address ?? voter['Address'] ?? '',
    village: voter.village ?? voter['Village'] ?? '',
    email: voter.email ?? voter['Email ID'] ?? '',
    address_guj: voter.address_guj ?? voter['Addres_guj'] ?? '',
    city_guj: voter.city_guj ?? voter['City_Gujarato'] ?? '',
    fee_payment: voter.fee_payment ?? voter['Fee Payment'] ?? voter['FEE Payment Date'] ?? voter['FeePaid'] ?? '',
    photo: voter.photo ?? voter['Photo'] ?? voter['Photo URL'] ?? voter['PhotoURL'] ?? '',
    status: voter.status ?? 'active',
    cancel_remarks: voter.cancel_remarks ?? ''
  };
}

function readVoters() {
  try {
    const raw = JSON.parse(fs.readFileSync(VOTERS_FILE, 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => normalizeVoterRecord(item, index + 1));
  } catch { return []; }
}
function writeVoters(data) {
  const normalized = (Array.isArray(data) ? data : []).map((item, index) => normalizeVoterRecord(item, index + 1));
  fs.writeFileSync(VOTERS_FILE, JSON.stringify(normalized, null, 2));
  // Also sync to trust.xlsx Voters List sheet (non-blocking try)
  try {
    const wb = XLSX.readFile(XLSX_FILE);
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 25 }, { wch: 10 },
    ];
    wb.Sheets['Voters List'] = ws;
    XLSX.writeFile(wb, XLSX_FILE);
  } catch (e) {
    console.error('Failed to sync trust.xlsx:', e.message);
  }
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
    console.error(`Run 'fuser -k ${PORT}/tcp' to free up the port, then try 'npm run dev' again.\n`);
    process.exit(1);
  }
});
