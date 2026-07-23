import React from 'react';
import { Vote, LayoutDashboard, FileSpreadsheet, Users, UserPlus, KeyRound, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <nav className="glass-panel" style={{ margin: '1rem', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: 'var(--gradient-primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Vote size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SVIT ELECTION
          </h1>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Secure Voting Portal 2.0
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <LayoutDashboard size={16} /> Voting Dashboard
        </button>

        <button 
          className={`btn ${activeTab === 'manual-vote' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('manual-vote')}
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <FileSpreadsheet size={16} /> Manual / Bulk Vote
        </button>

        <button 
          className={`btn ${activeTab === 'candidates' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('candidates')}
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <UserPlus size={16} /> Candidates
        </button>

        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <Users size={16} /> User Roles
        </button>

        <button 
          className={`btn ${activeTab === 'reset-password' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('reset-password')}
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <KeyRound size={16} /> Password Reset
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
            {user?.username || 'Guest'}
          </div>
          <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
            {user?.role || 'User'}
          </span>
        </div>
        
        <button 
          className="btn btn-danger" 
          onClick={onLogout}
          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
