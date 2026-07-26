import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, Send, FileText } from 'lucide-react';

export default function ManualVote({ user }) {
  const [srNumber, setSrNumber] = useState('');
  const [votesInput, setVotesInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [uploadLog, setUploadLog] = useState([]);

  const handleSingleVoteSubmit = async (e) => {
    e.preventDefault();
    if (!srNumber.trim() || !votesInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter SR Number and selected candidate numbers.' });
      return;
    }

    // Parse votes input (comma separated or space separated)
    const votesArray = votesInput.split(/[\s,]+/).map(v => v.trim()).filter(Boolean);

    setSingleSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/voters-list/by-sr/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Username': user?.username || '' },
        body: JSON.stringify({
          sr_number: srNumber.trim(),
          entered_by: user?.username || 'NEST',
          votes: votesArray
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `Manual Vote Recorded for SR #${srNumber}!` });
        setSrNumber('');
        setVotesInput('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to record vote.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network connection error.' });
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatusMessage({ type: 'error', text: 'Please select an Excel (.xlsx/.xls) file to upload.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/upload-excel', {
        method: 'POST',
        headers: { 'X-Username': user?.username || '' },
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `Bulk Excel processing completed! ${data.processedCount || 0} records updated.` });
        setUploadLog(data.logs || []);
        setSelectedFile(null);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to process Excel upload.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to upload Excel file.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FileSpreadsheet size={32} color="#818cf8" />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Manual Vote Casting & Bulk Excel Processing</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Cast single votes by SR Number or upload bulk Excel vote data</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* Single SR Vote Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={20} color="#6366f1" /> Single Vote by SR Number
          </h3>

          <form onSubmit={handleSingleVoteSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Voter SR Number
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 101"
                value={srNumber}
                onChange={(e) => setSrNumber(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Candidate Selections (Comma or space separated SR numbers)
              </label>
              <textarea
                className="form-input"
                style={{ height: '100px', resize: 'vertical' }}
                placeholder="e.g. 1, 4, 7, 12, 15"
                value={votesInput}
                onChange={(e) => setVotesInput(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={singleSubmitting}
              style={{ width: '100%' }}
            >
              {singleSubmitting ? 'Recording Vote...' : 'Record Manual Vote'}
            </button>
          </form>
        </div>

        {/* Bulk Excel Upload Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={20} color="#10b981" /> Bulk Excel Import
            </h3>
            
            <a
              href="/voter-template"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              download
            >
              <Download size={14} /> Template
            </a>
          </div>

          <form onSubmit={handleFileUpload}>
            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              background: 'rgba(15, 23, 42, 0.4)',
              cursor: 'pointer'
            }}>
              <FileText size={40} color="#818cf8" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                {selectedFile ? selectedFile.name : 'Select Excel Vote Sheet (.xlsx / .xls)'}
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="excelFileInput"
              />
              <label htmlFor="excelFileInput" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Browse File
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-success"
              disabled={uploading || !selectedFile}
              style={{ width: '100%' }}
            >
              {uploading ? 'Processing Excel Sheet...' : 'Upload & Execute Bulk Votes'}
            </button>
          </form>

          {uploadLog.length > 0 && (
            <div style={{ marginTop: '1.5rem', maxHeight: '180px', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.8)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>Processing Output:</div>
              {uploadLog.map((logItem, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>• {logItem}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
