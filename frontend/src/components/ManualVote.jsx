import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, Dices, ListChecks, Users, Grid3x3, Plus, Edit3, Trash2, X, RefreshCw, Send, Check, Sparkles } from 'lucide-react';

export default function ManualVote({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [randomMode, setRandomMode] = useState('total');
  const [randomTotal, setRandomTotal] = useState('');
  const [randomCandidates, setRandomCandidates] = useState([]);
  const [randomCounts, setRandomCounts] = useState({});
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomResult, setRandomResult] = useState(null);
  const [voteStats, setVoteStats] = useState({ total: 0, online: 0, offline: 0, unknown: 0 });
  const [availableVoters, setAvailableVoters] = useState(0);
  const [gridBallots, setGridBallots] = useState([]);
  const [gridOrientation, setGridOrientation] = useState('candRows');
  const [gridSelected, setGridSelected] = useState('');
  const [gridSubmitting, setGridSubmitting] = useState(false);

  // Batch Vote Casting states
  const [batchSrNumbers, setBatchSrNumbers] = useState('');
  const [editingBallotId, setEditingBallotId] = useState(null);
  const [editingBallotLabel, setEditingBallotLabel] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/ballots');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setCandidates(list);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  const fetchVoteStats = async () => {
    try {
      const res = await fetch('/vote-stats');
      const data = await res.json();
      setVoteStats(data || { total: 0, online: 0, offline: 0, unknown: 0 });
    } catch (err) {
      console.error('Error fetching vote stats:', err);
    }
  };

  const fetchAvailableVoters = async () => {
    try {
      const res = await fetch('/voters-list');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const candidateSrs = new Set(candidates.map((c) => String(c.sr_number ?? c.id)));
      const count = list.filter((v) => !(Number(v.total_votes) || 0) > 0 && !candidateSrs.has(String(v.sr_number))).length;
      setAvailableVoters(count);
    } catch (err) {
      console.error('Error fetching available voters:', err);
    }
  };

  const fetchGridBallots = async () => {
    try {
      const res = await fetch('/cast-votes');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const sorted = [...list].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setGridBallots(sorted);
    } catch (err) {
      console.error('Error fetching grid ballots:', err);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchVoteStats();
    fetchGridBallots();
  }, []);

  useEffect(() => {
    if (candidates.length > 0) fetchAvailableVoters();
  }, [candidates]);

  // Batch Vote Submission
  const handleBatchVoteSubmit = async (e) => {
    e.preventDefault();
    if (!batchSrNumbers.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter SR numbers.' });
      return;
    }
    const srs = batchSrNumbers.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    if (srs.length > 17) {
      setStatusMessage({ type: 'error', text: 'Maximum of 17 SR numbers is allowed per ballot.' });
      return;
    }

    setBatchSubmitting(true);
    setStatusMessage(null);
    setBatchResults(null);

    try {
      const res = await fetch('/voters-list/by-sr/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'admin' },
        body: JSON.stringify({
          sr_numbers: srs,
          entered_by: user?.username || 'admin',
          cast_type: 'offline'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchResults({ results: data.results || [], errors: data.errors || [] });
        setStatusMessage({ type: 'success', text: `Processed ${data.processed || 0} votes successfully! ✅` });
        setBatchSrNumbers('');
        fetchGridBallots();
        fetchVoteStats();
        fetchAvailableVoters();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to submit batch votes.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error submitting batch votes.' });
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Batch Ballot update
  const handleUpdateBatchBallot = async (e) => {
    e.preventDefault();
    if (!editingBallotId) return;
    if (!batchSrNumbers.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter SR numbers.' });
      return;
    }
    const srs = batchSrNumbers.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    if (srs.length > 17) {
      setStatusMessage({ type: 'error', text: 'Maximum of 17 SR numbers is allowed per ballot.' });
      return;
    }

    setBatchSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/ballots/${editingBallotId}/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'admin' },
        body: JSON.stringify({ sr_numbers: srs })
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Ballot updated successfully! ✅' });
        cancelBatchEdit();
        fetchGridBallots();
        fetchVoteStats();
        fetchAvailableVoters();
      } else {
        const data = await res.json();
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update ballot.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error updating ballot.' });
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleCreateEmptyBallot = async () => {
    try {
      const res = await fetch('/ballots/new-empty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Username': user?.username || 'admin'
        },
        body: JSON.stringify({ entered_by: user?.username || 'admin' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `New Ballot #${gridBallots.length + 1} created successfully! ✅` });
        fetchGridBallots();
        fetchVoteStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create new empty ballot.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error creating empty ballot.' });
    }
  };

  const handleDeleteBallot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ballot? All associated votes will be reverted.')) return;
    try {
      const res = await fetch(`/ballots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Ballot deleted and votes reverted! 🔄' });
        fetchGridBallots();
        fetchVoteStats();
        fetchAvailableVoters();
      } else {
        const data = await res.json();
        setStatusMessage({ type: 'error', text: data.error || 'Failed to delete ballot.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error deleting ballot.' });
    }
  };

  const handleLoadBallotToEdit = (ballot, indexLabel) => {
    let srs = [];
    if (Array.isArray(ballot.sr_numbers)) {
      srs = ballot.sr_numbers;
    } else if (ballot.sr_numbers && typeof ballot.sr_numbers === 'object') {
      srs = Object.entries(ballot.sr_numbers)
        .filter(([, count]) => Number(count) > 0)
        .map(([sr]) => sr);
    }
    setBatchSrNumbers(srs.join(', '));
    setEditingBallotId(ballot.id);
    setEditingBallotLabel(indexLabel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelBatchEdit = () => {
    setEditingBallotId(null);
    setEditingBallotLabel('');
    setBatchSrNumbers('');
  };

  const handleUpdateCell = async (ballotId, srNumber, newValue) => {
    const count = parseInt(newValue) || 0;
    try {
      const res = await fetch(`/ballots/${ballotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sr_number: srNumber, new_count: count })
      });
      if (res.ok) {
        fetchGridBallots();
        fetchVoteStats();
        fetchAvailableVoters();
      }
    } catch (err) {
      console.error('Error updating cell count:', err);
    }
  };

  const handleGridAddVote = async (e) => {
    e.preventDefault();
    if (!gridSelected) {
      setStatusMessage({ type: 'error', text: 'Select a candidate to add the ballot vote.' });
      return;
    }

    setGridSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/voters-list/by-sr/grid-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'admin' },
        body: JSON.stringify({
          sr_number: gridSelected,
          entered_by: user?.username || 'admin',
          cast_type: 'offline'
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `Vote added to Ballot #${gridBallots.length + 1} for candidate SR #${data.sr_number}.` });
        setGridSelected('');
        fetchGridBallots();
        fetchVoteStats();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to add vote.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error adding vote.' });
    } finally {
      setGridSubmitting(false);
    }
  };

  const toggleCandidate = (sr) => {
    const srStr = String(sr);
    setRandomCandidates((prev) =>
      prev.includes(srStr) ? prev.filter((p) => p !== srStr) : [...prev, srStr]
    );
  };

  const updateRandomCount = (sr, value) => {
    const srStr = String(sr);
    setRandomCounts((prev) => ({ ...prev, [srStr]: value }));
  };

  const totalRequested = randomMode === 'total'
    ? Math.max(0, Number(randomTotal) || 0)
    : randomCandidates.reduce((sum, sr) => sum + (Math.max(0, Number(randomCounts[sr]) || 0)), 0);

  const handleRandomVoteSubmit = async (e) => {
    e.preventDefault();
    if (randomCandidates.length === 0) {
      setStatusMessage({ type: 'error', text: 'Select at least one candidate for multiple random casting.' });
      return;
    }
    if (totalRequested <= 0) {
      setStatusMessage({ type: 'error', text: randomMode === 'total'
        ? 'Enter the total number of random votes to cast.'
        : 'Enter vote counts for the selected candidates.' });
      return;
    }
    if (totalRequested > availableVoters) {
      setStatusMessage({ type: 'error', text: `Only ${availableVoters} random voters (who have not voted) are available, but you requested ${totalRequested} votes.` });
      return;
    }

    const confirmText = randomMode === 'total'
      ? `Cast ${totalRequested} multiple random votes across ${randomCandidates.length} selected candidate(s)?`
      : `Cast ${totalRequested} multiple random votes per-candidate across ${randomCandidates.length} selected candidate(s)?`;

    if (!window.confirm(`${confirmText} Random voters who have not voted will be used and recorded as offline manual votes. This cannot be undone.`)) {
      return;
    }

    setRandomLoading(true);
    setRandomResult(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/voters-list/by-sr/random-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || 'admin' },
        body: JSON.stringify({
          entered_by: user?.username || 'admin',
          mode: randomMode,
          total_count: randomMode === 'total' ? totalRequested : undefined,
          selected_candidates: randomCandidates,
          candidate_counts: randomMode === 'per_candidate' ? randomCounts : undefined,
          cast_type: 'offline'
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRandomResult(data);
        setStatusMessage({ type: 'success', text: data.message || 'Multiple random votes cast successfully!' });
        setRandomTotal('');
        setRandomCounts({});
        setRandomCandidates([]);
        fetchVoteStats();
        fetchAvailableVoters();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to cast multiple random votes.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error casting multiple random votes.' });
    } finally {
      setRandomLoading(false);
    }
  };

  const activeSrCount = batchSrNumbers ? batchSrNumbers.split(/[,\n]+/).map(s => s.trim()).filter(s => s).length : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FileSpreadsheet size={32} color="#818cf8" />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Manual Vote Casting & Bulk Excel Processing</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Vote entry, batch processing and voting matrix</p>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: statusMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          color: statusMessage.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Vote Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Total Votes Cast</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>{voteStats.total}</div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: '#6ee7b7', marginBottom: '0.4rem' }}>Online Casting</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{voteStats.online}</div>
        </div>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '0.4rem' }}>Offline Casting</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>{voteStats.offline}</div>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: '#7dd3fc', marginBottom: '0.4rem' }}>Random Voters Available</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{availableVoters}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Batch Vote Casting (From Old Design) */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#6366f1" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingBallotId ? 'Update Ballot' : 'Batch Vote Casting'}
              </h3>
            </div>
            <span style={{
              background: activeSrCount > 17 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: activeSrCount > 17 ? '#ef4444' : '#38bdf8',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {activeSrCount} / 17 SR Selected
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Enter SR numbers separated by commas or newlines. Up to 17 unique candidates can receive a vote per ballot.
          </p>

          {editingBallotId && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#7dd3fc', fontWeight: 600 }}>
                Editing {editingBallotLabel}
              </span>
              <button
                onClick={cancelBatchEdit}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.8rem'
                }}
              >
                <X size={14} /> Cancel
              </button>
            </div>
          )}

          <form onSubmit={editingBallotId ? handleUpdateBatchBallot : handleBatchVoteSubmit}>
            <textarea
              className="form-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'monospace', marginBottom: '1rem' }}
              placeholder="e.g. 5, 12, 28, 44"
              value={batchSrNumbers}
              onChange={(e) => setBatchSrNumbers(e.target.value)}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {editingBallotId ? (
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={batchSubmitting || activeSrCount === 0 || activeSrCount > 17}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Send size={16} /> {batchSubmitting ? 'Updating...' : 'Update Ballot'}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={batchSubmitting || activeSrCount === 0 || activeSrCount > 17}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Send size={16} /> {batchSubmitting ? 'Casting...' : 'Cast Batch Votes'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setBatchSrNumbers('')}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1rem' }}
              >
                Clear
              </button>
            </div>
          </form>

          {batchResults && (
            <div style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>Results:</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem' }}>
                {batchResults.results.map((r, i) => {
                  const cand = candidates.find((c) => String(c.sr_number ?? c.id) === String(r.sr_number));
                  const candName = cand?.candidate_name || cand?.name || r.data?.voter_name || 'Success';
                  return (
                    <div key={i} style={{ color: '#34d399', padding: '2px 0' }}>
                      ✓ SR #{r.sr_number}: {candName} (Total: {r.data?.total_votes || 0})
                    </div>
                  );
                })}
                {batchResults.errors.map((e, i) => (
                  <div key={i} style={{ color: '#f87171', padding: '2px 0' }}>
                    ✗ SR #{e.sr_number}: {e.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Multiple Random Vote Casting */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Dices size={20} color="#fbbf24" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Multiple Random Vote Casting</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Select candidates and cast votes using random unvoted voters.
          </p>

          <form onSubmit={handleRandomVoteSubmit}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setRandomMode('total')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: randomMode === 'total' ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)',
                  background: randomMode === 'total' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                  color: randomMode === 'total' ? '#fbbf24' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                Total Random
              </button>
              <button
                type="button"
                onClick={() => setRandomMode('per_candidate')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: randomMode === 'per_candidate' ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)',
                  background: randomMode === 'per_candidate' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                  color: randomMode === 'per_candidate' ? '#fbbf24' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                Per Candidate
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              {randomMode === 'total' ? (
                <input
                  type="number"
                  min="1"
                  max={availableVoters || undefined}
                  className="form-input"
                  placeholder="Total Random Votes to Cast"
                  value={randomTotal}
                  onChange={(e) => setRandomTotal(e.target.value)}
                  style={{ width: '100%' }}
                />
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Enter counts for selected candidates below. Total: <strong style={{ color: '#fbbf24' }}>{totalRequested}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: '0.5rem', marginBottom: '1rem' }}>
              {candidates.map((candidate) => {
                const srStr = String(candidate.sr_number ?? candidate.id);
                const selected = randomCandidates.includes(srStr);
                return (
                  <div
                    key={candidate.id || srStr}
                    onClick={() => toggleCandidate(srStr)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: selected ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <input type="checkbox" checked={selected} readOnly style={{ accentColor: '#f59e0b' }} />
                      <span>SR #{srStr} · {candidate.candidate_name || candidate.name}</span>
                    </div>
                    {selected && randomMode === 'per_candidate' && (
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder="Count"
                        value={randomCounts[srStr] ?? ''}
                        onChange={(e) => updateRandomCount(srStr, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '70px', padding: '2px 6px', fontSize: '0.75rem' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="btn btn-warning"
              disabled={randomLoading || randomCandidates.length === 0 || totalRequested <= 0}
              style={{ width: '100%' }}
            >
              {randomLoading ? 'Casting...' : `Cast ${totalRequested} Random Votes`}
            </button>
          </form>
        </div>
      </div>

      {/* Ballot Entry Grid / Live Matrix */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid3x3 size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Ballot Matrix</h3>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setGridOrientation(gridOrientation === 'candRows' ? 'ballotRows' : 'candRows')}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <RefreshCw size={14} /> Toggle Layout ({gridOrientation === 'candRows' ? 'Candidates as Rows' : 'Ballots as Rows'})
            </button>
          </div>
        </div>

        {/* Live Quick Add Vote to Next Ballot */}
        <form onSubmit={handleGridAddVote} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Quick Add Vote to Ballot #{gridBallots.length + 1}
            </label>
            <select
              className="form-input"
              value={gridSelected}
              onChange={(e) => setGridSelected(e.target.value)}
              style={{ width: '100%', padding: '0.45rem' }}
            >
              <option value="">-- Choose Candidate --</option>
              {candidates.map((candidate) => {
                const srStr = String(candidate.sr_number ?? candidate.id);
                return (
                  <option key={candidate.id || srStr} value={srStr}>
                    SR #{srStr} · {candidate.candidate_name || candidate.name}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={gridSubmitting || !gridSelected}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            <Plus size={16} /> Add
          </button>
          <button
            type="button"
            onClick={handleCreateEmptyBallot}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            <Plus size={16} /> Create Empty Ballot
          </button>
        </form>

        {gridBallots.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
            No ballots created yet. Cast votes using batch input or quick add above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '550px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
            {gridOrientation === 'candRows' ? (
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem', minWidth: '800px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#0f172a' }}>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '40px' }}>#</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '180px' }}>Candidate</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '80px' }}>Total</th>
                    {gridBallots.map((ballot, idx) => (
                      <th key={ballot.id} style={{ padding: '0.5rem 0.4rem', textAlign: 'center', minWidth: '80px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontWeight: 800 }}>B#{idx + 1}</span>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <button
                              type="button"
                              onClick={() => handleLoadBallotToEdit(ballot, `Ballot #${idx + 1}`)}
                              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: '#6366f1' }}
                              title="Edit Ballot"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBallot(ballot.id)}
                              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: '#f87171' }}
                              title="Delete Ballot"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate, cIdx) => {
                    const srStr = String(candidate.sr_number ?? candidate.id);
                    const total = gridBallots.reduce((sum, ballot) => {
                      let count = 0;
                      if (Array.isArray(ballot.sr_numbers)) {
                        count = ballot.sr_numbers.map(s => String(s)).includes(srStr) ? 1 : 0;
                      } else if (ballot.sr_numbers && typeof ballot.sr_numbers === 'object') {
                        count = ballot.sr_numbers[srStr] || 0;
                      }
                      return sum + count;
                    }, 0);

                    return (
                      <tr key={candidate.id || srStr} style={{ color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="hover-row">
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 800 }}>{cIdx + 1}</td>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>
                          <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: '4px', marginRight: '6px', fontSize: '0.75rem' }}>
                            SR #{srStr}
                          </span>
                          {candidate.candidate_name || candidate.name}
                        </td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 800, color: total > 0 ? '#fbbf24' : '#64748b' }}>
                          {total}
                        </td>
                        {gridBallots.map((ballot) => {
                          let count = 0;
                          if (Array.isArray(ballot.sr_numbers)) {
                            count = ballot.sr_numbers.map(s => String(s)).includes(srStr) ? 1 : 0;
                          } else if (ballot.sr_numbers && typeof ballot.sr_numbers === 'object') {
                            count = ballot.sr_numbers[srStr] || 0;
                          }

                          return (
                            <td key={ballot.id} style={{ padding: '0.4rem 0.2rem', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                              <input
                                type="number"
                                min="0"
                                value={count}
                                onChange={(e) => handleUpdateCell(ballot.id, srStr, e.target.value)}
                                style={{
                                  width: '52px',
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  background: count > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: count > 0 ? '#34d399' : '#475569',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '4px',
                                  fontWeight: count > 0 ? 800 : 500
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', color: '#fbbf24' }}>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 800 }}></td>
                    <td style={{ padding: '0.6rem 1rem', fontWeight: 800 }}>Ballot Total</td>
                    <td style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 800 }}>
                      {gridBallots.reduce((sum, ballot) => {
                        if (Array.isArray(ballot.sr_numbers)) return sum + ballot.sr_numbers.length;
                        if (ballot.sr_numbers && typeof ballot.sr_numbers === 'object') return sum + Object.values(ballot.sr_numbers).reduce((s, v) => s + (Number(v) || 0), 0);
                        return sum;
                      }, 0)}
                    </td>
                    {gridBallots.map((ballot) => {
                      const ballotTotal = Array.isArray(ballot.sr_numbers)
                        ? ballot.sr_numbers.length
                        : (ballot.sr_numbers && typeof ballot.sr_numbers === 'object' ? Object.values(ballot.sr_numbers).reduce((s, v) => s + (Number(v) || 0), 0) : 0);
                      return (
                        <td key={ballot.id} style={{ padding: '0.4rem 0.2rem', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', fontWeight: 800 }}>
                          {ballotTotal}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem', minWidth: '800px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#0f172a' }}>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '100px' }}>Ballot #</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '120px' }}>Actions</th>
                    {candidates.map((candidate) => {
                      const srStr = String(candidate.sr_number ?? candidate.id);
                      return (
                        <th key={candidate.id || srStr} style={{ padding: '0.5rem 0.4rem', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                          SR #{srStr}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {gridBallots.map((ballot, idx) => {
                    return (
                      <tr key={ballot.id} style={{ color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 800 }}>Ballot {idx + 1}</td>
                        <td style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleLoadBallotToEdit(ballot, `Ballot #${idx + 1}`)}
                              className="btn btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBallot(ballot.id)}
                              className="btn btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '0.75rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Trash2 size={11} /> Del
                            </button>
                          </div>
                        </td>
                        {candidates.map((candidate) => {
                          const srStr = String(candidate.sr_number ?? candidate.id);
                          let count = 0;
                          if (Array.isArray(ballot.sr_numbers)) {
                            count = ballot.sr_numbers.map(s => String(s)).includes(srStr) ? 1 : 0;
                          } else if (ballot.sr_numbers && typeof ballot.sr_numbers === 'object') {
                            count = ballot.sr_numbers[srStr] || 0;
                          }

                          return (
                            <td key={candidate.id || srStr} style={{ padding: '0.4rem 0.2rem', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                              <input
                                type="number"
                                min="0"
                                value={count}
                                onChange={(e) => handleUpdateCell(ballot.id, srStr, e.target.value)}
                                style={{
                                  width: '52px',
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  background: count > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.02)',
                                  color: count > 0 ? '#34d399' : '#475569',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '4px',
                                  fontWeight: count > 0 ? 800 : 500
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
