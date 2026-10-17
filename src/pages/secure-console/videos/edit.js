import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import { useRouter } from 'next/router';

const initialForm = {
  title: '',
  description: '',
  url: '',
  youtubeUrl: '',
  published: false,
};

export default function VideoEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/admin/videos?id=${id}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json) setForm((f) => ({ ...f, ...json }));
    })();
  }, [id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title?.trim()) return alert('Title required');
    if (!form.url?.trim() && !form.youtubeUrl?.trim()) return alert('Provide a video URL or YouTube link');

    setSaving(true);
    setStatusMessage('Saving video details…');
    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('description', form.description || '');
    payload.append('url', form.url || '');
    payload.append('youtubeUrl', form.youtubeUrl || '');
    payload.append('published', form.published ? 'true' : 'false');
    if (file) payload.append('thumbnail', file);
    if (id) payload.append('id', id);

    const res = await fetch('/api/admin/videos', { method: 'POST', body: payload });
    if (res.ok) {
      router.push('/secure-console/videos');
    } else {
      setSaving(false);
      setStatusMessage('Unable to save the video.');
      alert('Error saving');
    }
  }

  return (
    <Layout>
      <div className="page-header skills-header">
        <div>
          <h2 className="sci-title">{id ? 'Edit Video' : 'Add Video'}</h2>
          <p className="page-subtitle">Create or update a video entry, then preview how it will appear in your admin library.</p>
        </div>
      </div>

      <div className="skill-edit-grid">
        <form onSubmit={submit} className="skill-form-card">
          <div className="section-title-row">
            <div>
              <h3>Video details</h3>
              <p className="muted">Fill in the metadata and upload a thumbnail for a strong presentation.</p>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Title</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={5} name="description" value={form.description} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">YouTube URL</label>
            <input className="form-input" name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Direct video URL</label>
            <input className="form-input" name="url" value={form.url} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Thumbnail</label>
            <input className="form-input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? <small className="muted">Selected file: {file.name}</small> : null}
          </div>

          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
              {' '}Published
            </label>
            <span className="muted">Toggle live visibility</span>
          </div>

          <div className="form-actions">
            <button type="submit" className="tab-like primary" disabled={saving}>{saving ? 'Saving…' : 'Save Video'}</button>
            <button type="button" onClick={() => router.push('/secure-console/videos')} className="tab-like">Cancel</button>
          </div>
          {statusMessage ? <div className="form-message success">{statusMessage}</div> : null}
        </form>

        <div className="skill-preview-card video-preview-card">
          <div className="section-title-row">
            <div>
              <h3>Preview</h3>
              <p className="muted">Check the video summary before saving.</p>
            </div>
          </div>

          {form.title || form.description || form.youtubeUrl || form.url ? (
            <div className="video-preview-body">
              <div className="video-preview-row">
                <span className="preview-label">Title</span>
                <strong>{form.title || 'Untitled video'}</strong>
              </div>
              <div className="video-preview-row">
                <span className="preview-label">Source</span>
                <span>{form.youtubeUrl ? 'YouTube' : form.url ? 'Direct URL' : 'None'}</span>
              </div>
              {form.youtubeUrl ? (
                <div className="video-preview-embed">
                  <a href={form.youtubeUrl} target="_blank" rel="noreferrer" className="tab-like">Open YouTube preview</a>
                </div>
              ) : null}
              {form.description ? <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{form.description}</p> : null}
              <div className="video-meta-grid">
                <div className="video-meta-card">
                  <div className="metric-label">Visibility</div>
                  <div className="metric-value">{form.published ? 'Published' : 'Draft'}</div>
                </div>
                <div className="video-meta-card">
                  <div className="metric-label">Video type</div>
                  <div className="metric-value">{form.youtubeUrl ? 'YouTube' : form.url ? 'Direct link' : 'Unspecified'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-empty">Enter a title and URL to preview this video entry.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
