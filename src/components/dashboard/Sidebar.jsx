import React, { useState, useEffect } from 'react';
import NavItem from './NavItem';

const NAV = [
  { label: 'Dashboard', href: '/secure-console/dashboard', icon: '📊' },
  { label: 'Projects', href: '/secure-console/projects', icon: '📁' },
  { label: 'About Me', href: '/secure-console/about', icon: '👤' },
  { label: 'Blogs', href: '/secure-console/blogs', icon: '📝' },
  { label: 'Videos', href: '/secure-console/videos', icon: '🎬' },
  { label: 'Skills', href: '/secure-console/skills', icon: '🧰' },
  { label: 'Messages', href: '/secure-console/messages', icon: '✉️' },
  { label: 'Settings', href: '/secure-console/settings', icon: '⚙️' },
];

export default function Sidebar({ open, onClose, onOpen }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebarCollapsed');
      setCollapsed(v === '1');
    } catch (e) { /* ignore */ }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem('sidebarCollapsed', n ? '1' : '0'); } catch (e) {}
      return n;
    });
  }

  return (
    <aside className={`dashboard-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} aria-hidden={!open}>
      <div className="sidebar-top">
        <div className="brand-block">
          <div className="brand">Bahati</div>
          <div className="brand-sub muted">Admin console</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="sidebar-collapse" onClick={toggleCollapsed} aria-label="Toggle collapse" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? '»' : '«'}
          </button>
        </div>
      </div>

      <div className="sidebar-user" aria-hidden={collapsed}>
        <div className="user-avatar">B</div>
        <div className="user-meta">
          <div className="user-name">Bahati Eusebius</div>
          <div className="user-role muted">Administrator</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <NavItem key={n.href} label={n.label} href={n.href} icon={n.icon} collapsed={collapsed} />
        ))}
      </nav>

      <div className="sidebar-footer" aria-hidden={collapsed}>© {new Date().getFullYear()} Bahati</div>
    </aside>
  );
}
