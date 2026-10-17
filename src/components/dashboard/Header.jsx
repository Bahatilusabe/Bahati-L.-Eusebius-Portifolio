import React, { useState } from 'react';
import Image from 'next/image';
import { useTheme } from '../../hooks/useTheme';
import ProfileDropdown from './ProfileDropdown';
import Notifications from './Notifications';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="dashboard-header">
      <div className="topbar-spacer" />

      <div className="header-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        <Notifications />

        <div className="profile-wrap">
          <button className="profile-btn" onClick={() => setShowProfile((s) => !s)} aria-haspopup="true" aria-label="Open profile menu">
            <Image
              src="/d2ab966b-2e4b-405b-a112-7edf88584360 (1).png"
              alt="Admin avatar"
              width={40}
              height={40}
            />
          </button>
          {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
        </div>
      </div>
    </header>
  );
}
