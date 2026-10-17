import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import Link from 'next/link';

export default function MessagesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const unreadCount = items.filter((it) => !it.read).length;
  const readRate = items.length ? Math.round(((items.length - unreadCount) / items.length) * 100) : 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const stats = [
    { label: 'Total messages', value: total, hint: 'All inbound inbox items from the contact form.' },
    { label: 'Unread', value: unreadCount, hint: 'Messages that still need attention.' },
    { label: 'Read rate', value: readRate, hint: 'Share of messages opened on this page.' },
    { label: 'Page', value: page, hint: 'Current page of search results.' },
  ];
  const activityMetrics = [
    { label: 'Unread', value: total ? Math.round((unreadCount / total) * 100) : 0 },
    { label: 'Read', value: total ? Math.round(((total - unreadCount) / total) * 100) : 0 },
    { label: 'Page load', value: items.length ? Math.min(100, Math.round((items.length / 10) * 100)) : 0 },
  ];

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      if (!mounted) return;
      setLoading(true);
      const res = await fetch(`/api/admin/messages?search=${encodeURIComponent(search)}&page=${page}&limit=10`);
      const json = await res.json();
      if (!mounted) return;
      setItems(json.items || []);
      setTotal(json.total || 0);
      setLoading(false);
    }, 200);
    return () => { mounted = false; clearTimeout(timer); };
  }, [search, page]);

  return (
    <Layout>
      <div className="page-header messages-header">
        <div>
          <h2 className="sci-title">Messages</h2>
          <p className="page-subtitle">Track inbound messages, prioritize unread contact requests, and keep your inbox workflow visible.</p>
        </div>

        <div className="messages-actions">
          <div className="search-input">
            <input
              placeholder="Search messages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
              <div className="progress-fill" style={{ width: `${Math.min(100, stat.value)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card insights-card message-summary-card">
        <div className="insights-header">
          <div>
            <h3>Inbox health</h3>
            <p className="muted">Understand message flow and prioritize the conversations that matter most.</p>
          </div>
          <div className="insights-score">{total ? `${readRate}%` : '0%'}</div>
        </div>

        <div className="bar-chart">
          {activityMetrics.map((item) => (
            <div key={item.label} className="bar-row">
              <span className="metric-label">{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${item.value}%` }} />
              </div>
              <span>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card message-table-card">
        <div className="message-table-header">
          <div>
            <h3>Recent messages</h3>
            <p className="muted">{loading ? 'Loading inbox...' : `Showing ${items.length} message${items.length === 1 ? '' : 's'} on this page.`}</p>
          </div>
          <div className="table-pager">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="tab-like"
              disabled={page === 1}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="tab-like"
              disabled={page === totalPages}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="messages-empty">{loading ? 'Searching for messages…' : 'No messages found for this filter.'}</div>
        ) : (
          <table className="message-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="message-from">
                    <Link href={`/secure-console/messages/${it.id}`}>
                      <a>
                        <div className="message-sender">
                          <span>{it.name}</span>
                          <small>{it.email}</small>
                        </div>
                      </a>
                    </Link>
                  </td>
                  <td>{it.subject || (it.body || '').slice(0, 72) || '(no subject)'}</td>
                  <td>{new Date(it.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${it.read ? 'read' : 'unread'}`}>
                      {it.read ? 'Read' : 'Unread'}
                    </span>
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
