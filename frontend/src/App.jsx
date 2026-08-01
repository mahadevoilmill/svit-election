import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ManualVote from './components/ManualVote';
import Candidates from './components/Candidates';
import VoterList from './components/VoterList';
import UserManagement from './components/UserManagement';
import ResetPassword from './components/ResetPassword';

const DEFAULT_THEME_COLOR = '#090d16';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const fullHex = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;

  const value = parseInt(fullHex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function getReadableTextColor(color) {
  const { r, g, b } = hexToRgb(color || DEFAULT_THEME_COLOR);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#f8fafc';
}

function getSurfaceColor(color) {
  const { r, g, b } = hexToRgb(color || DEFAULT_THEME_COLOR);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? 'rgba(255,255,255,0.8)' : 'rgba(18,26,43,0.75)';
}

function applyTheme(color) {
  const resolvedColor = color || DEFAULT_THEME_COLOR;
  const textColor = getReadableTextColor(resolvedColor);
  const surfaceColor = getSurfaceColor(resolvedColor);

  document.documentElement.style.setProperty('--color-bg-dark', resolvedColor);
  document.documentElement.style.setProperty('--color-text-primary', textColor);
  document.documentElement.style.setProperty('--color-text-muted', textColor === '#f8fafc' ? '#94a3b8' : '#475569');
  document.documentElement.style.setProperty('--color-bg-card', surfaceColor);
  document.documentElement.style.setProperty('--color-border', textColor === '#f8fafc' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)');
  document.documentElement.style.setProperty('--color-input-bg', textColor === '#f8fafc' ? 'rgba(9,13,22,0.85)' : 'rgba(255,255,255,0.75)');
  document.documentElement.style.setProperty('--color-input-text', textColor);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');
  const [bgColor, setBgColor] = useState(DEFAULT_THEME_COLOR);
  const [candidatePrefill, setCandidatePrefill] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('svit_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        const validTabs = ['dashboard', 'manual-vote', 'voter-list', 'candidates', 'users'];
        const adminTabs = ['manual-vote', 'voter-list', 'candidates', 'users'];
        const storedTab = localStorage.getItem('svit_active_tab');
        if (storedTab && validTabs.includes(storedTab) && (parsed.role === 'admin' || !adminTabs.includes(storedTab))) {
          setActiveTab(storedTab);
        } else {
          setActiveTab('dashboard');
        }
      } catch (err) {
        localStorage.removeItem('svit_user');
      }
    }
    // Load stored background color (if any)
    const storedBg = localStorage.getItem('svit_bg_color');
    const initialColor = storedBg || DEFAULT_THEME_COLOR;
    setBgColor(initialColor);
    try {
      applyTheme(initialColor);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (user && activeTab && activeTab !== 'login') {
      try { localStorage.setItem('svit_active_tab', activeTab); } catch (e) {}
    }
  }, [activeTab, user]);

  const handleBgColorChange = (color) => {
    const nextColor = color || DEFAULT_THEME_COLOR;
    setBgColor(nextColor);
    try {
      applyTheme(nextColor);
      localStorage.setItem('svit_bg_color', nextColor);
    } catch (e) {}
  };

  const handleResetBgColor = () => {
    setBgColor(DEFAULT_THEME_COLOR);
    try {
      applyTheme(DEFAULT_THEME_COLOR);
      localStorage.removeItem('svit_bg_color');
    } catch (e) {}
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('svit_user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('svit_user');
    localStorage.removeItem('svit_active_tab');
    setActiveTab('login');
  };

  if (!user && activeTab !== 'reset-password') {
    return <Login onLoginSuccess={handleLoginSuccess} setActiveTab={setActiveTab} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--color-text-primary)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        bgColor={bgColor}
        onBgColorChange={handleBgColorChange}
        onResetBgColor={handleResetBgColor}
      />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'manual-vote' && (user?.role === 'admin' ? <ManualVote user={user} /> : (setActiveTab('dashboard'), null))}
        {activeTab === 'voter-list' && (user?.role === 'admin' ? <VoterList user={user} setActiveTab={setActiveTab} setCandidatePrefill={setCandidatePrefill} /> : (setActiveTab('dashboard'), null))}
        {activeTab === 'candidates' && (user?.role === 'admin' ? <Candidates user={user} candidatePrefill={candidatePrefill} clearCandidatePrefill={() => setCandidatePrefill(null)} /> : (setActiveTab('dashboard'), null))}
        {activeTab === 'users' && (user?.role === 'admin' ? <UserManagement user={user} /> : (setActiveTab('dashboard'), null))}
        {activeTab === 'reset-password' && <ResetPassword setActiveTab={setActiveTab} />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#64748b',
        fontSize: '0.8rem'
      }}>
        © 2026 SVIT Election Committee • Built with React & Node.js Express
      </footer>
    </div>
  );
}
