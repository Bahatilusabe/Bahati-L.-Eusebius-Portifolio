import React, { useEffect, useState, useMemo, useRef } from 'react';
import Layout from '../../../components/dashboard/Layout';
import Link from 'next/link';
import Image from 'next/image';

export default function ProjectsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const mounted = useRef(true);

  const limit = 12;

  async function loadProjects(qSearch, qFilter, qPage) {
    setLoading(true);
    try {
      const qp = new URLSearchParams({ search: qSearch || '', page: String(qPage || 1), limit: String(limit), filter: qFilter || 'all' });
      const res = await fetch(`/api/admin/projects?${qp.toString()}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = res.status === 401
          ? 'Sign in to the admin console to manage projects.'
          : json?.error || `Unable to load projects (status ${res.status}).`;
        throw new Error(message);
      }
      if (!mounted.current) return;
      setLoadError('');
      setItems(json.items || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error('load projects', err);
      if (mounted.current) {
        setItems([]);
        setTotal(0);
        setLoadError(err.message || 'Unable to load projects.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => loadProjects(search, filter, page), 180);
    return () => { mounted.current = false; clearTimeout(t); };
  }, [search, page, filter]);

  const pages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total]);

  function toggleSelect(id) {
    setSelected((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  }

  function selectAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  async function bulkDelete() {
    if (selected.size === 0) return alert('No projects selected');
    if (!confirm(`Delete ${selected.size} selected projects?`)) return;
    const ids = Array.from(selected);
    try {
      const res = await fetch('/api/admin/projects/batch-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      if (!res.ok) throw new Error('Batch delete failed');
      setSelected(new Set());
      setPage(1);
      await loadProjects(search, filter, 1);
    } catch (err) {
      console.error(err);
      alert('Failed to delete selected projects');
    }
  }

  function topTechs(list) {
    const counts = (list || []).reduce((acc, p) => {
      (p.technologies || []).forEach((t) => { acc[t] = (acc[t] || 0) + 1; });
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, count]) => ({ label, count }));
  }

  const techPreview = topTechs(items);
  const publishedCount = items.filter((it) => it.published).length;
  const draftCount = items.filter((it) => !it.published).length;

  return (
    <Layout>
      <div className="page-header skills-header">
        <div>
          <h2 className="sci-title">Projects</h2>
          <p className="page-subtitle">A clean, data-focused view of your portfolio projects with fast filters and inline actions.</p>
        </div>

        <div className="skills-actions">
          <div className="search-input">
            <input placeholder="Search projects by title or tech" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div className="filter-chips" role="tablist">
            <button className={`seg-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setPage(1); }}>All</button>
            <button className={`seg-btn ${filter === 'published' ? 'active' : ''}`} onClick={() => { setFilter('published'); setPage(1); }}>Published</button>
            <button className={`seg-btn ${filter === 'draft' ? 'active' : ''}`} onClick={() => { setFilter('draft'); setPage(1); }}>Draft</button>
            <button className={`seg-btn ${filter === 'featured' ? 'active' : ''}`} onClick={() => { setFilter('featured'); setPage(1); }}>Featured</button>
          </div>

          <Link href="/secure-console/projects/add" className="tab-like primary">Add Project</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="metric-card">
          <div className="metric-card-head">
            <div>
              <div className="metric-label">Total projects</div>
              <div className="metric-hint muted">Projects in the current filter</div>
            </div>
            <div className="metric-value">{total}</div>
          </div>
          <div className="progress-pill"><div className="progress-fill" style={{ width: `${Math.min(100, total)}%` }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-head">
            <div>
              <div className="metric-label">Published</div>
              <div className="metric-hint muted">Live projects</div>
            </div>
            <div className="metric-value">{publishedCount}</div>
          </div>
          <div className="progress-pill"><div className="progress-fill" style={{ width: `${Math.min(100, publishedCount * 8)}%` }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-head">
            <div>
              <div className="metric-label">Drafts</div>
              <div className="metric-hint muted">Work in progress</div>
            </div>
            <div className="metric-value">{draftCount}</div>
          </div>
          <div className="progress-pill"><div className="progress-fill" style={{ width: `${Math.min(100, draftCount * 8)}%` }} /></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-head">
            <div>
              <div className="metric-label">Top techs</div>
              <div className="metric-hint muted">Most used technologies</div>
            </div>
            <div className="metric-value">{techPreview.length}</div>
          </div>
          <div className="progress-pill"><div className="progress-fill" style={{ width: `${Math.min(100, techPreview.length * 20)}%` }} /></div>
        </div>
      </div>

      <div className="glass-card skill-insights-card">
        <div className="insights-header">
          <div>
            <h3>Top technologies</h3>
            <p className="muted">Quick glance at the most common tech used across visible projects.</p>
          </div>
          <div className="insights-score">{techPreview.length}</div>
        </div>
        {techPreview.length ? (
          <div className="category-preview-grid">
            {techPreview.map((t) => (
              <div key={t.label} className="category-preview-card">
                <div className="category-preview-name">{t.label}</div>
                <div className="category-preview-count">{t.count} project{t.count === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="messages-empty">No technologies found.</div>
        )}
      </div>

      <div className="glass-card skill-table-card">
        <div className="message-table-header">
          <div>
            <h3>Project library</h3>
            <p className="muted">{loading ? 'Refreshing projects…' : `Showing ${items.length} of ${total} projects.`}</p>
          </div>
          <div className="table-pager">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="tab-like" disabled={page === 1}>Prev</button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="tab-like" disabled={page >= pages}>Next</button>
          </div>
        </div>

        {loading ? (
          <div className="messages-empty">Loading projects…</div>
        ) : loadError ? (
          <div className="messages-empty" role="alert">
            {loadError} <Link href="/secure-console/login">Sign in</Link>
          </div>
        ) : items.length === 0 ? (
          <div className="messages-empty">No projects found for this filter.</div>
        ) : (
          <div className="blog-grid">
            {items.map((it, idx) => {
              const publicUrl = it.liveUrl || (it.slug ? `/projects/${it.slug}` : `/projects/${it.id}`);
              const isLCP = idx === 0;
              return (
              <article key={it.id} className={`blog-card${it.featured ? ' image-boost' : ''}`}>
                <div className="blog-card-image">
                  {it.coverImage ? (
                    <Image src={it.coverImage} alt={it.title} fill sizes="(max-width: 600px) 100vw, 360px" loading={isLCP ? 'eager' : 'lazy'} style={{ objectFit: 'cover' }} />
                  ) : it.thumbnail ? (
                    <Image src={it.thumbnail} alt={it.title} fill sizes="(max-width: 600px) 100vw, 360px" loading={isLCP ? 'eager' : 'lazy'} style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="blog-card-fallback">No image</div>
                  )}
                </div>

                <div className="blog-card-body">
                  <div className="blog-card-head">
                    <div>
                      <h3><Link href={`/secure-console/projects/edit?id=${encodeURIComponent(it.id)}`}>{it.title}</Link></h3>
                      <div className="blog-card-summary">{it.summary || it.shortDescription || it.description || it.excerpt || 'No description'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: 8 }}>
                        <span className={`status-badge ${it.published ? 'published' : 'draft'}`}>{it.published ? 'Published' : 'Draft'}</span>
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>{it.createdAt ? new Date(it.createdAt).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>

                  <div className="blog-card-meta">
                    <div>{(it.technologies || []).slice(0, 3).join(', ')}</div>
                    <div className="muted">{it.repoVisibility === 'private' ? 'Private repository' : it.githubUrl ? 'Public repository' : 'No repository link'}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggleSelect(it.id)} />
                    </div>

                    <div className="card-actions">
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="tab-like"
                        onClick={(e) => {
                          if (!publicUrl) return;
                          e.preventDefault();
                          // normalize publicUrl which may be non-string (object/null)
                          let candidate = publicUrl;
                          if (typeof candidate !== 'string') {
                            if (candidate && (candidate.href || candidate.url)) candidate = candidate.href || candidate.url;
                            else candidate = String(candidate);
                          }
                          const url = candidate && candidate.startsWith('http') ? candidate : `${window.location.origin}${candidate.startsWith('/') ? candidate : `/${candidate}`}`;
                          console.debug('Attempting open public project URL', { publicUrl, candidate: candidate, url });
                          const w = window.open(url, '_blank');
                          if (!w) window.location.assign(url);
                        }}
                      >View</a>
                      <Link href={`/secure-console/projects/edit?id=${encodeURIComponent(it.id)}`} className="tab-like" aria-label={`Edit ${it.title}`}>Edit details</Link>
                      <button className="tab-like danger" onClick={async () => { if (confirm('Delete project?')) { const r = await fetch(`/api/admin/projects?id=${it.id}`, { method: 'DELETE' }); if (r.ok) { await loadProjects(search, filter, page); } else alert('Delete failed'); } }}>Delete</button>
                    </div>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div className="muted">Showing {items.length} of {total}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="sec-btn" onClick={selectAll}>{selected.size === items.length ? 'Unselect' : 'Select All'}</button>
            <button className="sec-btn" onClick={bulkDelete}>Delete Selected</button>
            <div style={{ marginLeft: 12 }}>
              <button className="tab-like" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button className="tab-like" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} style={{ marginLeft: 8 }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
