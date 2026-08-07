import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Vote, Users, Award, Wifi, Server } from 'lucide-react';

export default function Results({ user }) {
  const [candidates, setCandidates] = useState([]);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [onlineVotesCast, setOnlineVotesCast] = useState(0);
  const [offlineVotesCast, setOfflineVotesCast] = useState(0);
  const [ballotStats, setBallotStats] = useState({ total: 0, online: 0, offline: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/election-results');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load results');
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      setTotalVotesCast(Number(data.total_votes_cast) || 0);
      setOnlineVotesCast(Number(data.online_votes_cast) || 0);
      setOfflineVotesCast(Number(data.offline_votes_cast) || 0);
      setBallotStats(data.ballots || { total: 0, online: 0, offline: 0, unknown: 0 });
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const maxVotes = candidates.reduce((max, c) => Math.max(max, Number(c.total_votes) || 0), 0);
  const totalBallots = totalVotesCast;
  const winner = maxVotes > 0 ? candidates.filter((c) => Number(c.total_votes) === maxVotes) : [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Trophy size={32} color="#fbbf24" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Election Results</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Candidate-wise vote count</p>
          </div>
        </div>
        <button onClick={fetchResults} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.15)', borderRadius: '14px', color: '#fbbf24' }}>
            <Award size={26} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Candidates</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{candidates.length}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '14px', color: '#34d399' }}>
            <Vote size={26} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Votes Cast</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{totalBallots}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '14px', color: '#38bdf8' }}>
            <Wifi size={26} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online Votes</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#38bdf8' }}>{onlineVotesCast}</h3>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ballotStats.online} ballot{ballotStats.online !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '14px', color: '#fbbf24' }}>
            <Server size={26} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Offline Votes</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fbbf24' }}>{offlineVotesCast}</h3>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ballotStats.offline} ballot{ballotStats.offline !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>{error}</div>
      )}

      {winner.length > 0 && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.4)', color: '#fde68a', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Trophy size={20} />
          <strong>Leading:</strong>
          {winner.map((c) => (
            <span key={c.id || c.sr_number} style={{ fontWeight: 700, color: '#f8fafc' }}>
              {c.candidate_name || `Candidate #${c.sr_number}`} — {c.total_votes} vote{c.total_votes !== 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Candidate-wise Results</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading results...</div>
        ) : candidates.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No candidates registered yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {candidates.map((c, idx) => {
              const votes = Number(c.total_votes) || 0;
              const online = Number(c.online_votes) || 0;
              const offline = Number(c.offline_votes) || 0;
              const pct = maxVotes > 0 ? Math.max(0, (votes / maxVotes) * 100) : 0;
              return (
                <div key={c.id || c.sr_number} style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: '0.9rem 1rem', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: votes === maxVotes && maxVotes > 0 ? 'rgba(251, 191, 36, 0.18)' : 'rgba(56, 189, 248, 0.14)', transition: 'width 0.5s ease' }} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: idx === 0 && maxVotes > 0 ? '#fbbf24' : '#94a3b8', flexShrink: 0 }}>
                      {idx === 0 && maxVotes > 0 ? <Trophy size={18} /> : `#${idx + 1}`}
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.photo ? (
                        <img src={c.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{c.candidate_name ? c.candidate_name.charAt(0) : '#'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.candidate_name || `Candidate #${c.sr_number}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        SR #{c.sr_number}{c.gujarati_name ? ` | ${c.gujarati_name}` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                        <span style={{ color: '#38bdf8' }}>Online: <strong>{online}</strong></span>
                        <span style={{ color: '#fbbf24' }}>Offline: <strong>{offline}</strong></span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: votes > 0 ? '#38bdf8' : '#475569' }}>{votes}</span>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>votes</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
