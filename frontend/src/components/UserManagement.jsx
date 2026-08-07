import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, AlertCircle, CheckCircle2, Pencil, X } from 'lucide-react';

const ALL_PAGES = [
  { key: 'dashboard', label: 'Voting Dashboard' },
  { key: 'results', label: 'Election Results' },
  { key: 'manual-vote', label: 'Manual / Bulk Vote' },
  { key: 'voter-list', label: 'Voter List' },
  { key: 'candidates', label: 'Candidates' }
];

const ROLE_DEFAULTS = {
  admin: ['dashboard', 'results', 'manual-vote', 'voter-list', 'candidates', 'users'],
  'data-entry': ['manual-vote', 'voter-list', 'candidates'],
  member: ['dashboard', 'results'],
  observer: ['dashboard', 'results'],
  dashboard: ['dashboard']
};

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [selectedPages, setSelectedPages] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const applyRoleDefaults = (role) => {
    setSelectedPages((ROLE_DEFAULTS[role] || ROLE_DEFAULTS.dashboard).filter((p) => ALL_PAGES.some((a) => a.key === p)));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setNewRole(role);
    applyRoleDefaults(role);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/users', { headers: { 'X-Username': user?.username || '' } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const togglePage = (key) => {
    setSelectedPages((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);
  };

  const resetForm = () => {
    setEditingUserId(null);
    setNewUsername('');
    setNewPassword('');
    setNewRole('member');
    setSelectedPages([]);
  };

  const handleStartEdit = (u) => {
    setEditingUserId(u.id || u.username);
    setNewUsername(u.username || '');
    setNewPassword('');
    setNewRole(u.role || 'member');
    setSelectedPages((u.pages || ROLE_DEFAULTS[u.role] || ROLE_DEFAULTS.dashboard).filter((p) => ALL_PAGES.some((a) => a.key === p)));
    setStatusMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setStatusMsg({ type: 'error', text: 'Username is required.' });
      return;
    }
    if (!editingUserId && !newPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Password is required for new users.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const payload = {
      username: newUsername.trim(),
      role: newRole,
      pages: selectedPages
    };
    if (newPassword.trim()) payload.password = newPassword.trim();

    try {
      const res = await fetch(editingUserId ? `/users/${editingUserId}` : '/register', {
        method: editingUserId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && (data.success || data.data)) {
        setStatusMsg({ type: 'success', text: editingUserId ? `User ${newUsername} updated successfully!` : `User ${newUsername} successfully created!` });
        resetForm();
        fetchUsers();
      } else {
        setStatusMsg({ type: 'error', text: data.error || data.message || 'Failed to save user.' });
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
        if (String(editingUserId) === String(userId)) resetForm();
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: data.error || 'Failed to delete user.' });
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
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Assign roles and choose which pages each user can see</p>
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
        {/* Create / Edit User Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="#38bdf8" /> {editingUserId ? 'Edit User Account' : 'Add User Account'}
          </h3>

          <form onSubmit={handleSubmitUser}>
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
                Password {editingUserId ? '(leave blank to keep current)' : ''}
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required={!editingUserId}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Role
              </label>
              <select
                className="form-input"
                value={newRole}
                onChange={handleRoleChange}
              >
                <option value="member">Member (Voter)</option>
                <option value="data-entry">Data Entry</option>
                <option value="admin">Administrator</option>
                <option value="observer">Observer</option>
                <option value="dashboard">Dashboard Only</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Pages User Can See
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ALL_PAGES.map((p) => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(p.key)}
                      onChange={() => togglePage(p.key)}
                      style={{ accentColor: '#38bdf8' }}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              {selectedPages.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.4rem' }}>No pages selected — user will only see the login/dashboard screen.</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Saving...' : (editingUserId ? 'Save Changes' : 'Create Account')}
            </button>
            {editingUserId && (
              <button
                type="button"
                className="btn"
                onClick={resetForm}
                disabled={loading}
                style={{ width: '100%', marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <X size={16} /> Cancel Edit
              </button>
            )}
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
                  <th style={{ padding: '10px' }}>Assigned Pages</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const pages = u.pages || ROLE_DEFAULTS[u.role] || [];
                  const pageLabels = pages
                    .map((p) => ALL_PAGES.find((a) => a.key === p)?.label || (p === 'users' ? 'User Roles' : p))
                    .filter(Boolean);
                  return (
                    <tr key={u.id || u.username} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: '#f8fafc' }}>
                        {u.username}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                          {u.role || 'Member'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {pageLabels.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>None</span>
                          ) : (
                            pageLabels.map((l) => (
                              <span key={l} style={{ fontSize: '0.7rem', background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.3)' }}>
                                {l}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleStartEdit(u)}
                            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                            title="Edit User Role / Pages"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id || u.username)}
                            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
