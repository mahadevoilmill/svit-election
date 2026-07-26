import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Users, Search, RefreshCw, Trash2, AlertCircle, CheckCircle2, PlusCircle, Download, XCircle, Undo2, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserPlus, Save } from 'lucide-react';

const createEmptyVoter = () => ({
  sr_number: '',
  member_id: '',
  voter_name: '',
  gujarati_name: '',
  gender: '',
  birthdate: '',
  age: '',
  mobile: '',
  mobile2: '',
  address: '',
  village: '',
  email: '',
  address_guj: '',
  city_guj: '',
  fee_payment: '',
  photo: '',
  status: 'active',
  cancel_remarks: ''
});

export default function VoterList({ user, setActiveTab, setCandidatePrefill }) {
  const [voters, setVoters] = useState([]);
  const [importing, setImporting] = useState(false);
  const [changedMap, setChangedMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  const [editingRowKey, setEditingRowKey] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [duplicateWarnings, setDuplicateWarnings] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(createEmptyVoter());
  const [addFormDup, setAddFormDup] = useState('');
  const [addFormSaving, setAddFormSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVoters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/voters-list', { headers: { 'X-Username': user?.username || '' } });
      const data = await res.json();
      setVoters(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching voters:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateMemberId = async (memberId, currentKey) => {
    if (!memberId || !memberId.trim()) {
      setDuplicateWarnings(prev => { const n = { ...prev }; delete n[currentKey]; return n; });
      return;
    }
    try {
      const res = await fetch(`/voters-list/check-member-id/${encodeURIComponent(memberId.trim())}`);
      const data = await res.json();
      if (data.exists) {
        setDuplicateWarnings(prev => ({ ...prev, [currentKey]: `Duplicate Member ID found ${data.count} time(s)` }));
      } else {
        setDuplicateWarnings(prev => { const n = { ...prev }; delete n[currentKey]; return n; });
      }
    } catch {
      setDuplicateWarnings(prev => { const n = { ...prev }; delete n[currentKey]; return n; });
    }
  };

  const checkAddFormDup = async (memberId) => {
    if (!memberId || !memberId.trim()) { setAddFormDup(''); return; }
    try {
      const res = await fetch(`/voters-list/check-member-id/${encodeURIComponent(memberId.trim())}`);
      const data = await res.json();
      setAddFormDup(data.exists ? `Duplicate Member ID found ${data.count} time(s)` : '');
    } catch { setAddFormDup(''); }
  };

  const openAddForm = () => {
    setAddForm(createEmptyVoter());
    setAddFormDup('');
    setShowAddForm(true);
  };

  const handleAddFormChange = (field, value) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (field === 'member_id') checkAddFormDup(value);
  };

  const handleAddFormSubmit = async () => {
    if (!addForm.voter_name.trim() && !addForm.sr_number.trim()) {
      setStatusMsg({ type: 'error', text: 'SR Number or Name is required.' });
      return;
    }
    if (addFormDup) {
      setStatusMsg({ type: 'error', text: 'Cannot save: Duplicate Member ID. Please fix it first.' });
      return;
    }
    setAddFormSaving(true);
    try {
      const res = await fetch('/voters-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Voter "${addForm.voter_name}" added successfully` });
        setShowAddForm(false);
        setAddForm(createEmptyVoter());
        setAddFormDup('');
        fetchVoters();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: data.error || 'Failed to add voter' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Server error while saving.' });
    } finally {
      setAddFormSaving(false);
    }
  };

  const parseExcelFileLocally = (file, onComplete) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
      const mapped = data.map((r, idx) => ({
        sr_number: r['Sr. No.'] || r['SR No'] || r['SR. No.'] || r['SR No.'] || r['sr_number'] || r['sr'] || r['Sr'] || '',
        member_id: r['Member No.'] || r['Member ID'] || r['MemberID'] || r['member_id'] || '',
        voter_name: r['English Name'] || r['voter Name'] || r['Voter Name'] || r['voter name'] || r['Name'] || r['name'] || r['voter_name'] || '',
        gujarati_name: r['Gujarati Name'] || r['gujarati_name'] || '',
        gender: r['M/F'] || r['Gender'] || r['gender'] || '',
        birthdate: r['Birthdate'] || r['Birth Date'] || r['DOB'] || '',
        age: r['AGE'] || r['Age'] || r['age'] || '',
        mobile: r['Mobile No. 1'] || r['Mobile no'] || r['Mobile No'] || r['Mobile No. 1'] || r['mobile'] || '',
        mobile2: r['Mobile No 2'] || r['Mobile No.2'] || r['mobile2'] || '',
        address: r['Address'] || r['address'] || '',
        village: r['Village'] || r['village'] || '',
        email: r['Email ID'] || r['Email'] || r['email'] || '',
        address_guj: r['Addres_guj'] || r['address_guj'] || '',
        city_guj: r['City_Gujarato'] || r['city_guj'] || '',
        fee_payment: r['FEE Payment Date'] || r['Fee Payment'] || r['FeePaid'] || r['fee_payment'] || '',
        photo: r['Photo'] || r['photo'] || r['Photo URL'] || r['PhotoURL'] || '',
        status: 'active',
        cancel_remarks: '',
        _importIndex: idx
      }));

      onComplete?.(mapped);
    };
    reader.onerror = () => {
      setStatusMsg({ type: 'error', text: 'Unable to read the selected Excel file.' });
      setImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  const uploadParsedRows = async (rows) => {
    const username = user?.username || localStorage.getItem('username') || 'NEST';
    try {
      const res = await fetch('/voters-list/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': username },
        body: JSON.stringify({ voters: rows })
      });
      const payload = await res.json().catch(() => ({}));
      return res.ok && payload.success;
    } catch (err) {
      return false;
    }
  };

  const uploadExcelFile = async (file) => {
    const username = user?.username || localStorage.getItem('username') || 'NEST';
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/upload-excel', {
        method: 'POST',
        headers: { 'X-Username': username },
        body: formData
      });

      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.success) {
        setStatusMsg({ type: 'success', text: payload.message || `Imported ${payload.imported || payload.processedCount || 0} rows from ${file.name}` });
        setSelectedFileName(file.name);
        await fetchVoters();
        return;
      }

      setStatusMsg({ type: 'error', text: payload.error || 'Excel upload failed. Trying local import fallback.' });
      parseExcelFileLocally(file, async (mapped) => {
        const uploaded = await uploadParsedRows(mapped);
        if (uploaded) {
          setStatusMsg({ type: 'success', text: `Imported ${mapped.length} rows from ${file.name}` });
          setSelectedFileName(file.name);
          await fetchVoters();
        } else {
          setVoters((prev) => [...mapped, ...prev]);
          setStatusMsg({ type: 'success', text: `Imported ${mapped.length} rows locally from ${file.name}` });
          setSelectedFileName(file.name);
        }
        setImporting(false);
      });
    } catch (err) {
      console.error('Excel upload failed:', err);
      setStatusMsg({ type: 'error', text: 'Unable to upload Excel file. Please try again.' });
      parseExcelFileLocally(file, async (mapped) => {
        const uploaded = await uploadParsedRows(mapped);
        if (uploaded) {
          setStatusMsg({ type: 'success', text: `Imported ${mapped.length} rows from ${file.name}` });
          setSelectedFileName(file.name);
          await fetchVoters();
        } else {
          setVoters((prev) => [...mapped, ...prev]);
          setStatusMsg({ type: 'success', text: `Imported ${mapped.length} rows locally from ${file.name}` });
          setSelectedFileName(file.name);
        }
        setImporting(false);
      });
    }
  };

  const handleFileInput = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setImporting(true);
    uploadExcelFile(f);
  };

  const getKey = (r) => (r && r.id) ? String(r.id) : `i_${r?._importIndex ?? 'new'}`;

  const markChanged = (key) => setChangedMap((m) => ({ ...m, [key]: true }));

  const clearChanged = (key) => setChangedMap((m) => {
    const next = { ...m };
    delete next[key];
    return next;
  });

  const handleFieldChange = (key, field, value) => {
    setVoters((prev) => prev.map((r) => {
      const k = getKey(r);
      return k === key ? { ...r, [field]: value } : r;
    }));
    markChanged(key);
    if (field === 'member_id') {
      checkDuplicateMemberId(value, key);
    }
  };

  const handleAddRow = () => {
    const newRow = { ...createEmptyVoter(), _importIndex: Date.now() };
    const key = getKey(newRow);
    setVoters((prev) => [newRow, ...prev]);
    setEditingRowKey(key);
    setChangedMap((m) => ({ ...m, [key]: true }));
  };

  const saveRow = async (row) => {
    const key = getKey(row);
    if (duplicateWarnings[key]) {
      setStatusMsg({ type: 'error', text: 'Cannot save: Duplicate Member ID detected. Please fix the Member ID first.' });
      return;
    }
    try {
      const payload = {
        sr_number: row.sr_number,
        member_id: row.member_id,
        voter_name: row.voter_name,
        gujarati_name: row.gujarati_name,
        gender: row.gender,
        birthdate: row.birthdate,
        age: row.age,
        mobile: row.mobile,
        mobile2: row.mobile2,
        address: row.address,
        village: row.village,
        email: row.email,
        address_guj: row.address_guj,
        city_guj: row.city_guj,
        fee_payment: row.fee_payment,
        photo: row.photo,
        status: row.status || 'active',
        cancel_remarks: row.cancel_remarks || ''
      };
      let res;
      if (row.id) {
        res = await fetch(`/voters-list/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/voters-list', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' }, body: JSON.stringify(payload) });
      }
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Saved successfully' });
        clearChanged(key);
        setEditingRowKey((current) => (current === key ? null : current));
        fetchVoters();
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to save this row' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Server error while saving.' });
    }
  };

  const saveAll = async () => {
    const unsaved = voters.filter((r) => !r.id || changedMap[getKey(r)]);
    if (unsaved.length === 0) return setStatusMsg({ type: 'success', text: 'No changes to save' });
    const dupKeys = unsaved.filter(r => duplicateWarnings[getKey(r)]);
    if (dupKeys.length > 0) {
      return setStatusMsg({ type: 'error', text: `Cannot save: ${dupKeys.length} row(s) have duplicate Member IDs. Please fix them first.` });
    }
    try {
      const res = await fetch('/voters-list/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' }, body: JSON.stringify({ voters: unsaved.map((r) => ({ id: r.id, sr_number: r.sr_number, member_id: r.member_id, voter_name: r.voter_name, gujarati_name: r.gujarati_name, gender: r.gender, birthdate: r.birthdate, age: r.age, mobile: r.mobile, mobile2: r.mobile2, address: r.address, village: r.village, email: r.email, address_guj: r.address_guj, city_guj: r.city_guj, fee_payment: r.fee_payment, photo: r.photo, status: r.status || 'active', cancel_remarks: r.cancel_remarks || '' })) }) });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'All changes updated successfully' });
        setChangedMap({});
        setEditingRowKey(null);
        fetchVoters();
      } else {
        for (const r of unsaved) await saveRow(r);
      }
    } catch (err) {
      for (const r of unsaved) await saveRow(r);
    }
  };

  const handleDelete = async (row) => {
    const key = getKey(row);
    if (!window.confirm('Delete this voter?')) return;
    if (!row.id) {
      setVoters((prev) => prev.filter((item) => getKey(item) !== key));
      clearChanged(key);
      setEditingRowKey((current) => (current === key ? null : current));
      setStatusMsg({ type: 'success', text: 'Row removed locally' });
      return;
    }
    try {
      const res = await fetch(`/voters-list/${row.id}`, { method: 'DELETE', headers: { 'X-Username': user?.username || '' } });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Voter deleted' });
        fetchVoters();
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to delete' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Server error' });
    }
  };

  const handleCancel = (row) => {
    setCancelModal(row);
    setCancelRemarks('');
  };

  const confirmCancel = async () => {
    if (!cancelModal) return;
    if (!cancelRemarks.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter remarks for cancellation.' });
      return;
    }
    try {
      const res = await fetch(`/voters-list/${cancelModal.id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' },
        body: JSON.stringify({ cancel_remarks: cancelRemarks.trim() })
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Voter "${cancelModal.voter_name}" cancelled successfully` });
        setCancelModal(null);
        setCancelRemarks('');
        fetchVoters();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: data.error || 'Failed to cancel voter' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Server error while cancelling.' });
    }
  };

  const handleRestore = async (row) => {
    if (!row.id) return;
    if (!window.confirm(`Restore "${row.voter_name}" to active status?`)) return;
    try {
      const res = await fetch(`/voters-list/${row.id}/restore`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' }
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Voter "${row.voter_name}" restored to active` });
        fetchVoters();
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to restore voter' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Server error while restoring.' });
    }
  };

  const handleMakeCandidate = (v) => {
    if (!window.confirm(`Prefill candidate form for ${v.voter_name || v.name || 'this voter'}?`)) return;
    const sr = v.sr_number || v.srNo || v['Member No.'] || v['Voter ID'] || '';
    const name = v.voter_name || v.name || v['Name'] || '';
    const logo = v.logo || v.photo || v.image || v.logo_url || v['Photo URL'] || v['PhotoURL'] || '';
    if (setCandidatePrefill) setCandidatePrefill({ candidate_name: name, sr_number: sr, logo_url: logo });
    if (setActiveTab) setActiveTab('candidates');
  };

  const filtered = voters.filter((v) => {
    if (statusFilter === 'active' && v.status === 'cancelled') return false;
    if (statusFilter === 'cancelled' && v.status !== 'cancelled') return false;
    const term = searchTerm.toLowerCase();
    const sr = String(v.sr_number || v.srNo || v['Voter ID'] || '').toLowerCase();
    const name = String(v.voter_name || v.name || v['English Name'] || v['Name'] || '').toLowerCase();
    const village = String(v.village || v['Village'] || '').toLowerCase();
    const address = String(v.address || '').toLowerCase();
    const mobile = String(v.mobile || '').toLowerCase();
    return sr.includes(term) || name.includes(term) || village.includes(term) || address.includes(term) || mobile.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * pageSize;
  const pagedVoters = filtered.slice(startIdx, startIdx + pageSize);
  const totalCount = voters.length;
  const activeCount = voters.filter(v => v.status !== 'cancelled').length;
  const cancelledCount = voters.filter(v => v.status === 'cancelled').length;

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Voter List</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Bulk Excel import + inline edit / save / update for voter records</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Upload Excel
            </button>
            <a href="/voter-template" download="voter-template.xlsx" className="btn btn-secondary" style={{ padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
              <Download size={16} /> Template
            </a>
          </div>

          <button onClick={openAddForm} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <PlusCircle size={16} /> New Entry
          </button>

          <button onClick={saveAll} className="btn btn-primary" style={{ padding: '8px 16px' }}>Update All</button>

          <button onClick={fetchVoters} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          color: statusMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: '420px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text" className="form-input" style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
              placeholder="Search by SR No, Name, Village, Address or Mobile..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {['all', 'active', 'cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '6px 14px', fontSize: '0.8rem', border: 'none', cursor: 'pointer',
                    background: statusFilter === f ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: statusFilter === f ? '#38bdf8' : '#94a3b8',
                    fontWeight: statusFilter === f ? 600 : 400
                  }}
                >
                  {f === 'all' && `All (${totalCount})`}
                  {f === 'active' && `Active (${activeCount})`}
                  {f === 'cancelled' && `Cancelled (${cancelledCount})`}
                </button>
              ))}
            </div>
          </div>

          {selectedFileName && <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loaded file: {selectedFileName}</div>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading voter data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '1800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--color-bg-card, #121a2b)', zIndex: 1 }}>SR No</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Member No</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Gujarati Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>M/F</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Birthdate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Age</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Mobile</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Mobile 2</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Address</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Village</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Address (Guj)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>City (Guj)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Fee Paid</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Photo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedVoters.map((v, i) => {
                  const key = getKey(v) || `i_${i}`;
                  const isEditing = editingRowKey === key;
                  const isCancelled = v.status === 'cancelled';
                  const hasDup = !!duplicateWarnings[key];
                  const inpStyle = { padding: '6px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', width: '100%', boxSizing: 'border-box' };
                  const inp = (field, w) => (
                    <input style={{ ...inpStyle, width: w || '100%' }} value={v[field] || ''} onChange={(e) => handleFieldChange(key, field, e.target.value)} disabled={!isEditing} />
                  );
                  return (
                    <tr key={key} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isCancelled ? 'rgba(239, 68, 68, 0.05)' : hasDup ? 'rgba(251, 191, 36, 0.05)' : 'transparent'
                    }}>
                      <td style={{ padding: '6px 8px', position: 'sticky', left: 0, background: isCancelled ? 'rgba(30, 20, 20, 0.95)' : hasDup ? 'rgba(30, 28, 15, 0.95)' : 'var(--color-bg-card, #121a2b)', zIndex: 1 }}>{inp('sr_number', '70px')}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {inp('member_id', '90px')}
                        {hasDup && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <AlertTriangle size={12} color="#fbbf24" />
                            <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{duplicateWarnings[key]}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px' }}>{inp('voter_name', '140px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('gujarati_name', '120px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('gender', '45px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('birthdate', '90px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('age', '50px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('mobile', '110px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('mobile2', '110px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('address', '130px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('village', '100px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('email', '130px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('address_guj', '120px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('city_guj', '90px')}</td>
                      <td style={{ padding: '6px 8px' }}>{inp('fee_payment', '90px')}</td>
                      <td style={{ padding: '6px 8px', width: 140 }}>
                        {inp('photo', '120px')}
                        {v.photo && <img src={v.photo} alt="photo" style={{ maxWidth: 40, maxHeight: 40, marginTop: 4, borderRadius: 6 }} />}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        {isCancelled ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>Cancelled</span>
                            {v.cancel_remarks && (
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.cancel_remarks}>
                                {v.cancel_remarks}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingRowKey(null);
                                clearChanged(key);
                              } else {
                                setEditingRowKey(key);
                              }
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '0.7rem' }}
                            title={isEditing ? 'Cancel edit' : 'Edit row'}
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>

                          {user?.role === 'admin' && (
                            <button onClick={() => handleMakeCandidate(v)} className="btn btn-success" style={{ padding: '5px 8px', fontSize: '0.7rem' }} title="Prefill candidate form">
                              Candidate
                            </button>
                          )}

                          <button onClick={() => saveRow(v)} className="btn btn-primary" style={{ padding: '5px 8px', fontSize: '0.7rem' }} title="Save row">
                            Save
                          </button>

                          {!isCancelled && v.id && (
                            <button
                              onClick={() => handleCancel(v)}
                              style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '4px' }}
                              title="Cancel voter with remarks"
                            >
                              <XCircle size={14} />
                            </button>
                          )}

                          {isCancelled && v.id && (
                            <button
                              onClick={() => handleRestore(v)}
                              style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: '4px' }}
                              title="Restore voter to active"
                            >
                              <Undo2 size={14} />
                            </button>
                          )}

                          <button onClick={() => handleDelete(v)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }} title="Delete row">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={18} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No voters found</td></tr>
                )}
              </tbody>
            </table>

            {filtered.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 0', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 8 }}>
                    Showing {startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)} of {filtered.length}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={safeCurrentPage === 1}
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: safeCurrentPage === 1 ? '#475569' : '#94a3b8',
                      cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem'
                    }}
                    title="First page"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: safeCurrentPage === 1 ? '#475569' : '#94a3b8',
                      cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem'
                    }}
                    title="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (safeCurrentPage <= 4) {
                      page = i + 1;
                    } else if (safeCurrentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = safeCurrentPage - 3 + i;
                    }
  const labelStyle = { fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 500 };
  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: 'inherit', boxSizing: 'border-box', outline: 'none'
  };

  return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: safeCurrentPage === page ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                          background: safeCurrentPage === page ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: safeCurrentPage === page ? '#38bdf8' : '#94a3b8',
                          cursor: 'pointer', fontSize: '0.8rem', fontWeight: safeCurrentPage === page ? 600 : 400
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: safeCurrentPage === totalPages ? '#475569' : '#94a3b8',
                      cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem'
                    }}
                    title="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: safeCurrentPage === totalPages ? '#475569' : '#94a3b8',
                      cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem'
                    }}
                    title="Last page"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {cancelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setCancelModal(null)}>
          <div
            className="glass-panel"
            style={{ padding: '2rem', maxWidth: '480px', width: '90%', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fbbf24' }}>Cancel Voter</h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Are you sure you want to cancel <strong style={{ color: '#fca5a5' }}>{cancelModal.voter_name}</strong> (Member ID: {cancelModal.member_id || 'N/A'})?
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Remarks (required):</label>
              <textarea
                value={cancelRemarks}
                onChange={(e) => setCancelRemarks(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
                style={{
                  width: '100%', padding: '8px 12px', fontSize: '0.875rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCancelModal(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={confirmCancel} style={{ background: 'rgba(239, 68, 68, 0.8)' }}>
                <XCircle size={14} /> Cancel Voter
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '12px', color: '#38bdf8' }}>
                <UserPlus size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>New Voter Entry</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Fill in the voter details below</p>
              </div>
            </div>
            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
              <XCircle size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>SR Number *</label>
              <input style={inputStyle} value={addForm.sr_number} onChange={e => handleAddFormChange('sr_number', e.target.value)} placeholder="e.g. 101" />
            </div>
            <div>
              <label style={labelStyle}>Member ID</label>
              <input style={{ ...inputStyle, borderColor: addFormDup ? '#fbbf24' : undefined }} value={addForm.member_id} onChange={e => handleAddFormChange('member_id', e.target.value)} placeholder="e.g. M-001" />
              {addFormDup && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertTriangle size={12} color="#fbbf24" />
                  <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{addFormDup}</span>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Voter Name (English) *</label>
              <input style={inputStyle} value={addForm.voter_name} onChange={e => handleAddFormChange('voter_name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label style={labelStyle}>Gujarati Name</label>
              <input style={inputStyle} value={addForm.gujarati_name} onChange={e => handleAddFormChange('gujarati_name', e.target.value)} placeholder="Name in Gujarati" />
            </div>
            <div>
              <label style={labelStyle}>Gender (M/F)</label>
              <select style={inputStyle} value={addForm.gender} onChange={e => handleAddFormChange('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="M">M - Male</option>
                <option value="F">F - Female</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Birthdate</label>
              <input style={inputStyle} type="date" value={addForm.birthdate} onChange={e => handleAddFormChange('birthdate', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input style={inputStyle} type="number" min="0" max="150" value={addForm.age} onChange={e => handleAddFormChange('age', e.target.value)} placeholder="Age" />
            </div>
            <div>
              <label style={labelStyle}>Mobile Number</label>
              <input style={inputStyle} type="tel" value={addForm.mobile} onChange={e => handleAddFormChange('mobile', e.target.value)} placeholder="Primary mobile" />
            </div>
            <div>
              <label style={labelStyle}>Mobile Number 2</label>
              <input style={inputStyle} type="tel" value={addForm.mobile2} onChange={e => handleAddFormChange('mobile2', e.target.value)} placeholder="Secondary mobile" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={addForm.email} onChange={e => handleAddFormChange('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} value={addForm.address} onChange={e => handleAddFormChange('address', e.target.value)} placeholder="Full address" />
            </div>
            <div>
              <label style={labelStyle}>Village</label>
              <input style={inputStyle} value={addForm.village} onChange={e => handleAddFormChange('village', e.target.value)} placeholder="Village / City" />
            </div>
            <div>
              <label style={labelStyle}>Address (Gujarati)</label>
              <input style={inputStyle} value={addForm.address_guj} onChange={e => handleAddFormChange('address_guj', e.target.value)} placeholder="Address in Gujarati" />
            </div>
            <div>
              <label style={labelStyle}>City (Gujarati)</label>
              <input style={inputStyle} value={addForm.city_guj} onChange={e => handleAddFormChange('city_guj', e.target.value)} placeholder="City in Gujarati" />
            </div>
            <div>
              <label style={labelStyle}>Fee Payment Date</label>
              <input style={inputStyle} type="date" value={addForm.fee_payment} onChange={e => handleAddFormChange('fee_payment', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Photo URL</label>
              <input style={inputStyle} value={addForm.photo} onChange={e => handleAddFormChange('photo', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={addForm.status || 'active'} onChange={e => handleAddFormChange('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {addForm.photo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
              <img src={addForm.photo} alt="preview" style={{ maxWidth: 60, maxHeight: 60, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)} style={{ padding: '10px 20px' }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddFormSubmit} disabled={addFormSaving || !!addFormDup} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {addFormSaving ? (
                <><RefreshCw size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={14} /> Save Voter</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
