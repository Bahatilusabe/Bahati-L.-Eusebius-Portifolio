import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-app">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} onOpen={() => setMobileOpen(true)} />

      <div className="dashboard-main">
        <Header onOpenMobile={() => setMobileOpen(true)} />

        <main className="dashboard-content">{children}</main>
      </div>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </div>
  );
}
