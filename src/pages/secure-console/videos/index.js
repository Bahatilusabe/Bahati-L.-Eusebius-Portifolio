import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Layout from '../../../components/dashboard/Layout';
import Link from 'next/link';

export default function VideosPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const publishedVideos = items.filter((item) => item.published).length;
  const draftVideos = items.length - publishedVideos;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  const stats = [
    { label: 'Total videos', value: total, hint: 'All videos available in your admin library.' },
    { label: 'Published', value: publishedVideos, hint: 'Live videos currently visible to visitors.' },
    { label: 'Drafts', value: draftVideos, hint: 'Videos saved but not yet published.' },
    { label: 'Page size', value: 10, hint: 'Number of videos shown per page.' },
  ];

  async function loadVideos(searchText, pageNumber, mounted) {
    setLoading(true);
    const res = await fetch(`/api/admin/videos?search=${encodeURIComponent(searchText)}&page=${pageNumber}&limit=10`);
    const json = await res.json();
    if (!mounted.current) return;
    setItems(json.items || []);
    setTotal(json.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    const mounted = { current: true };
    const timer = setTimeout(() => loadVideos(search, page, mounted), 200);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, [search, page]);

  async function remove(id) {
    if (!confirm('Delete this video?')) return;
    const res = await fetch('/api/admin/videos?id=' + id, { method: 'DELETE' });
    if (!res.ok) return alert('Could not delete video');

    const newTotal = Math.max(0, total - 1);
    const nextPage = Math.min(page, Math.max(1, Math.ceil(newTotal / 10)));
    setPage(nextPage);
    await loadVideos(search, nextPage, { current: true });
  }

  return (
    <Layout>
      <div className="page-header skills-header">
        <div>
          <h2 className="sci-title">Videos</h2>
          <p className="page-subtitle">Manage uploaded videos, review published status, and keep your library polished.</p>
        </div>

        <div className="skills-actions">
          <div className="search-input">
            <input
              placeholder="Search videos"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Link href="/secure-console/videos/edit" className="tab-like primary">New Video</Link>
        </div>
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
              <div className="progress-fill" style={{ width: `${Math.min(100, (stat.value || 0) * 10)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card insights-card skill-insights-card">
        <div className="insights-header">
          <div>
            <h3>Recent spotlight</h3>
            <p className="muted">Fast glance at the newest or most important videos in your library.</p>
          </div>
          <div className="insights-score">{total} total</div>
        </div>

        <div className="bar-chart">
          {items.length ? items.slice(0, 4).map((video) => (
            <div key={video.id} className="bar-row">
              <span className="metric-label">{video.title || 'Untitled video'}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${video.published ? 100 : 30}%` }} />
              </div>
              <span className={`status-badge ${video.published ? 'published' : 'draft'}`}>
                {video.published ? 'Published' : 'Draft'}
              </span>
            </div>
          )) : (
            <div className="messages-empty">No videos yet. Add a new video to populate this view.</div>
          )}
        </div>
      </div>

      <div className="glass-card skill-table-card">
        <div className="message-table-header">
          <div>
            <h3>Video library</h3>
            <p className="muted">{loading ? 'Refreshing video list…' : `Showing ${items.length} of ${total} videos.`}</p>
          </div>
          <div className="table-pager">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="tab-like" disabled={page === 1}>Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="tab-like" disabled={page >= totalPages}>Next</button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="messages-empty">{loading ? 'Searching videos…' : 'No videos matched your filter.'}</div>
        ) : (
          <table className="message-table skill-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Thumbnail</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    {item.thumbnail ? (
                      <div className="video-thumb-wrap">
                        <Image src={item.thumbnail} alt={`Thumbnail for ${item.title}`} width={120} height={72} className="video-thumb" />
                      </div>
                    ) : <span className="muted">No thumbnail</span>}
                  </td>
                  <td>{item.youtubeUrl ? 'YouTube' : item.url ? 'Direct link' : 'Unknown'}</td>
                  <td>
                    <span className={`status-badge ${item.published ? 'published' : 'draft'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/secure-console/videos/edit?id=${item.id}`} className="tab-like">Edit</Link>
                    <button onClick={() => remove(item.id)} className="tab-like" style={{ marginLeft: 8 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
