import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/users', { headers: { 'X-Username': user?.username || '' } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Username and Password are required.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: `User ${newUsername} successfully created!` });
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to create user.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Server connection error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/users/${userId}`, { method: 'DELETE', headers: { 'X-Username': user?.username || '' } });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'User removed.' });
        fetchUsers();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to delete user.' });
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Users size={32} color="#38bdf8" />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>User Roles & Administration</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Manage user credentials and voting authority roles</p>
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
        {/* Create User Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="#38bdf8" /> Add User Account
          </h3>

          <form onSubmit={handleRegisterUser}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                User ID / Username
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Password
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Role
              </label>
              <select
                className="form-input"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="member">Member (Voter)</option>
                <option value="admin">Administrator</option>
                <option value="observer">Observer</option>
                <option value="dashboard">Dashboard Only</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* User Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            System Users ({users.length})
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '10px' }}>User ID</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id || u.username} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: '#f8fafc' }}>
                      {u.username}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                        {u.role || 'Member'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteUser(u.id || u.username)}
                        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
