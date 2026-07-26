import React, { useState, useEffect } from 'react';
import { UserPlus, Image, Award, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [srNumber, setSrNumber] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    setCandidates(readStoredCandidates());
    fetchCandidates();
    // Apply prefill if provided
    if (candidatePrefill) {
      if (candidatePrefill.candidate_name) setCandidateName(candidatePrefill.candidate_name);
      if (candidatePrefill.sr_number) setSrNumber(candidatePrefill.sr_number);
      // show logo preview if available
      if (candidatePrefill.logo_url) setLogoPreview(candidatePrefill.logo_url);
      // focus on logo input would be nice, but file inputs can't be set programmatically
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

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!candidateName.trim() || !srNumber.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide Candidate Name and SR Number.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const payload = {
        candidate_name: candidateName.trim(),
        sr_number: srNumber.trim()
      };
      if (!logoFile && logoPreview) payload.logo_url = logoPreview;

      let serverCandidate = null;
      try {
        const res = await fetch('/admin/add-to-candidate-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'NEST' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          serverCandidate = data?.data || payload;
        }
      } catch (err) {
        console.warn('Server candidate save failed, falling back locally:', err);
      }

      if (logoFile) {
        try {
          const formData = new FormData();
          formData.append('logo', logoFile);
          formData.append('sr_number', srNumber.trim());
          await fetch('/upload-logo', { method: 'POST', body: formData });
        } catch (err) {
          console.warn('Logo upload failed, continuing with candidate save:', err);
        }
      }

      const newCandidate = {
        id: serverCandidate?.id || Date.now(),
        candidate_name: candidateName.trim(),
        sr_number: srNumber.trim(),
        logo_url: logoPreview || payload.logo_url || '',
        created_at: new Date().toISOString()
      };

      const existing = readStoredCandidates();
      const nextCandidates = [newCandidate, ...existing.filter((item) => String(item.sr_number) !== String(srNumber.trim()))];
      writeStoredCandidates(nextCandidates);
      setCandidates(nextCandidates);

      setStatusMsg({ type: 'success', text: `Candidate ${candidateName} (SR #${srNumber}) registered!` });
      setCandidateName('');
      setSrNumber('');
      setLogoFile(null);
      setLogoPreview(null);
      fetchCandidates();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to register candidate.' });
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
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Register new candidates and update logos</p>
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
            <UserPlus size={20} color="#c084fc" /> Register Candidate
          </h3>

          <form onSubmit={handleAddCandidate}>
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Candidate Logo / Photo (Optional)
              </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setLogoFile(e.target.files[0]);
                    // clear preview if user selects a file
                    setLogoPreview(null);
                  }}
                  className="form-input"
                />

                {logoPreview && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 6 }}>Preview</div>
                    <img src={logoPreview} alt="logo preview" style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} />
                  </div>
                )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Saving Candidate...' : 'Add Candidate'}
            </button>
          </form>
        </div>

        {/* Candidate Directory */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Registered Candidates ({candidates.length})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {candidates.map((c) => (
              <div key={c.id || c.sr_number} className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 0.75rem', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                  {c.candidate_name ? c.candidate_name.charAt(0) : '#'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                  {c.candidate_name || `Candidate #${c.sr_number}`}
                </div>
                <span className="badge badge-admin" style={{ marginTop: '0.4rem' }}>
                  SR #{c.sr_number || c.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
