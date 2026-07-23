import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ManualVote from './components/ManualVote';
import Candidates from './components/Candidates';
import UserManagement from './components/UserManagement';
import ResetPassword from './components/ResetPassword';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    const storedUser = localStorage.getItem('svit_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setActiveTab('dashboard');
      } catch (err) {
        localStorage.removeItem('svit_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('svit_user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('svit_user');
    setActiveTab('login');
  };

  if (!user && activeTab !== 'reset-password') {
    return <Login onLoginSuccess={handleLoginSuccess} setActiveTab={setActiveTab} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'manual-vote' && <ManualVote />}
        {activeTab === 'candidates' && <Candidates />}
        {activeTab === 'users' && <UserManagement />}
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
