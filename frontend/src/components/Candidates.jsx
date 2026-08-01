import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Pencil, Trash2, X, Award, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

const CANDIDATE_STORAGE_KEY = 'svit_candidates';

function readStoredCandidates() {
  try {
    const stored = localStorage.getItem(CANDIDATE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeStoredCandidates(candidates) {
  localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(candidates));
}

export default function Candidates({ user, candidatePrefill, clearCandidatePrefill }) {
  const [candidates, setCandidates] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [gujaratiName, setGujaratiName] = useState('');
  const [srNumber, setSrNumber] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [voterPhoto, setVoterPhoto] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchMemberId, setSearchMemberId] = useState('');
  const [searchSr, setSearchSr] = useState('');
  const [sortGujarati, setSortGujarati] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [srEditId, setSrEditId] = useState(null);
  const [srEditValue, setSrEditValue] = useState('');
  const [assignArmed, setAssignArmed] = useState(false);
  const [voterList, setVoterList] = useState(null);
  const [voterSearch, setVoterSearch] = useState('');
  const [voterResults, setVoterResults] = useState([]);
  const [showVoterResults, setShowVoterResults] = useState(false);
  const [voterFetching, setVoterFetching] = useState(false);

  useEffect(() => {
    setCandidates(readStoredCandidates());
    fetchCandidates();
    // Apply prefill if provided
    if (candidatePrefill) {
      if (candidatePrefill.candidate_name) setCandidateName(candidatePrefill.candidate_name);
      if (candidatePrefill.sr_number) setSrNumber(candidatePrefill.sr_number);
      if (candidatePrefill.member_id) setMemberId(candidatePrefill.member_id);
      if (candidatePrefill.address) setAddress(candidatePrefill.address);
      if (candidatePrefill.mobile) setMobile(candidatePrefill.mobile);
      if (candidatePrefill.photo) setVoterPhoto(candidatePrefill.photo);
      if (candidatePrefill.logo_url) setLogoPreview(candidatePrefill.logo_url);
      if (candidatePrefill.photo) setPhotoPreview(candidatePrefill.photo);
      if (clearCandidatePrefill) clearCandidatePrefill();
    }
  }, []);

  const fetchCandidates = async () => {
    const localCandidates = readStoredCandidates();
    if (localCandidates.length > 0) {
      setCandidates(localCandidates);
    }

    try {
      const res = await fetch('/ballots');
      if (!res.ok) throw new Error('Unable to load candidates');
      const data = await res.json();
      const nextCandidates = Array.isArray(data) ? data : data.data || [];
      if (nextCandidates.length > 0) {
        setCandidates(nextCandidates);
        writeStoredCandidates(nextCandidates);
      } else if (localCandidates.length > 0) {
        setCandidates(localCandidates);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      if (localCandidates.length > 0) {
        setCandidates(localCandidates);
      }
    }
  };

  const fetchVoterList = async () => {
    if (voterList) return voterList;
    setVoterFetching(true);
    try {
      const res = await fetch('/voters-list', { headers: { 'X-Username': user?.username || '' } });
      if (!res.ok) throw new Error('Unable to load voters');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setVoterList(list);
      return list;
    } catch (err) {
      console.error('Error fetching voters:', err);
      return [];
    } finally {
      setVoterFetching(false);
    }
  };

  const handleVoterSearch = async (q) => {
    setVoterSearch(q);
    const query = String(q || '').trim().toLowerCase();
    if (!query) {
      setVoterResults([]);
      setShowVoterResults(false);
      return;
    }
    const list = await fetchVoterList();
    const results = list
      .filter((v) =>
        String(v.voter_name || v.name || '').toLowerCase().includes(query) ||
        String(v.gujarati_name || '').toLowerCase().includes(query) ||
        String(v.member_id || '').toLowerCase().includes(query) ||
        String(v.sr_number || v.srNo || '').toLowerCase().includes(query)
      )
      .slice(0, 20);
    setVoterResults(results);
    setShowVoterResults(true);
  };

  const selectVoter = (v) => {
    setCandidateName(v.voter_name || v.name || '');
    setGujaratiName(v.gujarati_name || '');
    setSrNumber(String(v.sr_number || v.srNo || ''));
    setMemberId(v.member_id != null ? String(v.member_id) : '');
    setAddress(v.address || v.address_guj || '');
    setMobile(v.mobile || v.mobile2 || '');
    setVoterPhoto(v.photo || '');
    setPhotoPreview(v.photo || null);
    setLogoFile(null);
    setLogoPreview(null);
    setVoterSearch('');
    setVoterResults([]);
    setShowVoterResults(false);
    setStatusMsg({ type: 'success', text: `Fetched "${v.voter_name || v.name}" from voter list into the form.` });
  };

  const handleSubmitCandidate = async (e) => {
    e.preventDefault();
    if (!String(candidateName || '').trim() || !String(srNumber || '').trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide Candidate Name and SR Number.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const isEdit = editingId != null;
    const payload = {
      candidate_name: String(candidateName || '').trim(),
      gujarati_name: String(gujaratiName || '').trim(),
      sr_number: String(srNumber || '').trim(),
      member_id: String(memberId || '').trim(),
      address: String(address || '').trim(),
      mobile: String(mobile || '').trim(),
      photo: String(voterPhoto || '').trim(),
      logo_url: (!logoFile && logoPreview) ? String(logoPreview) : ''
    };

    try {
      let serverCandidate = null;
      try {
        const res = await fetch(isEdit ? `/candidates/${editingId}` : '/admin/add-to-candidate-list', {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'NEST' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          serverCandidate = data?.data || payload;
        } else if (isEdit) {
          throw new Error(data?.error || 'Server rejected the update');
        } else {
          throw new Error(data?.error || 'Server rejected the save');
        }
      } catch (err) {
        if (!isEdit) {
          console.warn('Server candidate save failed, falling back locally:', err);
        } else {
          throw err;
        }
      }

      let uploadedLogoUrl = '';
      let uploadedPhotoUrl = '';

      if (logoFile) {
        try {
          const formData = new FormData();
          formData.append('logo', logoFile);
          formData.append('sr_number', String(srNumber || '').trim());
          const res = await fetch('/upload-logo', { method: 'POST', body: formData });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.url) uploadedLogoUrl = data.url;
        } catch (err) {
          console.warn('Logo upload failed, continuing with candidate save:', err);
        }
      }

      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('logo', photoFile);
          formData.append('sr_number', String(srNumber || '').trim());
          formData.append('type', 'photo');
          const res = await fetch('/upload-logo', { method: 'POST', body: formData });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.url) uploadedPhotoUrl = data.url;
        } catch (err) {
          console.warn('Photo upload failed, continuing with candidate save:', err);
        }
      }

      const logoUrl = uploadedLogoUrl || (logoPreview || payload.logo_url || '');
      const photoUrl = uploadedPhotoUrl || (voterPhoto || '');

      if (logoUrl && !logoUrl.startsWith('blob:')) {
        try {
          await fetch('/candidate-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'NEST' },
            body: JSON.stringify({ sr_number: String(srNumber || '').trim(), logo_url: logoUrl })
          });
        } catch (err) {
          console.warn('Candidate logo map save failed:', err);
        }
      }

      const existing = readStoredCandidates();

      if (isEdit) {
        const nextCandidates = existing.map((item) =>
          String(item.id) === String(editingId)
            ? { ...item, ...payload, photo: photoUrl || item.photo, logo_url: logoUrl || item.logo_url }
            : item
        );
        writeStoredCandidates(nextCandidates);
        setCandidates(nextCandidates);
        setStatusMsg({ type: 'success', text: `Candidate ${candidateName} (SR #${srNumber}) updated!` });
      } else {
        const newCandidate = {
          id: serverCandidate?.id || Date.now(),
          ...payload,
          photo: photoUrl,
          logo_url: logoUrl,
          created_at: new Date().toISOString()
        };
        const nextCandidates = [newCandidate, ...existing.filter((item) => String(item.sr_number) !== String(newCandidate.sr_number))];
        writeStoredCandidates(nextCandidates);
        setCandidates(nextCandidates);
        setStatusMsg({ type: 'success', text: `Candidate ${candidateName} (SR #${srNumber}) registered!` });
      }

      setCandidateName('');
      setGujaratiName('');
      setSrNumber('');
      setMemberId('');
      setAddress('');
      setMobile('');
      setVoterPhoto('');
      setLogoFile(null);
      setLogoPreview(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditingId(null);
      fetchCandidates();
    } catch (err) {
      console.error('Candidate save error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to save candidate: ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCandidate = (c) => {
    setEditingId(c.id);
    setCandidateName(c.candidate_name || '');
    setGujaratiName(c.gujarati_name || '');
    setSrNumber(c.sr_number || '');
    setMemberId(c.member_id || '');
    setAddress(c.address || '');
    setMobile(c.mobile || '');
    setVoterPhoto(c.photo || '');
    setLogoFile(null);
    setPhotoFile(null);
    setLogoPreview(c.logo_url && c.logo_url !== c.photo ? c.logo_url : null);
    setPhotoPreview(c.photo || null);
    setStatusMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCandidateName('');
    setGujaratiName('');
    setSrNumber('');
    setMemberId('');
    setAddress('');
    setMobile('');
    setVoterPhoto('');
    setLogoFile(null);
    setLogoPreview(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setStatusMsg(null);
  };

  const handleDeleteCandidate = async (c) => {
    if (!window.confirm(`Delete candidate "${c.candidate_name || c.sr_number}" (SR #${c.sr_number})? This cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/candidates/${c.id}`, {
        method: 'DELETE',
        headers: { 'X-Username': user?.username || 'NEST' }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Server rejected the delete');

      const existing = readStoredCandidates().filter((item) => String(item.id) !== String(c.id));
      writeStoredCandidates(existing);
      setCandidates(existing);
      setStatusMsg({ type: 'success', text: `Candidate ${c.candidate_name} (SR #${c.sr_number}) deleted.` });
      if (String(editingId) === String(c.id)) handleCancelEdit();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to delete candidate: ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const startSrEdit = (c) => {
    setSrEditId(c.id);
    setSrEditValue(String(c.sr_number || ''));
    setStatusMsg(null);
  };

  const cancelSrEdit = () => {
    setSrEditId(null);
    setSrEditValue('');
  };

  const saveSr = async (c) => {
    const sr = String(srEditValue || '').trim();
    if (!sr) {
      setStatusMsg({ type: 'error', text: 'SR number cannot be empty.' });
      return;
    }
    const dup = readStoredCandidates().find((x) => String(x.sr_number) === sr && String(x.id) !== String(c.id));
    if (dup) {
      setStatusMsg({ type: 'error', text: `SR #${sr} is already used by "${dup.candidate_name || dup.sr_number}".` });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/candidates/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'NEST' },
        body: JSON.stringify({ sr_number: sr })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Server rejected the update');

      const existing = readStoredCandidates().map((item) =>
        String(item.id) === String(c.id) ? { ...item, sr_number: sr } : item
      );
      writeStoredCandidates(existing);
      setCandidates(existing);
      setSrEditId(null);
      setSrEditValue('');
      setStatusMsg({ type: 'success', text: `SR number of "${c.candidate_name}" updated to #${sr}.` });
      fetchCandidates();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update SR number: ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSrByGujarati = async () => {
    const local = readStoredCandidates();
    if (!local.length) {
      setStatusMsg({ type: 'error', text: 'No registered candidates to renumber.' });
      return;
    }
    if (!assignArmed) {
      setAssignArmed(true);
      setStatusMsg({ type: 'success', text: 'Click "Assign SR (Gujarati)" again to confirm renumbering 1..N in Gujarati-name order.' });
      setTimeout(() => setAssignArmed(false), 4000);
      return;
    }
    setAssignArmed(false);
    setLoading(true);
    try {
      const sorted = [...local].sort((a, b) =>
        String(a.gujarati_name || a.candidate_name || '').localeCompare(String(b.gujarati_name || b.candidate_name || ''), 'gu')
      );
      let updated = [];
      for (let i = 0; i < sorted.length; i++) {
        const sr = String(i + 1);
        const res = await fetch(`/candidates/${sorted[i].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'NEST' },
          body: JSON.stringify({ sr_number: sr })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Failed to update SR for ${sorted[i].candidate_name}`);
        updated.push(data?.data || { ...sorted[i], sr_number: sr });
      }
      const updatedIds = new Set(updated.map((u) => String(u.id)));
      const existing = readStoredCandidates().map((item) =>
        updatedIds.has(String(item.id)) ? updated.find((u) => String(u.id) === String(item.id)) : item
      );
      writeStoredCandidates(existing);
      setCandidates(existing);
      setStatusMsg({ type: 'success', text: `SR numbers assigned in Gujarati-name order (1-${updated.length}).` });
      fetchCandidates();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to assign SR numbers: ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Award size={32} color="#a855f7" />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Candidate Management</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Register, search, edit and manage candidates</p>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          color: statusMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
        {/* Form Card */}
        <div className="glass-panel" style={{ padding: '1.75rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="#c084fc" /> {editingId != null ? 'Edit Candidate' : 'Register Candidate'}
          </h3>

          <div style={{ marginBottom: '1.5rem', padding: '0.9rem', borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Fetch from Voter List
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search voter by name / member ID..."
                value={voterSearch}
                onChange={(e) => handleVoterSearch(e.target.value)}
                style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
              />
              {voterFetching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#94a3b8' }}>Loading...</div>}
              {showVoterResults && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#1a2332', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, zIndex: 100, maxHeight: 280, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {voterResults.length === 0 ? (
                    <div style={{ padding: 10, fontSize: '0.8rem', color: '#94a3b8' }}>No matching voters.</div>
                  ) : (
                    voterResults.map((v) => (
                      <button
                        key={v.id || v.sr_number}
                        type="button"
                        onClick={() => selectVoter(v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '8px 10px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: '#e2e8f0' }}
                      >
                        {v.photo && <img src={v.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.voter_name || v.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SR #{v.sr_number || v.srNo}{v.member_id != null ? ` | ID: ${v.member_id}` : ''}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitCandidate}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Candidate Full Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Full Name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Gujarati Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ઉમેદવારનું નામ"
                value={gujaratiName}
                onChange={(e) => setGujaratiName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                SR / Candidate Number
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 15"
                value={srNumber}
                onChange={(e) => setSrNumber(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Member ID
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. M-001"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Address
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Mobile No
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Candidate Logo (Upload)
              </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setLogoFile(e.target.files[0]);
                    setLogoPreview(null);
                  }}
                  className="form-input"
                />

                {logoPreview && !logoFile && (
                  <div style={{ marginTop: 8 }}>
                    <img src={logoPreview} alt="logo preview" style={{ maxWidth: '80px', maxHeight: '80px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} />
                  </div>
                )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Candidate Photo (Upload)
              </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setPhotoFile(e.target.files[0]);
                    setVoterPhoto('');
                    setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                  }}
                  className="form-input"
                />
                {photoPreview && (
                  <div style={{ marginTop: 8 }}>
                    <img src={photoPreview} alt="photo preview" style={{ maxWidth: '80px', maxHeight: '80px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', objectFit: 'cover' }} />
                  </div>
                )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Saving...' : (editingId != null ? 'Save Changes' : 'Add Candidate')}
            </button>
            {editingId != null && (
              <button
                type="button"
                className="btn"
                onClick={handleCancelEdit}
                disabled={loading}
                style={{ width: '100%', marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <X size={16} /> Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Candidate Directory */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Registered Candidates ({candidates.length})
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: '1 1 300px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 140 }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Candidate Full Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ position: 'relative', flex: '0 1 130px', minWidth: 120 }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Member ID"
                  value={searchMemberId}
                  onChange={(e) => setSearchMemberId(e.target.value)}
                  style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ position: 'relative', flex: '0 1 100px', minWidth: 90 }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="SR #"
                  value={searchSr}
                  onChange={(e) => setSearchSr(e.target.value)}
                  style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
                />
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setSortGujarati(!sortGujarati)}
                title="Sort candidates by Gujarati name"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: sortGujarati ? 'rgba(168, 85, 247, 0.25)' : undefined, border: sortGujarati ? '1px solid rgba(168, 85, 247, 0.5)' : undefined }}
              >
                A-Z (ગુજરાતી)
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleAssignSrByGujarati}
                disabled={loading}
                title="Assign SR numbers 1..N in Gujarati-name order (as per election rules)"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: assignArmed ? 'rgba(239, 68, 68, 0.25)' : undefined, border: assignArmed ? '1px solid rgba(239, 68, 68, 0.5)' : undefined }}
              >
                <Hash size={14} /> {assignArmed ? 'Confirm Assign SR?' : 'Assign SR (Gujarati)'}
              </button>
            </div>
          </div>

          {(() => {
            const n = String(searchName || '').trim().toLowerCase();
            const m = String(searchMemberId || '').trim().toLowerCase();
            const s = String(searchSr || '').trim().toLowerCase();
            const hasQuery = n || m || s;
            let filtered = candidates.filter((c) =>
              (!n || String(c.candidate_name || '').toLowerCase().includes(n)) &&
              (!m || String(c.member_id || '').toLowerCase().includes(m)) &&
              (!s || String(c.sr_number || '').toLowerCase().includes(s))
            );
            if (sortGujarati) {
              filtered = [...filtered].sort((a, b) =>
                String(a.gujarati_name || a.candidate_name || '').localeCompare(String(b.gujarati_name || b.candidate_name || ''), 'gu')
              );
            }

            if (filtered.length === 0) {
              return <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{hasQuery ? 'No candidates match your search.' : 'No candidates registered yet.'}</p>;
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {filtered.map((c) => (
                  <div key={c.id || c.sr_number} className="glass-card" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {c.photo ? (
                        <img src={c.photo} alt="photo" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                          {c.candidate_name ? c.candidate_name.charAt(0) : '#'}
                        </div>
                      )}
                      {c.logo_url && c.logo_url !== c.photo && (
                        <img src={c.logo_url} alt="logo" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                      {c.candidate_name || `Candidate #${c.sr_number}`}
                    </div>
                    {c.gujarati_name && <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: 2 }}>{c.gujarati_name}</div>}
                    {srEditId === c.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', justifyContent: 'center' }}>
                        <input
                          type="number"
                          className="form-input"
                          value={srEditValue}
                          onChange={(e) => setSrEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveSr(c);
                            if (e.key === 'Escape') cancelSrEdit();
                          }}
                          autoFocus
                          style={{ width: 64, padding: '4px 8px', fontSize: '0.8rem', textAlign: 'center' }}
                        />
                        <button type="button" onClick={() => saveSr(c)} disabled={loading} title="Save SR number" style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                          <CheckCircle2 size={14} />
                        </button>
                        <button type="button" onClick={cancelSrEdit} title="Cancel" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                        <span className="badge badge-admin">
                          SR #{c.sr_number || c.id}
                        </span>
                        {c.candidate_name && (
                          <button
                            type="button"
                            onClick={() => startSrEdit(c)}
                            disabled={loading}
                            title="Change SR number directly"
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    )}
                    {c.member_id && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>ID: {c.member_id}</div>}
                    {c.candidate_name && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleEditCandidate(c)}
                          disabled={loading}
                          title="Edit candidate"
                          style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleDeleteCandidate(c)}
                          disabled={loading}
                          title="Delete candidate"
                          style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#fca5a5' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
