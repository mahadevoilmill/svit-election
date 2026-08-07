import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Users, Search, RefreshCw, Trash2, AlertCircle, CheckCircle2, PlusCircle, Download, XCircle, Undo2, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserPlus, Save, Columns } from 'lucide-react';

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
  const LIST_STATE_KEY = 'svit_voterlist_state';
  const loadListState = () => {
    try {
      const saved = localStorage.getItem(LIST_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          statusFilter: typeof parsed.statusFilter === 'string' ? parsed.statusFilter : 'active',
          currentPage: Number.isFinite(Number(parsed.currentPage)) && Number(parsed.currentPage) > 0 ? Number(parsed.currentPage) : 1,
          pageSize: [25, 50, 100].includes(Number(parsed.pageSize)) ? Number(parsed.pageSize) : 25
        };
      }
    } catch {}
    return { statusFilter: 'active', currentPage: 1, pageSize: 25 };
  };

  const [voters, setVoters] = useState([]);
  const [importing, setImporting] = useState(false);
  const [changedMap, setChangedMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  const [editingRowKey, setEditingRowKey] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => loadListState().statusFilter);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [duplicateWarnings, setDuplicateWarnings] = useState({});
  const [currentPage, setCurrentPage] = useState(() => loadListState().currentPage);
  const [pageSize, setPageSize] = useState(() => loadListState().pageSize);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(createEmptyVoter());
  const [addFormDup, setAddFormDup] = useState('');
  const [addFormSaving, setAddFormSaving] = useState(false);
  const [addFormPhotoFile, setAddFormPhotoFile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showColPicker, setShowColPicker] = useState(false);
  const [bulkPhotoUploading, setBulkPhotoUploading] = useState(false);
  const [bulkPhotoMsg, setBulkPhotoMsg] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkTab, setBulkTab] = useState('skipped');
  const bulkPhotoInputRef = useRef(null);
const COLUMN_STORAGE_KEY = 'svit_voterlist_columns';
const defaultColumns = [
    { key: 'sr_number', label: 'SR No', visible: true, builtIn: true },
    { key: 'member_id', label: 'Member No', visible: true, builtIn: true },
    { key: 'voter_name', label: 'Name', visible: true, builtIn: true },
    { key: 'gujarati_name', label: 'Gujarati Name', visible: true, builtIn: true },
    { key: 'gender', label: 'M/F', visible: true, builtIn: true },
    { key: 'birthdate', label: 'Birthdate', visible: true, builtIn: true },
    { key: 'age', label: 'Age', visible: true, builtIn: true },
    { key: 'mobile', label: 'Mobile', visible: true, builtIn: true },
    { key: 'mobile2', label: 'Mobile 2', visible: true, builtIn: true },
    { key: 'address', label: 'Address', visible: true, builtIn: true },
    { key: 'village', label: 'Village', visible: true, builtIn: true },
    { key: 'email', label: 'Email', visible: true, builtIn: true },
    { key: 'address_guj', label: 'Address (Guj)', visible: true, builtIn: true },
    { key: 'city_guj', label: 'City (Guj)', visible: true, builtIn: true },
    { key: 'fee_payment', label: 'Fee Paid', visible: true, builtIn: true },
    { key: 'photo', label: 'Photo', visible: true, builtIn: true },
    { key: 'status', label: 'Status', visible: true, builtIn: true },
    { key: 'total_votes', label: 'Votes', visible: true, builtIn: true }
];
const loadColumns = () => {
    try {
        const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return defaultColumns;
};
const [columns, setColumns] = useState(loadColumns);
const [newColName, setNewColName] = useState('');
const [newColLabel, setNewColLabel] = useState('');
const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVoters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    try { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns)); } catch {}
  }, [columns]);

  useEffect(() => {
    try {
      localStorage.setItem(LIST_STATE_KEY, JSON.stringify({ statusFilter, currentPage, pageSize }));
    } catch {}
  }, [statusFilter, currentPage, pageSize]);

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
        const savedData = await res.json().catch(() => ({}));
        if (addFormPhotoFile && (savedData.id || addForm.sr_number)) {
          const fd = new FormData();
          fd.append('photo', addFormPhotoFile);
          if (savedData.id) fd.append('voter_id', savedData.id);
          if (addForm.sr_number) fd.append('sr_number', addForm.sr_number);
          await fetch('/upload-voter-photo', { method: 'POST', body: fd }).catch(() => {});
        }
        setStatusMsg({ type: 'success', text: `Voter "${addForm.voter_name}" added successfully` });
        setShowAddForm(false);
        setAddForm(createEmptyVoter());
        setAddFormDup('');
        setAddFormPhotoFile(null);
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

  const handleBulkPhotoUpload = async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;
    setBulkPhotoUploading(true);
    setBulkPhotoMsg(null);
    setBulkResults(null);
    let matched = 0;
    let skipped = 0;
    let lastError = '';
    const matchedResults = [];
    const skippedResults = [];
    try {
      const BATCH = 500;
      for (let i = 0; i < list.length; i += BATCH) {
        const batch = list.slice(i, i + BATCH);
        const fd = new FormData();
        for (const f of batch) fd.append('photos', f);
        const res = await fetch('/upload-voter-photos-bulk', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          matched += data.matched || 0;
          skipped += data.skipped || 0;
          if (Array.isArray(data.results)) {
            for (const r of data.results) {
              if (r.status === 'matched') matchedResults.push(r);
              else skippedResults.push(r);
            }
          }
        } else {
          lastError = data.error || 'Bulk upload failed';
        }
      }
      setBulkResults({ matched: matchedResults, skipped: skippedResults });
      setBulkTab(skippedResults.length > 0 ? 'skipped' : 'matched');
      if (lastError) {
        setBulkPhotoMsg({ type: 'error', text: `${lastError} (Matched ${matched}, skipped ${skipped} before stopping.)` });
      } else {
        setBulkPhotoMsg({ type: 'success', text: `Matched ${matched} photo(s) to voters. Skipped ${skipped}.` });
      }
      fetchVoters();
    } catch {
      setBulkPhotoMsg({ type: 'error', text: `Server error during bulk upload. (Matched ${matched}, skipped ${skipped} before stopping.)` });
    } finally {
      setBulkPhotoUploading(false);
      if (bulkPhotoInputRef.current) bulkPhotoInputRef.current.value = '';
    }
  };

  const handleClearAllPhotos = async () => {
    if (!window.confirm('Delete ALL voter photos? This will remove every photo from the voter list so you can upload new ones. This cannot be undone.')) return;
    setBulkPhotoUploading(true);
    setBulkPhotoMsg(null);
    setBulkResults(null);
    try {
      const res = await fetch('/voters-list/clear-photos', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBulkPhotoMsg({ type: 'success', text: data.message || 'All photos deleted.' });
        fetchVoters();
      } else {
        setBulkPhotoMsg({ type: 'error', text: data.error || 'Failed to delete photos.' });
      }
    } catch {
      setBulkPhotoMsg({ type: 'error', text: 'Server error while deleting photos.' });
    } finally {
      setBulkPhotoUploading(false);
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

  const handleBulkDelete = async () => {
    const ids = [...selectedIds].map(Number).filter(Boolean);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected voter(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch('/voters-list/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' },
        body: JSON.stringify({ ids })
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatusMsg({ type: 'success', text: payload.message || `${ids.length} voter(s) deleted` });
        setSelectedIds(new Set());
        fetchVoters();
      } else {
        setStatusMsg({ type: 'error', text: payload.error || 'Bulk delete failed' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Server error during bulk delete' });
    }
  };

  const toggleSelectAll = () => {
    const pagedKeys = new Set(pagedVoters.map(v => String(v.id)).filter(Boolean));
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = [...pagedKeys].every(k => next.has(k));
      if (allSelected) {
        pagedKeys.forEach(k => next.delete(k));
      } else {
        pagedKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const sid = String(id);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
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
    const sr = v.sr_number || '';
    const name = v.voter_name || v.name || '';
    const logo = v.logo || '';
    const memberId = v.member_id || '';
    const address = v.address || v.address_guj || '';
    const mobile = v.mobile || v.mobile2 || '';
    const photo = v.photo || '';
    if (setCandidatePrefill) setCandidatePrefill({ candidate_name: name, sr_number: sr, logo_url: logo, member_id: memberId, address, mobile, photo });
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

  const toggleCol = (idx) => setColumns(prev => prev.map((c, i) => i === idx ? { ...c, visible: !c.visible } : c));

  const moveCol = (idx, dir) => {
    setColumns(prev => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const addCustomCol = () => {
    if (!newColName.trim() || !newColLabel.trim()) return;
    const key = 'custom_' + newColName.trim().toLowerCase().replace(/\s+/g, '_');
    if (columns.some(c => c.key === key)) return;
    setColumns(prev => [...prev, { key, label: newColLabel.trim(), visible: true, builtIn: false }]);
    setNewColName('');
    setNewColLabel('');
  };

  const removeCustomCol = (idx) => {
    setColumns(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDownloadExcel = () => {
    try {
      const visibleCols = columns.filter(c => c.visible);
      const rows = filtered.map(v => {
        const row = {};
        visibleCols.forEach(c => {
          row[c.label] = v[c.key] !== undefined && v[c.key] !== null ? v[c.key] : '';
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Voters');
      XLSX.writeFile(wb, `voter-list-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Excel download error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to download Excel: ' + (err.message || 'Unknown error') });
    }
  };

  const labelStyle = { fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 500 };
  const inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: 'inherit', boxSizing: 'border-box', outline: 'none'
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
            <input ref={bulkPhotoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleBulkPhotoUpload(e.target.files)} />
            <button type="button" className="btn btn-secondary" onClick={() => bulkPhotoInputRef.current?.click()} disabled={bulkPhotoUploading} style={{ padding: '8px 16px' }}>
              {bulkPhotoUploading ? 'Uploading...' : 'Bulk Upload Photos'}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleClearAllPhotos} disabled={bulkPhotoUploading} style={{ padding: '8px 16px' }}>
              <Trash2 size={16} /> Delete All Photos
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleDownloadExcel} style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Download size={16} /> Download Excel Sheet
            </button>
            <a href="/voter-template" download="voter-template.xlsx" className="btn btn-secondary" style={{ padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
              <Download size={16} /> Template
            </a>
          </div>

          <button onClick={openAddForm} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <PlusCircle size={16} /> New Entry
          </button>

          <button onClick={saveAll} className="btn btn-primary" style={{ padding: '8px 16px' }}>Update All</button>

          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="btn" style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.8)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={16} /> Delete Selected ({selectedIds.size})
            </button>
          )}

          <button onClick={fetchVoters} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            <RefreshCw size={16} /> Refresh
          </button>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowColPicker(!showColPicker)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
              <Columns size={16} /> Columns
            </button>
            {showColPicker && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#1a2332', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', zIndex: 100, minWidth: 260, maxHeight: 450, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                {columns.map((c, idx) => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '0.8rem', color: '#e2e8f0' }}>
                    <input type="checkbox" checked={c.visible} onChange={() => toggleCol(idx)} style={{ accentColor: '#38bdf8', flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                    <button onClick={() => moveCol(idx, -1)} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? '#334155' : '#94a3b8', cursor: idx === 0 ? 'default' : 'pointer', padding: 0, lineHeight: 1, fontSize: '0.7rem' }} title="Move up">&#9650;</button>
                    <button onClick={() => moveCol(idx, 1)} disabled={idx === columns.length - 1} style={{ background: 'none', border: 'none', color: idx === columns.length - 1 ? '#334155' : '#94a3b8', cursor: idx === columns.length - 1 ? 'default' : 'pointer', padding: 0, lineHeight: 1, fontSize: '0.7rem' }} title="Move down">&#9660;</button>
                    {!c.builtIn && <button onClick={() => removeCustomCol(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '0.75rem' }} title="Remove column">&#10005;</button>}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, paddingTop: 6 }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 4 }}>Add Custom Column</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Field name" style={{ flex: 1, padding: '4px 6px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    <input value={newColLabel} onChange={e => setNewColLabel(e.target.value)} placeholder="Label" style={{ flex: 1, padding: '4px 6px', fontSize: '0.75rem', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} />
                    <button onClick={addCustomCol} style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4, border: 'none', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
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

      {bulkPhotoMsg && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
          background: bulkPhotoMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: bulkPhotoMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          color: bulkPhotoMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          {bulkPhotoMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{bulkPhotoMsg.text}</span>
          <button onClick={() => setBulkPhotoMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      {bulkResults && (bulkResults.matched.length + bulkResults.skipped.length > 0) && (
        <div style={{ marginBottom: '1.25rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)' }}>
            <button
              type="button"
              onClick={() => setBulkTab('matched')}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: 'none', fontSize: '0.85rem',
                background: bulkTab === 'matched' ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                color: bulkTab === 'matched' ? '#0f172a' : 'inherit'
              }}
            >
              Matched ({bulkResults.matched.length})
            </button>
            <button
              type="button"
              onClick={() => setBulkTab('skipped')}
              style={{
                padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: 'none', fontSize: '0.85rem',
                background: bulkTab === 'skipped' ? (bulkResults.skipped.length ? '#f87171' : '#38bdf8') : 'rgba(255,255,255,0.08)',
                color: bulkTab === 'skipped' && bulkResults.skipped.length ? '#0f172a' : (bulkTab === 'skipped' ? '#0f172a' : 'inherit')
              }}
            >
              Skipped ({bulkResults.skipped.length})
            </button>
            <button onClick={() => setBulkResults(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}>
              <XCircle size={16} />
            </button>
          </div>
          {bulkTab === 'skipped' && (
            <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)' }}>
              {bulkResults.skipped.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '0.5rem 0' }}>No skipped photos. All photos matched.</div>
              ) : (
                bulkResults.skipped.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.file || r.sr_number}</span>
                    <span style={{ color: r.status === 'no_id_in_name' ? '#fca5a5' : '#fbbf24', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {r.status === 'no_voter_found' ? `No member/sr no ${r.sr_number}` : 'No member no in file name'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
          {bulkTab === 'matched' && (
            <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)' }}>
              {bulkResults.matched.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '0.5rem 0' }}>No matched photos.</div>
              ) : (
                bulkResults.matched.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.file || r.sr_number}</span>
                    <span style={{ color: '#6ee7b7', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Matched member/sr {r.sr_number} ({r.matched_by})</span>
                  </div>
                ))
              )}
            </div>
          )}
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
                  <th style={{ padding: '10px 12px', textAlign: 'center', position: 'sticky', left: 0, background: 'var(--color-bg-card, #121a2b)', zIndex: 1, width: 40 }}>
                    <input
                      type="checkbox"
                      checked={pagedVoters.length > 0 && pagedVoters.every(v => v.id && selectedIds.has(String(v.id)))}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                    />
                  </th>
                  {columns.filter(c => c.visible).map(c => (
                    <th key={c.key} style={{ padding: '10px 12px', textAlign: 'left' }}>{c.label}</th>
                  ))}
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
                  const renderCell = (col) => {
                    if (col.key === 'status') {
                      return isCancelled ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>Cancelled</span>
                          {v.cancel_rearks && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{v.cancel_remarks}</span>}
                        </div>
                      ) : <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>Active</span>;
                    }
                    if (col.key === 'total_votes') {
                      return <span style={{ fontSize: '0.85rem', fontWeight: 700, color: v.total_votes > 0 ? '#38bdf8' : '#475569', background: v.total_votes > 0 ? 'rgba(56,189,248,0.12)' : 'transparent', padding: '2px 10px', borderRadius: '12px' }}>{v.total_votes || 0}</span>;
                    }
                    if (col.key === 'photo') {
                      if (isEditing) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <input type="file" accept="image/*" style={{ fontSize: '0.75rem', color: 'inherit' }} onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const fd = new FormData();
                                fd.append('photo', file);
                                fd.append('voter_id', v.id);
                                fd.append('sr_number', v.sr_number);
                                fetch('/upload-voter-photo', { method: 'POST', body: fd })
                                  .then(r => r.json())
                                  .then(d => { if (d.url) { handleFieldChange(key, 'photo', d.url); fetchVoters(); } })
                                  .catch(() => {});
                              }
                            }} />
                            {v.photo && <img src={v.photo} alt="photo" style={{ maxWidth: 36, maxHeight: 36, borderRadius: 6, objectFit: 'cover' }} />}
                          </div>
                        );
                      }
                      return v.photo ? <img src={v.photo} alt="photo" style={{ maxWidth: 36, maxHeight: 36, borderRadius: 6, objectFit: 'cover' }} /> : <span style={{ color: '#475569', fontSize: '0.75rem' }}>No photo</span>;
                    }
                    return inp(col.key);
                  };
                  return (
                    <tr key={key} style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isCancelled ? 'rgba(239, 68, 68, 0.05)' : hasDup ? 'rgba(251, 191, 36, 0.05)' : 'transparent'
                    }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center', position: 'sticky', left: 0, background: isCancelled ? 'rgba(30, 20, 20, 0.95)' : hasDup ? 'rgba(30, 28, 15, 0.95)' : 'var(--color-bg-card, #121a2b)', zIndex: 1 }}>
                        <input
                          type="checkbox"
                          checked={v.id ? selectedIds.has(String(v.id)) : false}
                          onChange={() => v.id && toggleSelectOne(v.id)}
                          style={{ cursor: v.id ? 'pointer' : 'not-allowed', accentColor: '#38bdf8' }}
                        />
                      </td>
                      {columns.filter(c => c.visible).map(col => (
                        <td key={col.key} style={{ padding: '6px 8px' }}>
                          {renderCell(col)}
                          {col.key === 'member_id' && hasDup && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <AlertTriangle size={12} color="#fbbf24" />
                              <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{duplicateWarnings[key]}</span>
                            </div>
                          )}
                        </td>
                      ))}
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

                          {(user?.role === 'admin' || user?.role === 'data-entry') && (
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
                    <tr><td colSpan={20} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No voters found</td></tr>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={() => setShowAddForm(false)}>
          <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 1fr 1fr', gap: '0.85rem' }}>
              <div style={{ gridColumn: '1 / 2' }}>
                <label style={labelStyle}>SR Number *</label>
                <input style={inputStyle} value={addForm.sr_number} onChange={e => handleAddFormChange('sr_number', e.target.value)} placeholder="e.g. 101" />
              </div>
              <div style={{ gridColumn: '2 / 3' }}>
                <label style={labelStyle}>Member ID</label>
                <input style={{ ...inputStyle, borderColor: addFormDup ? '#fbbf24' : undefined }} value={addForm.member_id} onChange={e => handleAddFormChange('member_id', e.target.value)} placeholder="e.g. M-001" />
                {addFormDup && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <AlertTriangle size={12} color="#fbbf24" />
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{addFormDup}</span>
                  </div>
                )}
              </div>
              <div style={{ gridColumn: '3 / 4' }}>
                <label style={labelStyle}>Voter Name (English) *</label>
                <input style={inputStyle} value={addForm.voter_name} onChange={e => handleAddFormChange('voter_name', e.target.value)} placeholder="Full name" />
              </div>
              <div style={{ gridColumn: '4 / 5' }}>
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
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={addForm.status || 'active'} onChange={e => handleAddFormChange('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input style={inputStyle} type="tel" value={addForm.mobile} onChange={e => handleAddFormChange('mobile', e.target.value)} placeholder="Primary mobile" />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number 2</label>
                <input style={inputStyle} type="tel" value={addForm.mobile2} onChange={e => handleAddFormChange('mobile2', e.target.value)} placeholder="Secondary mobile" />
              </div>
              <div style={{ gridColumn: '3 / 5' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={addForm.email} onChange={e => handleAddFormChange('email', e.target.value)} placeholder="email@example.com" />
              </div>

              <div style={{ gridColumn: '1 / 3' }}>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={addForm.address} onChange={e => handleAddFormChange('address', e.target.value)} placeholder="Full address" />
              </div>
              <div>
                <label style={labelStyle}>Village</label>
                <input style={inputStyle} value={addForm.village} onChange={e => handleAddFormChange('village', e.target.value)} placeholder="Village / City" />
              </div>
              <div>
                <label style={labelStyle}>City (Gujarati)</label>
                <input style={inputStyle} value={addForm.city_guj} onChange={e => handleAddFormChange('city_guj', e.target.value)} placeholder="City in Gujarati" />
              </div>

              <div style={{ gridColumn: '1 / 3' }}>
                <label style={labelStyle}>Address (Gujarati)</label>
                <input style={inputStyle} value={addForm.address_guj} onChange={e => handleAddFormChange('address_guj', e.target.value)} placeholder="Address in Gujarati" />
              </div>
              <div>
                <label style={labelStyle}>Fee Payment Date</label>
                <input style={inputStyle} type="date" value={addForm.fee_payment} onChange={e => handleAddFormChange('fee_payment', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Photo</label>
                <input type="file" accept="image/*" style={{ ...inputStyle, fontSize: '0.8rem' }} onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    setAddFormPhotoFile(file);
                    const url = URL.createObjectURL(file);
                    handleAddFormChange('photo', url);
                  }
                }} />
                {addForm.photo && (
                  <img src={addForm.photo} alt="preview" style={{ maxWidth: 40, maxHeight: 40, borderRadius: '50%', marginTop: 4, border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                )}
              </div>
            </div>

            {columns.filter(c => !c.builtIn).length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>Custom Fields</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  {columns.filter(c => !c.builtIn).map(c => (
                    <div key={c.key}>
                      <label style={labelStyle}>{c.label}</label>
                      <input style={inputStyle} value={addForm[c.key] || ''} onChange={e => handleAddFormChange(c.key, e.target.value)} placeholder={c.label} />
                    </div>
                  ))}
                </div>
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
        </div>
      )}
    </div>
  );
}
