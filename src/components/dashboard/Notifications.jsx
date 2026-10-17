import React, { useState } from 'react';
import { useRouter } from 'next/router';

const SAMPLE = [
  { id: 1, text: 'New sign-in from unknown device', time: '2m' },
  { id: 2, text: 'Project deployment succeeded', time: '1h' },
];

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleViewAll() {
    setOpen(false);
    router.push('/secure-console/messages');
  }

  return (
    <div className="notifications">
      <button className="notif-btn" onClick={() => setOpen((s) => !s)} aria-haspopup="true" aria-expanded={open}>
        🔔
      </button>

      {open && (
        <div className="notif-pop">
          <div className="notif-header">Notifications</div>
          <ul>
            {SAMPLE.map((n) => (
              <li key={n.id} className="notif-item">
                <div className="notif-text">{n.text}</div>
                <div className="notif-time">{n.time}</div>
              </li>
            ))}
          </ul>
          <button type="button" className="notif-footer" onClick={handleViewAll}>
            View all
          </button>
        </div>
      )}
    </div>
  );
}
