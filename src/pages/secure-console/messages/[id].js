import React, { useEffect, useState } from 'react';
import Layout from '../../../components/dashboard/Layout';
import { useRouter } from 'next/router';

export default function MessageView() {
  const router = useRouter();
  const { id } = router.query;
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/admin/messages?id=${id}`);
      if (res.ok) setMsg(await res.json());
    })();
  }, [id]);

  async function mark(read) {
    await fetch('/api/admin/messages', { method: 'PUT', body: JSON.stringify({ id, read }), headers: { 'Content-Type': 'application/json' } });
    setMsg((m) => ({ ...m, read }));
  }

  async function remove() {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
    router.push('/secure-console/messages');
  }

  if (!msg) return <Layout><div className="glass-card message-detail-card">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="glass-card message-detail-card">
        <div className="message-detail-header">
          <div>
            <h2>{msg.subject || '(no subject)'}</h2>
            <div className="message-meta">
              <span>{msg.name}</span>
              <span className="meta-separator">•</span>
              <span>{msg.email}</span>
              <span className="meta-separator">•</span>
              <span>{new Date(msg.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="message-detail-status">
            <span className={`status-pill ${msg.read ? 'read' : 'unread'}`}>{msg.read ? 'Read' : 'Unread'}</span>
          </div>
        </div>

        <div className="message-body">{msg.body}</div>

        <div className="message-detail-actions">
          <button onClick={() => mark(true)} className="tab-like">Mark Read</button>
          <button onClick={() => mark(false)} className="tab-like">Mark Unread</button>
          <button onClick={remove} className="tab-like danger">Delete</button>
        </div>
      </div>
    </Layout>
  );
}
