import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/dashboard/Layout';

const categories = ['General', 'Tech', 'Design', 'News', 'Tutorial'];

export default function BlogEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    coverImage: '',
    published: false,
    category: 'General',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!id) return;
    const mounted = { current: true };
    fetch(`/api/admin/blogs?id=${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Could not load this post.');
        return data;
      })
      .then((data) => {
        if (!mounted.current) return;
        if (!data?.item) throw new Error('Post details were not returned.');
        setItem({
          title: data.item.title || '',
          slug: data.item.slug || '',
          summary: data.item.summary || '',
          content: data.item.content || '',
          coverImage: data.item.coverImage || '',
          published: !!data.item.published,
          category: data.item.category || 'General',
          tags: Array.isArray(data.item.tags) ? data.item.tags : [],
        });
      })
      .catch((error) => {
        if (mounted.current) setMessage(error.message || 'Could not load this post.');
      })
      .finally(() => { mounted.current = false; });
    return () => { mounted.current = false; };
  }, [id]);

  function updateField(field, value) {
    setItem((current) => ({ ...current, [field]: value }));
  }

  function addTag() {
    const next = tagInput.trim();
    if (!next) return;
    setItem((current) => {
      const tags = Array.from(new Set([...(current.tags || []), next]));
      return { ...current, tags };
    });
    setTagInput('');
  }

  function removeTag(tag) {
    setItem((current) => ({ ...current, tags: (current.tags || []).filter((t) => t !== tag) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!item.title.trim()) return alert('Title is required.');
    if (!item.summary.trim()) return alert('Summary is required.');
    if (!item.content.trim()) return alert('Content is required.');

    setSaving(true);
    setMessage('');

    const payload = { ...item, published: !!item.published, id };
    try {
      const res = await fetch('/api/admin/blogs', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        if (!id && json?.id) {
          router.replace(`/secure-console/blogs/edit?id=${json.id}`);
          return;
        }
        router.push('/secure-console/blogs');
      } else {
        setMessage(json?.error || 'Save failed.');
      }
    } catch (error) {
      setMessage(error?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header skills-header">
        <div>
          <h2 className="sci-title">{id ? 'Edit Blog' : 'New Blog'}</h2>
          <p className="page-subtitle">Build a polished post with a strong title, descriptive summary, and clean metadata.</p>
        </div>
      </div>

      <div className="skill-edit-grid">
        <form onSubmit={handleSave} className="skill-form-card">
          <div className="section-title-row">
            <div>
              <h3>Post details</h3>
              <p className="muted">Write your blog metadata and configure publishing settings.</p>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Title</label>
            <input className="form-input" value={item.title} onChange={(e) => updateField('title', e.target.value)} />
          </div>

          <div className="form-row">
            <label className="form-label">Slug</label>
            <input className="form-input" value={item.slug} onChange={(e) => updateField('slug', e.target.value)} />
          </div>

          <div className="form-row">
            <label className="form-label">Summary</label>
            <textarea className="form-input" rows={4} value={item.summary} onChange={(e) => updateField('summary', e.target.value)} />
          </div>

          <div className="form-row">
            <label className="form-label">Content</label>
            <textarea className="form-input" rows={10} value={item.content} onChange={(e) => updateField('content', e.target.value)} />
          </div>

          <div className="form-row">
            <label className="form-label">Cover image URL</label>
            <input className="form-input" value={item.coverImage} onChange={(e) => updateField('coverImage', e.target.value)} />
          </div>

          <div className="form-row">
            <label className="form-label">Category</label>
            <select className="form-input" value={item.category} onChange={(e) => updateField('category', e.target.value)}>
              {!categories.includes(item.category) ? <option value={item.category}>{item.category}</option> : null}
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                className="form-input"
                placeholder="New tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              />
              <button type="button" className="sec-btn" onClick={addTag}>Add tag</button>
            </div>
            <div className="tag-list">
              {item.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={item.published} onChange={(e) => updateField('published', e.target.checked)} />
              {' '}Published
            </label>
            <span className="muted">Mark this post live when ready.</span>
          </div>

          {message ? <div className="form-message success">{message}</div> : null}

          <div className="form-actions">
            <button type="submit" className="tab-like primary" disabled={saving}>{saving ? 'Saving…' : 'Save Post'}</button>
            <button type="button" className="tab-like" onClick={() => router.push('/secure-console/blogs')}>Cancel</button>
          </div>
        </form>

        <div className="skill-preview-card blog-preview-card">
          <div className="section-title-row">
            <div>
              <h3>Live preview</h3>
              <p className="muted">Review the post card before publishing.</p>
            </div>
          </div>

          <div className="blog-preview-body">
            <div className="blog-preview-header">
              <div className="blog-preview-image">
                {item.coverImage ? (
                  <img src={item.coverImage} alt="Cover preview" />
                ) : (
                  <div className="blog-card-fallback">No image</div>
                )}
              </div>
              <div>
                <h3>{item.title || 'Pending title'}</h3>
                <p className="muted">{item.category || 'General'} · {item.published ? 'Published' : 'Draft'}</p>
              </div>
            </div>

            <p className="muted preview-text">{item.summary || 'Summary will appear here once you add it.'}</p>

            <div className="video-meta-grid">
              <div className="video-meta-card">
                <div className="metric-label">Slug</div>
                <div className="metric-value">{item.slug || 'auto-generated'}</div>
              </div>
              <div className="video-meta-card">
                <div className="metric-label">Tags</div>
                <div className="metric-value">{item.tags.length ? item.tags.join(', ') : 'No tags yet'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
