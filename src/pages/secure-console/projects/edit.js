import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../../components/dashboard/Layout';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function ProjectEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ title: '', description: '', technologies: [], githubUrl: '', liveUrl: '', demoVideoUrl: '', repoVisibility: 'public', featured: false, published: false, summary: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) {
      setFormError('Choose a project from the project library before editing.');
      setLoading(false);
      return;
    }
    const projectId = Array.isArray(id) ? id[0] : id;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/projects?id=${encodeURIComponent(projectId)}`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Project not found.' : `Unable to load project (status ${res.status}).`);
        const json = await res.json();
        if (!json) throw new Error('Project not found.');
        if (cancelled) return;
        setForm((f) => ({ ...f, ...json, summary: json.summary || json.shortDescription || '' }));
        if (json.coverImage || json.thumbnail) setPreviewUrl(json.coverImage || json.thumbnail);
      } catch (err) {
        if (!cancelled) setFormError(err.message || 'Failed to load project.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, router.isReady]);

  useEffect(() => {
    return () => { if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const previewPublicUrl = form.liveUrl || (id ? `/projects/${form.slug || id}` : null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function addTech(tag) {
    if (!tag) return;
    setForm((f) => ({ ...f, technologies: Array.from(new Set([...(f.technologies || []), tag])) }));
  }

  function removeTech(tag) {
    setForm((f) => ({ ...f, technologies: (f.technologies || []).filter((t) => t !== tag) }));
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title || form.title.length < 3) {
      setFormError('Enter a project title with at least three characters.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = new FormData();
      const projectId = Array.isArray(id) ? id[0] : id;
      if (projectId) payload.append('id', projectId);
      payload.append('title', form.title);
      payload.append('summary', form.summary || '');
      payload.append('description', form.description || '');
      payload.append('technologies', JSON.stringify(form.technologies || []));
      payload.append('githubUrl', form.githubUrl || '');
      payload.append('liveUrl', form.liveUrl || '');
      payload.append('demoVideoUrl', form.demoVideoUrl || '');
      payload.append('repoVisibility', form.repoVisibility || 'public');
      payload.append('featured', form.featured ? 'true' : 'false');
      payload.append('published', form.published ? 'true' : 'false');
      if (file) payload.append('image', file);

      const res = await fetch('/api/admin/projects', { method: 'POST', body: payload });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || `Unable to save project (status ${res.status}).`);
      }
      router.push('/secure-console/projects');
    } catch (err) {
      setFormError(err.message || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="skill-edit-grid">
        <form onSubmit={submit} className="skill-form-card glass-card">
          <div className="section-title-row">
            <div>
              <h2 className="sci-title">{id ? 'Edit Project' : 'New Project'}</h2>
              <div className="muted">{id ? 'Edit the project details shown on its public portfolio card and detail page.' : 'Create a project and preview it as you work.'}</div>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Title</label>
            <input name="title" className="form-input" value={form.title} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Summary</label>
            <textarea name="summary" className="form-input" rows={3} value={form.summary || ''} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input" rows={8} value={form.description} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Technologies</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input id="techInput" placeholder="Add tech and press Enter" className="form-input" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { addTech(v); e.target.value=''; } } }} />
            </div>
            <div style={{ marginTop: 8 }}>
              {(form.technologies || []).map((t) => (
                <button key={t} type="button" className="skill-chip" style={{ marginRight: 8 }} onClick={() => removeTech(t)}>{t} ×</button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">GitHub URL</label>
            <input name="githubUrl" className="form-input" value={form.githubUrl} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Live URL</label>
            <input name="liveUrl" className="form-input" value={form.liveUrl} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Demo video URL</label>
            <input name="demoVideoUrl" className="form-input" value={form.demoVideoUrl || ''} onChange={handleChange} />
          </div>

          <div className="form-row">
            <label className="form-label">Repository visibility</label>
            <select name="repoVisibility" className="form-input" value={form.repoVisibility || 'public'} onChange={handleChange}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="form-row">
            <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured</label>
          </div>

          <div className="form-row">
            <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="checkbox" name="published" checked={Boolean(form.published)} onChange={handleChange} />
              Published on the public portfolio
            </label>
            <small className="muted">A cover image is required before a project can be published.</small>
          </div>

          <div className="form-row">
            <label className="form-label">Cover Image</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="form-actions">
            <button type="submit" className="tab-like" disabled={loading || saving}>{saving ? 'Saving…' : 'Save project'}</button>
            <button type="button" onClick={() => router.push('/secure-console/projects')} className="tab-like">Cancel</button>
          </div>
          {loading ? <p className="muted">Loading project…</p> : null}
          {formError ? (
            <p role="alert" style={{ color: '#ffb4b4', background: 'rgba(255, 0, 0, 0.05)', padding: 10, borderRadius: 8 }}>
              {formError}
            </p>
          ) : null}
        </form>

        <aside className="skill-preview-card glass-card">
          <div className="skill-preview-body">
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {previewPublicUrl ? (
                <a
                  href={previewPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tab-like"
                  onClick={(e) => {
                    if (!previewPublicUrl) return;
                    e.preventDefault();
                    let candidate = previewPublicUrl;
                    if (typeof candidate !== 'string') {
                      if (candidate && (candidate.href || candidate.url)) candidate = candidate.href || candidate.url;
                      else candidate = String(candidate);
                    }
                    const url = candidate && candidate.startsWith('http') ? candidate : `${window.location.origin}${candidate.startsWith('/') ? candidate : `/${candidate}`}`;
                    console.debug('Attempting open public preview URL', { previewPublicUrl, candidate, url });
                    const w = window.open(url, '_blank');
                    if (!w) window.location.assign(url);
                  }}
                >Open public</a>
              ) : null}
            </div>
            <div className="skill-preview-name">{form.title || 'Untitled project'}</div>
            <div style={{ height: 160, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ padding: 18 }} className="muted">No cover image</div>
              )}
            </div>

            <div className="skill-preview-body" style={{ marginTop: 8 }}>
              <div className="muted">Summary</div>
              <div>{form.summary || (form.description && form.description.slice(0, 160)) || 'No summary provided.'}</div>
            </div>

            <div className="skill-preview-footer">
              {(form.technologies || []).map((t) => <div key={t} className="skill-chip small">{t}</div>)}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
