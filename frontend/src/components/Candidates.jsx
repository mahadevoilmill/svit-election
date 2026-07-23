import React, { useState, useEffect } from 'react';
import { UserPlus, Image, Award, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [srNumber, setSrNumber] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/ballots');
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching candidates:', err);
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
      // Step 1: Add candidate to ballot list
      const res = await fetch('/admin/add-to-candidate-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: candidateName.trim(),
          sr_number: srNumber.trim()
        })
      });
      const data = await res.json();

      // Step 2: Upload logo if file selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        formData.append('sr_number', srNumber.trim());
        await fetch('/upload-logo', { method: 'POST', body: formData });
      }

      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Candidate ${candidateName} (SR #${srNumber}) registered!` });
        setCandidateName('');
        setSrNumber('');
        setLogoFile(null);
        fetchCandidates();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to add candidate.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Server error while registering candidate.' });
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
                onChange={(e) => setLogoFile(e.target.files[0])}
                className="form-input"
              />
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
