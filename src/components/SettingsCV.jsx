import React, { useState, useRef } from 'react';

export default function SettingsCV({ initialCv }) {
  const [cv, setCv] = useState(initialCv || null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const dropRef = useRef(null);

  function onFileSelected(f) {
    if (!f) return;
    const name = (f.name || '').toLowerCase();
    const mime = (f.type || '').toLowerCase();
    const ext = name.split('.').pop();
    const allowed = ['pdf', 'doc', 'docx'];
    const isAllowed = mime.includes('pdf') || mime.includes('word') || allowed.includes(ext);
    if (!isAllowed) {
      setMessage({ type: 'error', text: 'Only PDF, DOC or DOCX CVs are allowed' });
      return;
    }
    setFile(f);
    setMessage(null);
  }

  async function handleUpload(e) {
    e && e.preventDefault();
    if (!file) return setMessage({ type: 'error', text: 'Choose a file to upload' });
    setUploading(true); setProgress(5); setMessage(null);

    try {
      const fd = new FormData();
      fd.append('file', file);

      // upload to cloudinary endpoint
      const up = await fetch('/api/admin/uploads/upload', { method: 'POST', body: fd });
      const json = await up.json();
      if (!json.url) throw new Error(json.error || 'Upload failed');
      setProgress(70);

      // tell CV API about the uploaded file so it can be saved in settings
      const cvRes = await fetch('/api/admin/cv', { method: 'POST', body: JSON.stringify({ url: json.url, public_id: json.public_id }), headers: { 'Content-Type': 'application/json' } });
      const cvJson = await cvRes.json();
      if (!cvRes.ok) throw new Error(cvJson.error || 'Failed to save CV');

      setCv(json.url);
      setFile(null);
      setMessage({ type: 'success', text: 'CV uploaded' });
      setProgress(100);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err && err.message ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  async function remove() {
    if (!confirm('Delete CV?')) return;
    try {
      // Try to pass the public_id if known, otherwise just clear settings
      await fetch('/api/admin/cv', { method: 'DELETE', body: JSON.stringify({ public_id: null }), headers: { 'Content-Type': 'application/json' } });
      setCv(null);
      setMessage({ type: 'success', text: 'CV removed' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Delete failed' });
    }
  }

  // drag and drop handlers
  function handleDrag(e) {
    e.preventDefault(); e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.add('drag-over');
  }
  function handleDragLeave(e) {
    e.preventDefault(); e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove('drag-over');
  }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    if (dropRef.current) dropRef.current.classList.remove('drag-over');
    const f = e.dataTransfer?.files?.[0];
    if (f) onFileSelected(f);
  }

  function filenameFromUrl(u) {
    try { return decodeURIComponent(u.split('/').pop().split('?')[0]); } catch (e) { return u; }
  }

  return (
    <div className="glass-card cv-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>CV</h3>
        <div>
          {cv ? (
            <>
              <button className="sec-btn" onClick={() => window.open(cv, '_blank')}>Open</button>
              <a href={cv} download className="sec-btn" style={{ marginLeft: 8 }}>Download</a>
              <button className="sec-btn" style={{ marginLeft: 8 }} onClick={remove}>Delete</button>
            </>
          ) : (
            <span className="muted">No active CV</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div ref={dropRef} className="file-drop" onDragOver={handleDrag} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="pdf-icon">PDF</div>
            <div>
              <div style={{ fontWeight: 700 }}>{file ? file.name : (cv ? filenameFromUrl(cv) : 'No file selected')}</div>
              <div className="muted" style={{ fontSize: 13 }}>{file ? `${(file.size/1024/1024).toFixed(2)} MB` : (cv ? 'Current stored CV' : 'Drag & drop a PDF here or click to choose')}</div>
            </div>
          </div>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="file-input" onChange={(e) => onFileSelected(e.target.files?.[0] || null)} />
        </div>

        {progress > 0 && (
          <div className="progress-wrap" style={{ marginTop: 10 }}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="sec-btn primary" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload CV'}</button>
          <button className="sec-btn" onClick={() => { setFile(null); setMessage(null); }}>{file ? 'Clear' : 'Choose'}</button>
          {message ? <div style={{ marginLeft: 8, color: message.type === 'error' ? '#ff7b7b' : 'lightgreen', fontWeight: 700 }}>{message.text}</div> : null}
        </div>
      </div>
    </div>
  );
}
