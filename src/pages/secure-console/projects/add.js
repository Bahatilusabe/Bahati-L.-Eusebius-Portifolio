import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../../components/dashboard/Layout';
import { useRouter } from 'next/router';

function slugify(v) {
  return String(v || '').toLowerCase().trim().replace(/[^a-z0-9\-\s]/g, '').replace(/\s+/g, '-').replace(/\-+/g, '-').replace(/^\-|\-$/g, '');
}

export default function AddProject() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', slug: '', summary: '', description: '', technologies: [], githubUrl: '', liveUrl: '', demoVideoUrl: '', repoVisibility: 'public', featured: false });
  const [techInput, setTechInput] = useState('');
  const [thumb, setThumb] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [gallery, setGallery] = useState([]); // { file, url }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(true);
  const [dirtySlug, setDirtySlug] = useState(false);
  const galleryRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    // create/revoke thumb preview
    if (thumb) {
      const u = URL.createObjectURL(thumb);
      setThumbPreview(u);
      return () => { URL.revokeObjectURL(u); };
    } else {
      setThumbPreview(null);
    }
    return undefined;
  }, [thumb]);

  useEffect(() => {
    // auto-generate slug from title when slug is empty and user hasn't edited slug
    if (!dirtySlug && !form.slug && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, dirtySlug]);

  // debounce-check slug availability
  useEffect(() => {
    if (!form.slug) {
      setSlugAvailable(true);
      return undefined;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/projects?slug=${encodeURIComponent(form.slug)}`);
        const j = await r.json();
        if (cancelled) return;
        setSlugAvailable(!j.exists);
      } catch (e) {
        if (cancelled) return;
        setSlugAvailable(true);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(id); };
  }, [form.slug]);

  useEffect(() => {
    return () => {
      // cleanup gallery previews on unmount
      gallery.forEach((g) => { if (g.url) URL.revokeObjectURL(g.url); });
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onThumbChange(e) {
    const file = e.target.files?.[0] || null;
    setThumb(file);
  }

  function addGalleryFiles(files) {
    const filesArr = Array.from(files || []);
    const wrapped = filesArr.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setGallery((g) => [...g, ...wrapped]);
  }

  function onGalleryChange(e) {
    addGalleryFiles(e.target.files || []);
  }

  function removeGallery(i) {
    setGallery((g) => {
      const copy = [...g];
      const [removed] = copy.splice(i, 1);
      if (removed && removed.url) URL.revokeObjectURL(removed.url);
      return copy;
    });
  }

  function onTechKeyDown(e) {
    if (!techInput) return;
    if (e.key === 'Enter' || e.key === ',' ) {
      e.preventDefault();
      const v = techInput.trim();
      if (v && !form.technologies.includes(v)) {
        setForm((f) => ({ ...f, technologies: [...(f.technologies || []), v] }));
      }
      setTechInput('');
    }
    if (e.key === 'Backspace' && !techInput) {
      setForm((f) => ({ ...f, technologies: (f.technologies || []).slice(0, -1) }));
    }
  }

  function removeTech(idx) {
    setForm((f) => ({ ...f, technologies: (f.technologies || []).filter((_, i) => i !== idx) }));
  }

  // drag & drop handlers for gallery
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return undefined;
    function onDrop(e) {
      e.preventDefault();
      const files = e.dataTransfer?.files || [];
      addGalleryFiles(files);
    }
    function onDragOver(e) { e.preventDefault(); }
    el.addEventListener('drop', onDrop);
    el.addEventListener('dragover', onDragOver);
    return () => {
      el.removeEventListener('drop', onDrop);
      el.removeEventListener('dragover', onDragOver);
    };
  }, []);

  async function save(publish = false) {
    if (form.title == null) return alert('Title is required');
    setSaving(true);
    setFormError('');
    try {
      // client-side validation: publishing requires a cover image
      if (publish) {
        if (!thumb) {
          setFormError('A cover image is required to publish a project. Please upload a thumbnail.');
          setSaving(false);
          return;
        }
        // ensure slug is available before publishing
        if (form.slug && !slugAvailable) {
          setFormError('The chosen slug is already taken; please pick another one.');
          setSaving(false);
          return;
        }
      }
      const payload = new FormData();
      payload.append('title', form.title);
      if (form.slug) payload.append('slug', form.slug);
      payload.append('description', form.description || '');
      payload.append('summary', form.summary || '');
      payload.append('technologies', JSON.stringify(form.technologies || []));
      payload.append('githubUrl', form.githubUrl || '');
      payload.append('liveUrl', form.liveUrl || '');
      payload.append('demoVideoUrl', form.demoVideoUrl || '');
      payload.append('repoVisibility', form.repoVisibility);
      payload.append('featured', form.featured ? 'true' : 'false');
      payload.append('status', publish ? 'published' : 'draft');
      payload.append('published', publish ? 'true' : 'false');
      if (thumb) payload.append('thumbnail', thumb);
      gallery.forEach((g) => payload.append('gallery', g.file));

      const res = await fetch('/api/admin/projects', { method: 'POST', body: payload });
      let json = null;
      try { json = await res.json(); } catch (e) { /* ignore parse errors */ }
      if (!res.ok) {
        const msg = (json && (json.error || json.message)) || `Save failed (status ${res.status})`;
        setFormError(msg);
        setSaving(false);
        return;
      }
      // if published, redirect to public project page
      if (publish && json && json.slug) {
        router.push(`/projects/${json.slug}`);
        return;
      }
      router.push('/secure-console/projects');
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h2 className="sci-title">Add Project</h2>

      <div className="add-project-form">
        <main>
          <div className="glass-card">
            <h3 style={{ marginTop: 0 }}>Project details</h3>

            <label style={{ display: 'block', marginBottom: 12 }}>
              Title
              <input className="form-input" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Project title" />
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              Slug (used to build public URL)
              <input
                className="form-input"
                value={form.slug}
                onChange={(e) => { setDirtySlug(true); updateField('slug', slugify(e.target.value)); }}
                placeholder="optional-project-slug"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div className="muted" style={{ fontSize: 12 }}>Public path: {form.slug ? `/projects/${form.slug}` : 'will be generated from title'}</div>
                {form.slug ? (
                  <div style={{ fontSize: 12 }} className="muted">{slugAvailable ? <span style={{ color: '#7BD389' }}>✓ available</span> : <span style={{ color: '#ff8b8b' }}>✕ taken</span>}</div>
                ) : null}
              </div>
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              Summary
              <textarea className="form-input" rows={3} value={form.summary} onChange={(e) => updateField('summary', e.target.value)} placeholder="A concise overview of the project" />
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              Description
              <textarea className="form-input" rows={6} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Project details and context" />
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              Technologies
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                {(form.technologies || []).map((t, i) => (
                  <span key={t + i} className="tech-chip">
                    <span style={{ fontSize: 13 }}>{t}</span>
                    <button type="button" onClick={() => removeTech(i)}>×</button>
                  </span>
                ))}
                <input className="form-input" style={{ minWidth: 160 }} value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={onTechKeyDown} placeholder="Type and press Enter" />
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                GitHub URL
                <input className="form-input" value={form.githubUrl} onChange={(e) => updateField('githubUrl', e.target.value)} placeholder="https://github.com/username/repo" />
              </label>
              <label>
                Live URL
                <input className="form-input" value={form.liveUrl} onChange={(e) => updateField('liveUrl', e.target.value)} placeholder="https://example.com" />
              </label>
              <label>
                Demo video URL
                <input className="form-input" value={form.demoVideoUrl} onChange={(e) => updateField('demoVideoUrl', e.target.value)} placeholder="https://youtu.be/..." />
              </label>
              <label>
                Repository visibility
                <select className="form-input" value={form.repoVisibility} onChange={(e) => updateField('repoVisibility', e.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => updateField('featured', e.target.checked)} /> Featured
            </label>

            <div style={{ marginTop: 12 }}>
              <label>Project Thumbnail</label>
              <label className="file-input-styled">
                <span className="muted small">Choose image</span>
                <input type="file" accept="image/*" onChange={onThumbChange} />
              </label>
              {thumbPreview && (
                <div style={{ marginTop: 8, width: 160, height: 100, borderRadius: 8, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbPreview} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Gallery Upload (drag & drop supported)</label>
              <div ref={dropRef} className="file-input-styled" style={{ marginTop: 8, position: 'relative' }}>
                <span className="muted small">Choose files or drop here</span>
                <input ref={galleryRef} type="file" accept="image/*" multiple onChange={onGalleryChange} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {gallery.map((g, i) => (
                    <div key={i} style={{ width: 84, height: 84, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`gallery-${i}`} />
                      <button type="button" className="sec-btn" style={{ position: 'absolute', right: 6, top: 6, padding: '4px 6px' }} onClick={() => removeGallery(i)}>x</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ marginTop: 12, color: '#ffb4b4', background: 'rgba(255,0,0,0.03)', padding: 10, borderRadius: 8 }}>{formError}</div>
            )}
            <div className="publish-row">
              <button className="sec-btn" type="button" onClick={() => save(false)} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</button>
              <button className="publish-btn" type="button" onClick={() => save(true)} disabled={saving}>{saving ? 'Publishing...' : 'Publish Project'}</button>
            </div>
          </div>
        </main>

        <aside>
          <div className="add-preview">
            <h4 style={{ marginTop: 0 }}>Preview</h4>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.02)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                {thumbPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={thumbPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="thumb" />
                ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>No image</div>}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{form.title || 'Project title'}</div>
                <div className="muted" style={{ fontSize: 13 }}>{(form.technologies || []).slice(0,4).join(', ') || 'Technologies'}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>Description</div>
              <div className="muted" style={{ marginTop: 6 }}>{form.description || 'Project description preview...'}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700 }}>Gallery</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {gallery.length === 0 ? <div className="muted">No gallery images</div> : gallery.map((g, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={g.url} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} alt={`g-${i}`} />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              { (form.slug || form.liveUrl) ? (
                <a
                  href={form.liveUrl || (form.slug ? `/projects/${form.slug}` : null)}
                  target="_blank"
                  rel="noreferrer"
                  className="tab-like"
                  onClick={(e) => {
                    const path = form.liveUrl || (form.slug ? `/projects/${form.slug}` : null);
                    if (!path) return;
                    e.preventDefault();
                    const url = path.startsWith('http') ? path : `${window.location.origin}${path}`;
                    const w = window.open(url, '_blank');
                    if (!w) window.location.assign(url);
                  }}
                >Open public</a>
              ) : null }
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="sec-btn" onClick={() => { setForm({ title: '', slug: '', summary: '', description: '', technologies: [], githubUrl: '', liveUrl: '', demoVideoUrl: '', repoVisibility: 'public', featured: false }); setThumb(null); setGallery([]); setTechInput(''); }}>Reset</button>
              <button className="sec-btn" onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ ...form, thumbnail: thumb ? 'uploaded' : null, gallery: gallery.length }, null, 2)); }}>Copy JSON</button>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
