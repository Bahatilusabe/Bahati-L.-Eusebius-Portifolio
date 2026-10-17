import React from 'react';
import NavItem from './NavItem';

const NAV = [
  { label: 'Dashboard', href: '/secure-console/dashboard' },
  { label: 'Projects', href: '/secure-console/projects' },
  { label: 'Blogs', href: '/secure-console/blogs' },
  { label: 'Videos', href: '/secure-console/videos' },
  { label: 'Skills', href: '/secure-console/skills' },
  { label: 'Messages', href: '/secure-console/messages' },
  { label: 'Settings', href: '/secure-console/settings' },
];

export default function MobileMenu({ onClose }) {
  return (
    <div className="mobile-menu" role="dialog" aria-modal>
      <div className="mobile-menu-inner">
        <div className="mobile-menu-head">
          <div className="brand">CyberAdmin</div>
          <button onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <nav className="mobile-nav">
          {NAV.map((n) => (
            <NavItem key={n.href} label={n.label} href={n.href} onClick={onClose} />
          ))}
        </nav>
      </div>
    </div>
  );
}
