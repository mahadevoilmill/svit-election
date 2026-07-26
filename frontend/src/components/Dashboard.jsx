import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, Users, Award, Vote, RefreshCw } from 'lucide-react';

export default function Dashboard({ user }) {
  const [voters, setVoters] = useState([]);
  const [ballots, setBallots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingSuccess, setVotingSuccess] = useState('');
  const [votingError, setVotingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_SELECTION = 17;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [votersRes, ballotsRes] = await Promise.all([
        fetch('/voters-list'),
        fetch('/ballots')
      ]);
      const votersData = await votersRes.json();
      const ballotsData = await ballotsRes.json();

      setVoters(Array.isArray(votersData) ? votersData : votersData.data || []);
      setBallots(Array.isArray(ballotsData) ? ballotsData : ballotsData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateToggle = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      if (selectedCandidates.length >= MAX_SELECTION) {
        setVotingError(`You can select a maximum of ${MAX_SELECTION} candidates.`);
        return;
      }
      setVotingError('');
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  const handleCastVote = async () => {
    if (!selectedVoter) {
      setVotingError('Please select a voter / SR Number first.');
      return;
    }
    if (selectedCandidates.length === 0) {
      setVotingError('Please select at least 1 candidate.');
      return;
    }

    setIsSubmitting(true);
    setVotingError('');
    setVotingSuccess('');

    try {
      const res = await fetch('/voters-list/by-sr/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sr_number: selectedVoter.sr_number || selectedVoter.srNo,
          entered_by: user?.username || 'NEST',
          votes: selectedCandidates
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setVotingSuccess(`Vote successfully cast for SR #${selectedVoter.sr_number || selectedVoter.srNo}!`);
        setSelectedCandidates([]);
        setSelectedVoter(null);
        fetchData();
      } else {
        setVotingError(data.error || 'Failed to submit vote.');
      }
    } catch (err) {
      setVotingError('Network error submitting vote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVoters = voters.filter(v => v.status !== 'cancelled');

  const filteredVoters = activeVoters.filter(v => {
    const sr = String(v.sr_number || v.srNo || '').toLowerCase();
    const name = String(v.name || v.memberName || v.voter_name || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return sr.includes(term) || name.includes(term);
  });

  const totalVoted = voters.filter(v => v.has_voted || v.status === 'voted' || v.hasVoted).length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      {/* Top Banner Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '14px', color: '#818cf8' }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Voters (Active)</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '2px 0 0', color: '#f8fafc' }}>{activeVoters.length}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '14px', color: '#34d399' }}>
            <Vote size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Votes Cast</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '2px 0 0', color: '#f8fafc' }}>{totalVoted}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '14px', color: '#c084fc' }}>
            <Award size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ballot Candidates</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '2px 0 0', color: '#f8fafc' }}>{ballots.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Voter Selection & Candidate Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Voter List & Search */}
        <div className="glass-panel" style={{ padding: '1.25rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select Member</h3>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer' }} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
              placeholder="Search SR Number or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredVoters.map((voter) => {
              const isVoted = voter.has_voted || voter.status === 'voted';
              const isSelected = selectedVoter?.id === voter.id;

              return (
                <div
                  key={voter.id || voter.sr_number}
                  onClick={() => !isVoted && setSelectedVoter(voter)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.4)',
                    border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: isVoted ? 'not-allowed' : 'pointer',
                    opacity: isVoted ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                      SR #{voter.sr_number || voter.srNo}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {voter.voter_name || voter.name || voter.memberName || 'Member'}
                    </div>
                  </div>
                  {isVoted ? (
                    <span className="badge badge-voted"><CheckCircle2 size={12} /> Voted</span>
                  ) : (
                    <span className="badge badge-member">Eligible</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ballot & Voting Area */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Official Election Ballot</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Select up to <strong style={{ color: '#818cf8' }}>{MAX_SELECTION}</strong> candidates. 
                Selected: <strong style={{ color: '#34d399' }}>{selectedCandidates.length} / {MAX_SELECTION}</strong>
              </p>
            </div>
            
            <button
              className="btn btn-success"
              onClick={handleCastVote}
              disabled={isSubmitting || !selectedVoter || selectedCandidates.length === 0}
            >
              <Vote size={18} /> {isSubmitting ? 'Casting Vote...' : 'Submit Official Vote'}
            </button>
          </div>

          {votingSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} /> {votingSuccess}
            </div>
          )}

          {votingError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> {votingError}
            </div>
          )}

          {selectedVoter && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Casting Vote For: <strong>SR #{selectedVoter.sr_number || selectedVoter.srNo} - {selectedVoter.voter_name || selectedVoter.name || 'Member'}</strong></span>
              <button onClick={() => setSelectedVoter(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.85rem' }}>Change Member</button>
            </div>
          )}

          {/* Candidate Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {ballots.map((candidate) => {
              const isChecked = selectedCandidates.includes(candidate.id || candidate.sr_number);

              return (
                <div
                  key={candidate.id || candidate.sr_number}
                  onClick={() => handleCandidateToggle(candidate.id || candidate.sr_number)}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    cursor: 'pointer',
                    border: isChecked ? '2px solid #34d399' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className="badge badge-admin">#{candidate.sr_number || candidate.id}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
                    {candidate.candidate_name || candidate.name || `Candidate #${candidate.sr_number}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {candidate.party || candidate.position || 'Executive Candidate'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
