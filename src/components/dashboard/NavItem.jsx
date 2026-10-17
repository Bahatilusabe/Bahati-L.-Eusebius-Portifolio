import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function NavItem({ label, href, onClick, icon, collapsed }) {
  const router = useRouter();
  const active = href ? (router.pathname === href || router.pathname.startsWith(href + '/')) : false;

  // If href is not provided, render a non-clickable item (avoids Link href warning)
  if (!href) {
    return (
      <div className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={onClick} title={collapsed ? label : undefined}>
        <span className="nav-icon">{icon || '•'}</span>
        <span className="nav-label">{label}</span>
      </div>
    );
  }

  return (
    <Link href={href} className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={onClick} title={collapsed ? label : undefined}>
      <span className="nav-icon">{icon || '•'}</span>
      <span className="nav-label">{label}</span>
    </Link>
  );
}
