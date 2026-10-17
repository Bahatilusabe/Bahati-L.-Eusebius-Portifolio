import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogsPage() {
  const [items, setItems] = useState([]);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all'); // all, published, draft
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const publishedCount = items.filter((item) => item.published).length;
  const draftCount = items.filter((item) => !item.published).length;
  const categories = items.reduce((acc, item) => {
    const key = item.category || 'General';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
  const totalPages = Math.max(1, Math.ceil(total / 12));

  const stats = [
    { label: 'Total posts', value: total, hint: 'Total matching blog posts in the admin view.' },
    { label: 'Published', value: publishedCount, hint: 'Posts currently live on the public site.' },
    { label: 'Drafts', value: draftCount, hint: 'Draft posts saved for later publishing.' },
    { label: 'Top categories', value: topCategories.length, hint: 'Most frequent categories in this view.' },
  ];

  async function loadBlogs(searchText, statusFilter, pageNumber, mounted) {
    setLoading(true);
    try {
      const q = `search=${encodeURIComponent(searchText)}&status=${encodeURIComponent(statusFilter)}&page=${pageNumber}&limit=12`;
      const res = await fetch(`/api/admin/blogs?${q}`);
      const json = await res.json();
      if (!mounted.current) return;
      setItems(json.items || []);
      setTotal(json.total || 0);
    } catch (error) {
      console.error('fetch blogs', error?.message || error);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    const mounted = { current: true };
    const timer = setTimeout(() => loadBlogs(search, status, page, mounted), 200);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, [search, status, page]);

  useEffect(() => {
    const mounted = { current: true };
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((d) => {
        if (mounted.current && d?.offline) setOffline(true);
      })
      .catch(() => {})
      .finally(() => { mounted.current = false; });
  }, []);

  async function remove(id) {
    if (!confirm('Delete this blog?')) return;
    const res = await fetch('/api/admin/blogs?id=' + id, { method: 'DELETE' });
    if (!res.ok) return alert('Could not delete this post.');
    const newTotal = Math.max(0, total - 1);
    const nextPage = Math.min(page, Math.max(1, Math.ceil(newTotal / 12)));
    setPage(nextPage);
    await loadBlogs(search, status, nextPage, { current: true });
  }

  function formatDate(dt) {
    try {
      return new Date(dt).toLocaleDateString();
    } catch (e) { return ''; }
  }

  return (
    <Layout>
      <div className="page-header skills-header">
        <div>
          <h2 className="sci-title">Blog Management</h2>
          <p className="page-subtitle">Manage posts with clean controls, smart filters, and a modern admin preview.</p>
        </div>

        <div className="skills-actions">
          <div className="search-input">
            <input
              aria-label="Search blogs"
              placeholder="Search by title, category, or tag"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="filter-chips" role="tablist" aria-label="Status filters">
            <button className={`seg-btn ${status === 'all' ? 'active' : ''}`} onClick={() => { setStatus('all'); setPage(1); }}>All</button>
            <button className={`seg-btn ${status === 'published' ? 'active' : ''}`} onClick={() => { setStatus('published'); setPage(1); }}>Published</button>
            <button className={`seg-btn ${status === 'draft' ? 'active' : ''}`} onClick={() => { setStatus('draft'); setPage(1); }}>Draft</button>
          </div>

          <Link href="/secure-console/blogs/edit" className="tab-like primary">Create Blog</Link>
        </div>

        {offline ? <div className="muted" style={{ marginTop: 12 }}>Offline mode active — some operations may delay.</div> : null}
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="metric-card-head">
              <div>
                <div className="metric-label">{stat.label}</div>
                <div className="metric-hint muted">{stat.hint}</div>
              </div>
              <div className="metric-value">{stat.value}</div>
            </div>
            <div className="progress-pill">
              <div className="progress-fill" style={{ width: `${Math.min(100, stat.value * 8)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card insights-card skill-insights-card">
        <div className="insights-header">
          <div>
            <h3>Category snapshot</h3>
            <p className="muted">Track the most active blog categories in your current view.</p>
          </div>
          <div className="insights-score">{topCategories.length}</div>
        </div>

        {topCategories.length ? (
          <div className="category-preview-grid">
            {topCategories.map((category) => (
              <div key={category.label} className="category-preview-card">
                <div className="category-preview-name">{category.label}</div>
                <div className="category-preview-count">{category.count} post{category.count === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="messages-empty">No categories found for this filter.</div>
        )}
      </div>

      <div className="glass-card skill-table-card">
        <div className="message-table-header">
          <div>
            <h3>Blog library</h3>
            <p className="muted">{loading ? 'Refreshing posts…' : `Showing ${items.length} of ${total} posts.`}</p>
          </div>
          <div className="table-pager">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="tab-like" disabled={page === 1}>Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="tab-like" disabled={page >= totalPages}>Next</button>
          </div>
        </div>

        {loading ? (
          <div className="messages-empty">Loading posts…</div>
        ) : items.length === 0 ? (
          <div className="messages-empty">No posts matched your current filters.</div>
        ) : (
          <div className="blog-grid">
            {items.map((it, idx) => (
              <article key={it.id} className={`blog-card${it.boost ? ' image-boost' : ''}`}>
                <div className="blog-card-image">
                  {it.coverImage ? (
                    <Image src={it.coverImage} alt={it.title} fill sizes="(max-width: 600px) 100vw, 360px" loading={idx === 0 ? 'eager' : 'lazy'} style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="blog-card-fallback">No image</div>
                  )}
                </div>
                <div className="blog-card-body">
                  <div className="blog-card-head">
                    <div>
                      <h3>{it.title}</h3>
                      <div className="blog-card-summary">{it.excerpt || it.summary || 'No summary available.'}</div>
                    </div>
                    <span className={`status-badge ${it.published ? 'published' : 'draft'}`}>{it.published ? 'Published' : 'Draft'}</span>
                  </div>
                  <div className="blog-card-meta">
                    <span>{formatDate(it.publishedAt || it.createdAt)}</span>
                    <span>{it.readTime ? `${it.readTime} min read` : '—'}</span>
                    <span>{it.category || 'General'}</span>
                  </div>
                  <div className="card-actions">
                    <a
                      href={it.slug ? `/blog/${it.slug}` : `/blog/${it.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tab-like"
                      onClick={(e) => {
                        const path = it.slug ? `/blog/${it.slug}` : `/blog/${it.id}`;
                        e.preventDefault();
                        const url = path.startsWith('http') ? path : `${window.location.origin}${path}`;
                        console.debug('Attempting open public blog URL', { path, url });
                        const w = window.open(url, '_blank');
                        if (!w) window.location.assign(url);
                      }}
                    >View</a>
                    <Link href={`/secure-console/blogs/edit?id=${it.id}`} className="tab-like">Edit</Link>
                    <button onClick={() => remove(it.id)} className="tab-like danger">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
